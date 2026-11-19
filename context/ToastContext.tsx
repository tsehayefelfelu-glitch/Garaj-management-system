import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ModalPopupOptions {
  title?: string;
  message: string;
  type?: ToastType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  showModalPopup: (options: ModalPopupOptions) => void;
  closeModalPopup: () => void;
  confirmModal: (
    message: string,
    title?: string,
    type?: ToastType,
    confirmText?: string,
    cancelText?: string
  ) => Promise<boolean>;
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
}

let globalShowToast: ((message: string, type?: ToastType, title?: string) => void) | null = null;
let globalConfirmModalHandler: (
  (message: string, title?: string, type?: ToastType, confirmText?: string, cancelText?: string) => Promise<boolean>
) | null = null;

export const globalToast = {
  success: (message: string, title?: string) => globalShowToast?.(message, 'success', title),
  error: (message: string, title?: string) => globalShowToast?.(message, 'error', title),
  warning: (message: string, title?: string) => globalShowToast?.(message, 'warning', title),
  info: (message: string, title?: string) => globalShowToast?.(message, 'info', title),
};

export const confirmModal = (
  message: string,
  title: string = 'Please Confirm',
  type: ToastType = 'warning',
  confirmText: string = 'Yes, Proceed',
  cancelText: string = 'Cancel'
): Promise<boolean> => {
  if (globalConfirmModalHandler) {
    return globalConfirmModalHandler(message, title, type, confirmText, cancelText);
  }
  return Promise.resolve(window.confirm(message));
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modalPopup, setModalPopup] = useState<ModalPopupOptions | null>(null);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (
    message: string,
    type: ToastType = 'info',
    title?: string,
    duration: number = 4000
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = {
      id,
      type,
      title: title || getDefaultTitle(type),
      message,
      duration,
    };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const getDefaultTitle = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error Notice';
      case 'warning':
        return 'Attention Required';
      case 'info':
      default:
        return 'Information';
    }
  };

  const toast = {
    success: (message: string, title?: string) => showToast(message, 'success', title),
    error: (message: string, title?: string) => showToast(message, 'error', title),
    warning: (message: string, title?: string) => showToast(message, 'warning', title),
    info: (message: string, title?: string) => showToast(message, 'info', title),
  };

  const showModalPopup = (options: ModalPopupOptions) => {
    setModalPopup(options);
  };

  const closeModalPopup = () => {
    setModalPopup(null);
  };

  const confirmModalLocal = (
    message: string,
    title: string = 'Please Confirm',
    type: ToastType = 'warning',
    confirmText: string = 'Yes, Proceed',
    cancelText: string = 'Cancel'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalPopup({
        title,
        message,
        type,
        confirmText,
        cancelText,
        onConfirm: () => {
          setModalPopup(null);
          resolve(true);
        },
        onCancel: () => {
          setModalPopup(null);
          resolve(false);
        },
      });
    });
  };

  useEffect(() => {
    globalShowToast = showToast;
    globalConfirmModalHandler = confirmModalLocal;

    if (typeof window !== 'undefined') {
      window.alert = (msg: any) => {
        const text = String(msg || '');
        const lower = text.toLowerCase();
        let type: ToastType = 'info';

        if (
          lower.includes('error') ||
          lower.includes('fail') ||
          lower.includes('not found') ||
          lower.includes('incorrect') ||
          lower.includes('shortage') ||
          lower.includes('denied') ||
          lower.includes('restricted')
        ) {
          type = 'error';
        } else if (
          lower.includes('success') ||
          lower.includes('successfully') ||
          lower.includes('created') ||
          lower.includes('saved') ||
          lower.includes('updated') ||
          lower.includes('deleted') ||
          lower.includes('received')
        ) {
          type = 'success';
        } else if (
          lower.includes('please') ||
          lower.includes('select') ||
          lower.includes('warning') ||
          lower.includes('required')
        ) {
          type = 'warning';
        }

        showToast(text, type);
      };
    }
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        showModalPopup,
        closeModalPopup,
        confirmModal: confirmModalLocal,
        toast,
      }}
    >
      {children}

      {/* Floating Modern Popup Notifications (Toasts) */}
      <div
        className="toast-container position-fixed top-0 end-0 p-3"
        style={{ zIndex: 99999, pointerEvents: 'none', maxWidth: '420px', width: '100%' }}
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`modern-popup-card shadow-lg mb-2 rounded-3 border-0 overflow-hidden d-flex flex-column animate-slide-down ${item.type}`}
            style={{
              pointerEvents: 'auto',
              background: '#ffffff',
              boxShadow: '0 12px 35px -4px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)',
              borderLeft: `5px solid ${getBorderColor(item.type)}`,
            }}
          >
            <div className="d-flex align-items-start p-3 gap-3">
              <div
                className="popup-icon-circle rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '38px',
                  height: '38px',
                  backgroundColor: getBgColor(item.type),
                  color: getBorderColor(item.type),
                }}
              >
                <i className={`${getIconClass(item.type)} fs-5`}></i>
              </div>

              <div className="flex-grow-1 pe-2">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <h6
                    className="mb-0 fw-bold"
                    style={{ color: getBorderColor(item.type), fontSize: '0.95rem' }}
                  >
                    {item.title}
                  </h6>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Just now
                  </small>
                </div>
                <p className="mb-0 text-secondary" style={{ fontSize: '0.88rem', lineHeight: '1.4' }}>
                  {item.message}
                </p>
              </div>

              <button
                type="button"
                className="btn-close btn-close-sm flex-shrink-0 opacity-75"
                style={{ fontSize: '0.75rem', marginTop: '2px' }}
                onClick={() => removeToast(item.id)}
                aria-label="Close"
              ></button>
            </div>

            {/* Countdown line */}
            <div
              className="popup-progress-bar"
              style={{
                height: '3px',
                backgroundColor: getBorderColor(item.type),
                animation: `shrinkWidth ${item.duration || 4000}ms linear forwards`,
              }}
            ></div>
          </div>
        ))}
      </div>

      {/* Centered Modal Popup for Confirmations / Critical Alerts */}
      {modalPopup && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 100000,
          }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden text-center p-4">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: getBgColor(modalPopup.type || 'warning'),
                  color: getBorderColor(modalPopup.type || 'warning'),
                }}
              >
                <i className={`${getIconClass(modalPopup.type || 'warning')} fs-2`}></i>
              </div>

              <h5 className="fw-bold text-dark mb-2">
                {modalPopup.title || getDefaultTitle(modalPopup.type || 'warning')}
              </h5>
              <p className="text-secondary mb-4" style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>
                {modalPopup.message}
              </p>

              <div className="d-flex gap-2 justify-content-center">
                {modalPopup.cancelText && (
                  <button
                    type="button"
                    className="btn btn-light border px-4 py-2 rounded-3 fw-semibold text-secondary"
                    onClick={() => {
                      modalPopup.onCancel?.();
                      closeModalPopup();
                    }}
                  >
                    {modalPopup.cancelText}
                  </button>
                )}
                <button
                  type="button"
                  className="btn px-4 py-2 rounded-3 fw-semibold text-white shadow-sm"
                  style={{ backgroundColor: getBorderColor(modalPopup.type || 'warning') }}
                  onClick={() => {
                    modalPopup.onConfirm?.();
                    closeModalPopup();
                  }}
                >
                  {modalPopup.confirmText || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

function getBorderColor(type: ToastType): string {
  switch (type) {
    case 'success':
      return '#10b981'; // Emerald Green
    case 'error':
      return '#ef4444'; // Red
    case 'warning':
      return '#f59e0b'; // Amber
    case 'info':
    default:
      return '#0d6efd'; // Wise Digital Royal Blue
  }
}

function getBgColor(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'rgba(16, 185, 129, 0.12)';
    case 'error':
      return 'rgba(239, 68, 68, 0.12)';
    case 'warning':
      return 'rgba(245, 158, 11, 0.12)';
    case 'info':
    default:
      return 'rgba(13, 110, 253, 0.12)';
  }
}

function getIconClass(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'bi bi-check-circle-fill';
    case 'error':
      return 'bi bi-x-circle-fill';
    case 'warning':
      return 'bi bi-exclamation-triangle-fill';
    case 'info':
    default:
      return 'bi bi-info-circle-fill';
  }
}
