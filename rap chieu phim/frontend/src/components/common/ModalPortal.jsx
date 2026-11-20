import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * ModalPortal - Component Modal chuẩn toàn hệ thống NIGHT MOVIE
 * Tự động đưa Modal ra ngoài document.body thông qua createPortal,
 * khắc phục triệt để lỗi Containing Block trên Safari macOS do thuộc tính transform/filter gây ra.
 *
 * @param {boolean} isOpen - Trạng thái hiển thị modal
 * @param {function} onClose - Hàm callback đóng modal (khi bấm X, bấm backdrop hoặc phím ESC)
 * @param {string|React.ReactNode} title - Tiêu đề Modal (nếu có)
 * @param {string|React.ReactNode} subtitle - Phụ đề dưới tiêu đề
 * @param {string} maxWidth - Độ rộng tối đa (mặc định: 'max-w-[680px]')
 * @param {boolean} showCloseButton - Hiển thị nút X cố định (mặc định: true)
 * @param {boolean} noPadding - Không bọc padding p-6 cho phần nội dung (mặc định: false)
 * @param {boolean} rawContainer - Chỉ dùng Portal và Backdrop, caller tự render thẻ div container (mặc định: false)
 * @param {string} className - Class tùy biến thêm cho container
 * @param {React.ReactNode} headerAction - Nút/phần tử phụ bên cạnh tiêu đề
 * @param {React.ReactNode} children - Nội dung bên trong modal
 */
export function ModalPortal({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = 'max-w-[680px]',
  showCloseButton = true,
  noPadding = false,
  rawContainer = false,
  className = '',
  zIndex = 99999,
  headerAction,
  children,
}) {
  const contentRef = useRef(null);

  // Cơ chế 1: Thoát Modal bằng phím tắt ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Cơ chế 2: Khóa cuộn trang nền khi mở Modal và phục hồi khi unmount
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow || 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Lớp phủ nền mờ (Overlay Backdrop)
  const overlayContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: zIndex,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        // Cơ chế 3: Click Outside (bấm ra ngoài vùng tối để đóng Modal)
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      {rawContainer ? (
        children
      ) : (
        <div
          ref={contentRef}
          className={`relative w-full ${maxWidth} max-h-[88vh] flex flex-col overflow-hidden rounded-2xl bg-[#12151f] border border-white/12 shadow-2xl animate-scale-up ${className}`}
          style={{
            position: 'relative',
            width: '100%',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: '16px',
            background: '#12151f',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Nút đóng (X) cố định ở góc trên bên phải */}
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-black/75 hover:bg-ruby-600 text-white backdrop-blur-md transition-all flex items-center justify-center border border-white/20 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
              title="Đóng cửa sổ (phím ESC)"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Header hiển thị khi có title */}
          {title && (
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#12151f] pr-16">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
                )}
              </div>
              {headerAction && <div>{headerAction}</div>}
            </div>
          )}

          {/* Body nội dung bên trong */}
          {noPadding ? (
            children
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return createPortal(overlayContent, document.body);
}
export default ModalPortal;
