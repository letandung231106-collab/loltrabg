/**
 * NIGHT MOVIE – Supabase PostgreSQL Full Backup Script (Read-Only on DB)
 * Xuất riêng:
 *  1. schema_backup.sql   (DDL trích xuất trực tiếp từ pg_catalog / information_schema)
 *  2. data_backup.sql     (INSERT theo đúng thứ tự topo FK + setval sequences)
 *  3. data_backup.json    (Snapshot JSON toàn bộ 35 bảng NIGHT MOVIE)
 *  4. manifest.json       (Thời gian, phạm vi, số dòng từng bảng, dung lượng, SHA-256 & kết quả verify)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

// Thứ tự topo tuân thủ khóa ngoại (bảng cha trước, bảng con sau)
const NIGHT_MOVIE_TABLES_ORDERED = [
  'roles',
  'users',
  'customers',
  'employees',
  'movies',
  'cinema_rooms',
  'seats',
  'screening_schedules',
  'bookings',
  'booking_seats',
  'payments',
  'tickets',
  'equipment_types',
  'equipment',
  'incidents',
  'incident_histories',
  'maintenances',
  'room_inspections',
  'inspection_details',
  'work_shifts',
  'assignments',
  'notifications',
  'concession_items',
  'inventory_ingredients',
  'concession_recipes',
  'inventory_logs',
  'concession_orders',
  'concession_order_items',
  'booking_concessions',
  'shift_handovers',
  'kdm_licenses',
  'projector_lamp_logs',
  'turnaround_checklists',
  'movie_reviews',
  'payment_gateway_sessions',
];

function sqlLiteral(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

async function runBackup() {
  await db.testConnection();
  if (!db.getIsConnected() || !db.getIsSupabase()) {
    throw new Error('Không thể kết nối trực tiếp Supabase PostgreSQL. Dừng backup.');
  }

  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.resolve(__dirname, `../backups/supabase_${stamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const schemaLines = [
    `-- NIGHT MOVIE Supabase PostgreSQL Live Schema Backup`,
    `-- Generated At: ${now.toISOString()}`,
    `-- Scope: ${NIGHT_MOVIE_TABLES_ORDERED.length} NIGHT MOVIE tables in schema public`,
    ``,
  ];

  // 1. Export Functions in public
  const funcs = await db.query(`
    SELECT p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    ORDER BY p.proname
  `);
  schemaLines.push('-- === FUNCTIONS ===');
  for (const fn of funcs) {
    schemaLines.push(fn.def.trim() + ';\n');
  }

  // 2. Export Table DDL + Constraints + Indexes
  schemaLines.push('-- === TABLES ===');
  for (const tbl of NIGHT_MOVIE_TABLES_ORDERED) {
    const cols = await db.query(
      `SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = ?
       ORDER BY ordinal_position`,
      [tbl]
    );
    if (!cols || cols.length === 0) continue;

    const colDefs = cols.map((c) => {
      let typeStr = c.data_type;
      if (c.data_type === 'character varying' && c.character_maximum_length) {
        typeStr = `VARCHAR(${c.character_maximum_length})`;
      } else if (c.data_type === 'numeric' && c.numeric_precision) {
        typeStr = `NUMERIC(${c.numeric_precision},${c.numeric_scale || 0})`;
      }
      const nullStr = c.is_nullable === 'NO' ? ' NOT NULL' : '';
      const defStr = c.column_default ? ` DEFAULT ${c.column_default}` : '';
      return `  "${c.column_name}" ${typeStr}${nullStr}${defStr}`;
    });

    const cons = await db.query(
      `SELECT conname, pg_get_constraintdef(oid) AS condef
       FROM pg_constraint
       WHERE conrelid = to_regclass('public.' || quote_ident(?))
       ORDER BY contype, conname`,
      [tbl]
    );
    for (const con of cons || []) {
      colDefs.push(`  CONSTRAINT "${con.conname}" ${con.condef}`);
    }

    schemaLines.push(`CREATE TABLE IF NOT EXISTS "${tbl}" (\n${colDefs.join(',\n')}\n);\n`);

    const idxs = await db.query(
      `SELECT indexname, indexdef
       FROM pg_indexes
       WHERE schemaname = 'public' AND tablename = ?
         AND indexname NOT IN (
           SELECT conname FROM pg_constraint WHERE conrelid = to_regclass('public.' || quote_ident(?))
         )
       ORDER BY indexname`,
      [tbl, tbl]
    );
    for (const idx of idxs || []) {
      schemaLines.push(`${idx.indexdef.replace(/^CREATE INDEX /, 'CREATE INDEX IF NOT EXISTS ')};`);
    }
    schemaLines.push('');
  }

  // 3. Export Triggers
  const trgs = await db.query(`
    SELECT t.tgname, c.relname AS tbl, pg_get_triggerdef(t.oid) AS def
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND NOT t.tgisinternal
    ORDER BY c.relname, t.tgname
  `);
  schemaLines.push('-- === TRIGGERS ===');
  for (const tg of trgs || []) {
    schemaLines.push(`DROP TRIGGER IF EXISTS "${tg.tgname}" ON "${tg.tbl}";`);
    schemaLines.push(`${tg.def};\n`);
  }

  const schemaPath = path.join(backupDir, 'schema_backup.sql');
  fs.writeFileSync(schemaPath, schemaLines.join('\n'), 'utf8');

  // 4. Export Data (SQL + JSON) in topological FK order
  const dataSqlLines = [
    `-- NIGHT MOVIE Supabase PostgreSQL Full Data Backup`,
    `-- Generated At: ${now.toISOString()}`,
    `BEGIN;`,
    `-- Tạm vô hiệu trigger tồn kho khi restore dữ liệu inventory_logs gốc`,
    `ALTER TABLE IF EXISTS inventory_logs DISABLE TRIGGER trg_inventory_logs_ai;`,
    ``,
  ];
  const jsonSnapshot = {};
  const tableCounts = {};
  let totalRows = 0;

  for (const tbl of NIGHT_MOVIE_TABLES_ORDERED) {
    const rows = await db.query(`SELECT * FROM "${tbl}" ORDER BY 1`);
    jsonSnapshot[tbl] = rows;
    tableCounts[tbl] = rows.length;
    totalRows += rows.length;

    if (rows.length > 0) {
      const cols = Object.keys(rows[0]);
      const colList = cols.map((c) => `"${c}"`).join(', ');
      dataSqlLines.push(`-- Table: ${tbl} (${rows.length} rows)`);
      for (const r of rows) {
        const vals = cols.map((c) => sqlLiteral(r[c])).join(', ');
        dataSqlLines.push(`INSERT INTO "${tbl}" (${colList}) VALUES (${vals}) ON CONFLICT DO NOTHING;`);
      }
      dataSqlLines.push('');
    }
  }

  // Re-enable trigger + sync sequences
  dataSqlLines.push(`ALTER TABLE IF EXISTS inventory_logs ENABLE TRIGGER trg_inventory_logs_ai;`);
  dataSqlLines.push(`-- Sync Sequences`);
  const seqs = await db.query(`
    SELECT table_name, column_name, pg_get_serial_sequence(quote_ident(table_name), column_name) AS seq_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND column_default LIKE 'nextval(%'
    ORDER BY table_name
  `);
  for (const s of seqs || []) {
    if (!NIGHT_MOVIE_TABLES_ORDERED.includes(s.table_name) || !s.seq_name) continue;
    dataSqlLines.push(
      `SELECT setval('${s.seq_name}', COALESCE((SELECT MAX("${s.column_name}") FROM "${s.table_name}"), 1), true);`
    );
  }
  dataSqlLines.push(`COMMIT;`);

  const dataSqlPath = path.join(backupDir, 'data_backup.sql');
  const dataJsonPath = path.join(backupDir, 'data_backup.json');
  fs.writeFileSync(dataSqlPath, dataSqlLines.join('\n'), 'utf8');
  fs.writeFileSync(dataJsonPath, JSON.stringify(jsonSnapshot, null, 2), 'utf8');

  // 5. Non-destructive Restore Integrity Verification
  const parsedJson = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
  const insertLineCount = fs
    .readFileSync(dataSqlPath, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('INSERT INTO ')).length;
  const jsonRowSum = Object.values(parsedJson).reduce((s, arr) => s + arr.length, 0);
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const createTableCount = (schemaContent.match(/CREATE TABLE IF NOT EXISTS /g) || []).length;

  const verification = {
    tablesBackedUp: NIGHT_MOVIE_TABLES_ORDERED.length,
    createTableStatementsInSchema: createTableCount,
    liveRowTotal: totalRows,
    sqlInsertStatementsTotal: insertLineCount,
    jsonSnapshotRowTotal: jsonRowSum,
    exactMatch:
      createTableCount === NIGHT_MOVIE_TABLES_ORDERED.length &&
      insertLineCount === totalRows &&
      jsonRowSum === totalRows,
  };

  const manifest = {
    createdAt: now.toISOString(),
    scope: '35 NIGHT MOVIE tables in Supabase public schema (excluding 14 unrelated project tables)',
    backupDir,
    files: {
      schema_backup_sql: {
        bytes: fs.statSync(schemaPath).size,
        sha256: sha256File(schemaPath),
      },
      data_backup_sql: {
        bytes: fs.statSync(dataSqlPath).size,
        sha256: sha256File(dataSqlPath),
      },
      data_backup_json: {
        bytes: fs.statSync(dataJsonPath).size,
        sha256: sha256File(dataJsonPath),
      },
    },
    tableCounts,
    verification,
  };

  const manifestPath = path.join(backupDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  console.log('=== BACKUP COMPLETE ===');
  console.log(JSON.stringify(manifest, null, 2));
  process.exit(verification.exactMatch ? 0 : 1);
}

runBackup().catch((err) => {
  console.error('[BACKUP FAILED]', err);
  process.exit(1);
});
