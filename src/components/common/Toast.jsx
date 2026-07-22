import { createContext, useContext, useState, useCallback } from 'react';
import { FiX, FiCheck, FiAlertCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import './Toast.css';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
        const id = ++toastId;
        const newToast = { id, type, title, message };

        setToasts(prev => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const success = useCallback((title, message) => {
        return addToast({ type: 'success', title, message });
    }, [addToast]);

    const error = useCallback((title, message) => {
        return addToast({ type: 'error', title, message });
    }, [addToast]);

    const warning = useCallback((title, message) => {
        return addToast({ type: 'warning', title, message });
    }, [addToast]);

    const info = useCallback((title, message) => {
        return addToast({ type: 'info', title, message });
    }, [addToast]);

    const value = {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <FiCheck size={20} />;
            case 'error': return <FiAlertCircle size={20} />;
            case 'warning': return <FiAlertTriangle size={20} />;
            default: return <FiInfo size={20} />;
        }
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast ${toast.type}`}>
                        <span className="toast-icon">{getIcon(toast.type)}</span>
                        <div className="toast-content">
                            <p className="toast-title">{toast.title}</p>
                            {toast.message && <p className="toast-message">{toast.message}</p>}
                        </div>
                        <button
                            className="toast-close"
                            onClick={() => removeToast(toast.id)}
                            aria-label="Close"
                        >
                            <FiX size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export default ToastProvider;
