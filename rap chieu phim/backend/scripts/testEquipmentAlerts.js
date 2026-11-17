const { query } = require('../config/database');
const equipmentController = require('../controllers/equipmentController');

async function run() {
  console.log('Testing equipment alerts...');
  const req = {};
  let responseData = null;
  const res = {
    status: (code) => ({
      json: (data) => {
        responseData = data;
        return data;
      }
    })
  };
  const next = (err) => {
    if (err) {
      console.error('Next error:', err);
      process.exit(1);
    }
  };

  await equipmentController.getMaintenanceAlerts(req, res, next);
  console.log('Alert count:', responseData?.data?.length);
  console.log('Alert items:');
  responseData.data.forEach((e) => {
    console.log(`- ID: ${e.id} | Name: ${e.name} | Status: ${e.status} | Next: ${e.next_maintenance} | Days: ${e.days_until_maintenance} | Reason: ${e.alert_reason}`);
  });

  const brokenCount = responseData.data.filter(e => e.alert_reason === 'broken').length;
  const overdueCount = responseData.data.filter(e => e.alert_reason === 'overdue').length;
  const dueSoonCount = responseData.data.filter(e => e.alert_reason === 'due_soon').length;
  const checkNeededCount = responseData.data.filter(e => e.alert_reason === 'check_needed').length;

  console.log(`Summary: broken=${brokenCount}, check_needed=${checkNeededCount}, overdue=${overdueCount}, due_soon=${dueSoonCount}`);

  if (brokenCount < 1 || overdueCount < 1 || dueSoonCount < 1) {
    throw new Error('Missing alert types!');
  }
  console.log('ALL EQUIPMENT ALERT TESTS PASSED!');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
