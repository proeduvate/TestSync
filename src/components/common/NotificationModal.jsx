import { FiX, FiBell, FiCheck } from 'react-icons/fi';
import { formatRelativeTime } from '../../utils/helpers';
import './NotificationModal.css';

function NotificationModal({ isOpen, onClose, notifications, onMarkAllAsRead, onNotificationClick }) {
    if (!isOpen) return null;

    const unreadNotifications = notifications.filter(n => n.unread);
    const unreadCount = unreadNotifications.length;

    return (
        <div className="notification-dropdown" onClick={e => e.stopPropagation()}>
            <div className="notification-dropdown-header">
                <div className="notification-dropdown-title">
                    <FiBell className="notification-dropdown-icon" />
                    <h2>Notifications</h2>
                    {unreadCount > 0 && (
                        <span className="notification-badge-large">{unreadCount} New</span>
                    )}
                </div>
            </div>

            <div className="notification-dropdown-body">
                {unreadNotifications.length === 0 ? (
                    <div className="notification-empty">
                        <FiCheck size={48} className="notification-empty-icon" />
                        <p>You're all caught up!</p>
                    </div>
                ) : (
                    <div className="notification-list">
                        {unreadNotifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`notification-card ${notification.unread ? 'unread' : ''}`}
                                onClick={() => onNotificationClick && onNotificationClick(notification)}
                            >
                                <div className="notification-card-dot" />
                                <div className="notification-card-content">
                                    <div className="notification-card-header">
                                        <h3>{notification.title}</h3>
                                        <span className="notification-card-time">
                                            {formatRelativeTime(notification.time)}
                                        </span>
                                    </div>
                                    <p>{notification.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="notification-dropdown-footer">
                {unreadCount > 0 && (
                    <button className="btn btn-primary btn-sm btn-full" onClick={onMarkAllAsRead}>
                        Mark All as Read
                    </button>
                )}
            </div>
        </div>
    );
}

export default NotificationModal;
