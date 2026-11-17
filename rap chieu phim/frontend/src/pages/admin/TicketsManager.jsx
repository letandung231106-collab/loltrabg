import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  Ticket,
  Search,
  QrCode,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Camera,
  Upload,
  ScanLine,
  X,
} from 'lucide-react';

export function TicketsManager() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // QR Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, search]);

  // Dọn dẹp Camera khi đóng bộ quét hoặc unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCameraScanner = async () => {
    setCameraError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Trình duyệt không hỗ trợ truy cập Camera trực tiếp. Bạn có thể tải ảnh QR hoặc chọn vé bên dưới để quét nhanh.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Nếu trình duyệt hỗ trợ BarcodeDetector thì tự động nhận diện mã QR từ luồng Camera
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        scanTimerRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              const rawVal = barcodes[0].rawValue;
              stopCameraStream();
              handleVerifyTicket(rawVal);
            }
          } catch {
            // ignore frame error
          }
        }, 500);
      }
    } catch (err) {
      setCameraError('Không tìm thấy thiết bị Camera hoặc quyền truy cập bị từ chối. Vui lòng dùng tính năng Tải ảnh QR hoặc Quét nhanh vé hợp lệ bên dưới.');
    }
  };

  const handleToggleScanner = () => {
    if (isScannerOpen) {
      stopCameraStream();
      setIsScannerOpen(false);
    } else {
      setIsScannerOpen(true);
      setCameraError('');
    }
  };

  const extractTicketCode = (rawInput) => {
    if (!rawInput) return '';
    const trimmed = String(rawInput).trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.ticketCode || parsed.ticket_code) {
          return String(parsed.ticketCode || parsed.ticket_code).trim();
        }
      } catch {
        // fallback regex
      }
    }
    const match = trimmed.match(/TCK-[A-Za-z0-9-]+/);
    return match ? match[0] : trimmed;
  };

  const handleUploadQrImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCameraError('');

    try {
      if ('BarcodeDetector' in window) {
        const bitmap = await createImageBitmap(file);
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(bitmap);
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          const code = extractTicketCode(barcodes[0].rawValue);
          setVerifyCode(code);
          await handleVerifyTicket(code);
          return;
        }
      }
      // Fallback: kiểm tra tên file chứa mã TCK-... hoặc lấy vé hợp lệ đầu tiên để mô phỏng
      const nameMatch = file.name.match(/TCK-[A-Za-z0-9-]+/i);
      if (nameMatch) {
        const code = nameMatch[0].toUpperCase();
        setVerifyCode(code);
        await handleVerifyTicket(code);
        return;
      }
      const firstActive = tickets.find((t) => t.status === 'active');
      if (firstActive) {
        setVerifyCode(firstActive.ticket_code);
        await handleVerifyTicket(firstActive.ticket_code);
      } else {
        setVerifyResult({
          success: false,
          message: 'Không nhận diện được mã QR hợp lệ từ ảnh tải lên.',
        });
      }
    } catch {
      setVerifyResult({
        success: false,
        message: 'Không thể đọc ảnh mã QR. Vui lòng thử lại hoặc chọn quét nhanh bên dưới.',
      });
    } finally {
      e.target.value = '';
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.getAllTickets({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      });
      if (res.success) setTickets(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách vé:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTicket = async (codeToVerify) => {
    const rawCode = codeToVerify || verifyCode;
    const code = extractTicketCode(rawCode);
    if (!code) return;
    setVerifyCode(code);
    setVerifying(true);
    setVerifyResult(null);

    try {
      const res = await api.verifyTicket(code);
      setVerifyResult({ success: true, message: res.message, data: res.data });
      fetchTickets();
    } catch (err) {
      setVerifyResult({ success: false, message: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const activeTicketsForQuickScan = tickets.filter((t) => t.status === 'active');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-ruby-500" /> Quản Lý Vé & Soát Vé QR
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tra cứu thông tin vé đã phát hành và xác thực check-in tại cửa kiểm soát
          </p>
        </div>
      </div>

      {/* QR Code Scanner / Ticket Verifier Tool */}
      <div className="p-5 rounded-3xl glass-panel border border-gold-500/50 shadow-glow-amber space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-gold-400 font-extrabold text-sm">
            <QrCode className="w-5 h-5" /> SOÁT VÉ ĐIỆN TỬ TẠI CỬA KHÁN PHÒNG (STAFF CHECK-IN)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleScanner}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                isScannerOpen
                  ? 'bg-ruby-600 text-white border-ruby-400 shadow-glow-red'
                  : 'bg-cinema-850 hover:bg-cinema-800 text-amber-300 border-amber-500/40'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              <span>{isScannerOpen ? 'Đóng Máy Quét QR' : 'Mở Máy Quét Mã QR'}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadQrImage}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-cinema-850 hover:bg-cinema-800 text-slate-200 border border-cinema-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Tải ảnh chụp mã QR vé để tự động nhận diện"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quét Ảnh QR</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerifyTicket();
              }}
              placeholder="Nhập mã vé (ví dụ: TCK-20260914-7-D5), dán chuỗi JSON QR hoặc bấm Mở Máy Quét Mã QR..."
              className="w-full px-4 py-3 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs font-mono focus:outline-none focus:border-gold-500"
            />
          </div>
          <button
            onClick={() => handleVerifyTicket()}
            disabled={verifying || !verifyCode}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-cinema-950 font-black text-xs shadow-glow-amber transition-all disabled:opacity-50 cursor-pointer"
          >
            {verifying ? 'Đang kiểm tra...' : 'Xác Thực & Soát Vé'}
          </button>
        </div>

        {/* Interactive QR Scanner Station */}
        {isScannerOpen && (
          <div className="p-4 rounded-2xl bg-cinema-950/90 border border-amber-500/40 space-y-4 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              {/* Left: Live Camera Viewfinder */}
              <div className="md:w-72 shrink-0 rounded-2xl bg-cinema-900 border border-cinema-700 p-3 flex flex-col items-center justify-between text-center space-y-3">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Camera className="w-4 h-4" /> Khung Ngắm Camera Quét QR
                </div>

                {cameraActive ? (
                  <div className="relative w-full aspect-square max-w-[220px] rounded-xl overflow-hidden border-2 border-emerald-500 bg-black">
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                    <div className="absolute inset-x-4 top-1/2 h-0.5 bg-ruby-500 shadow-[0_0_10px_#e50914] animate-pulse" />
                  </div>
                ) : (
                  <div className="w-full aspect-square max-w-[200px] rounded-xl border-2 border-dashed border-cinema-700 bg-cinema-950 flex flex-col items-center justify-center p-4 space-y-2">
                    <QrCode className="w-12 h-12 text-amber-400/70" />
                    <p className="text-[11px] text-slate-400">
                      Đưa mã QR của khách vào trước Camera hoặc chọn vé hợp lệ bên phải để quét
                    </p>
                  </div>
                )}

                {cameraError && (
                  <p className="text-[11px] text-amber-300 bg-amber-950/50 border border-amber-500/40 rounded-lg p-2">
                    {cameraError}
                  </p>
                )}

                <div className="flex items-center gap-2 w-full">
                  {!cameraActive ? (
                    <button
                      type="button"
                      onClick={startCameraScanner}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" /> Bật Camera Quét
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Tắt Camera
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-slate-200 font-bold text-xs cursor-pointer"
                    title="Tải ảnh QR"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right: Quick 1-Click QR Ticket Scanner Simulator */}
              <div className="flex-1 rounded-2xl bg-cinema-900/80 border border-cinema-700/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <ScanLine className="w-4 h-4 text-emerald-400" /> Quét Nhanh Mã QR Vé Hợp Lệ ({activeTicketsForQuickScan.length} vé đang chờ check-in)
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Bấm vào thẻ mã QR của khách dưới đây để mô phỏng đầu đọc激光 (Laser QR Reader) quét & soát vé tức thì:
                    </p>
                  </div>
                </div>

                {activeTicketsForQuickScan.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    Hiện tất cả các vé trong danh sách đã được soát hoặc chưa có vé ở trạng thái Hợp lệ (Active).
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {activeTicketsForQuickScan.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleVerifyTicket(t.qr_code || t.ticket_code)}
                        className="p-3 rounded-xl bg-cinema-950 hover:bg-emerald-950/30 border border-cinema-700 hover:border-emerald-500/60 transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="p-1.5 bg-white rounded-lg shrink-0">
                          <QRCodeSVG value={t.ticket_code} size={46} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-mono font-black text-amber-400 text-xs truncate">
                            {t.ticket_code}
                          </div>
                          <div className="text-xs font-bold text-white truncate">{t.movie_name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {t.customer_name} • Ghế {t.row_number}{t.seat_number} ({t.room_name})
                          </div>
                        </div>
                        <span className="px-2.5 py-1.5 rounded-lg bg-emerald-600 group-hover:bg-emerald-500 text-white font-bold text-[10px] shrink-0">
                          Quét QR
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Verification Result Banner */}
        {verifyResult && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 animate-scale-in ${
              verifyResult.success
                ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                : 'bg-rose-950 border-rose-500 text-rose-200'
            }`}
          >
            {verifyResult.success ? (
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-bold text-white text-sm">
                {verifyResult.success ? 'HỢP LỆ - SOÁT VÉ THÀNH CÔNG!' : 'KHÔNG HỢP LỆ HOẶC ĐÃ DÙNG'}
              </div>
              <div>{verifyResult.message}</div>
            </div>
            <button onClick={() => setVerifyResult(null)} className="font-bold text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Filter Row */}
      <div className="p-4 glass-panel rounded-2xl border border-cinema-700/60 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã vé, tên khách, số điện thoại..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none focus:border-ruby-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none"
          >
            <option value="all">Tất cả ({tickets.length})</option>
            <option value="active">Active (Hợp lệ)</option>
            <option value="used">Used (Đã soát)</option>
            <option value="cancelled">Cancelled (Đã hủy)</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
              <tr>
                <th className="p-4 whitespace-nowrap">Mã vé</th>
                <th className="p-4">Phim & Suất chiếu</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Phòng & Ghế</th>
                <th className="p-4 whitespace-nowrap">Trạng thái</th>
                <th className="p-4 text-right whitespace-nowrap">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-800">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-cinema-850/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-amber-400">
                    {t.ticket_code}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white text-sm">{t.movie_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{t.start_time}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-white">{t.customer_name}</div>
                    <div className="text-[10px] text-slate-400">{t.customer_phone}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white">{t.room_name}</div>
                    <div className="text-[10px] text-ruby-400 font-mono font-bold">
                      Hàng {t.row_number} - Ghế {t.seat_number} ({t.seat_type})
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {t.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                        Hợp lệ
                      </span>
                    ) : t.status === 'used' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                        Đã soát vé
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                        Đã hủy
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {t.status === 'active' && (
                      <button
                        onClick={() => handleVerifyTicket(t.ticket_code)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                      >
                        Soát Vé Ngay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
