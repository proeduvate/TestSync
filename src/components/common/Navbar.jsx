import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiX, FiBell, FiChevronDown, FiLogOut, FiUser } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import { getInitials } from '../../utils/helpers';
import NotificationModal from './NotificationModal';
import { useNotifications } from '../../context/NotificationContext';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

function Navbar({ onMenuToggle, isSidebarOpen }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);
    const notificationRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();

    const handleNotificationClick = (notification) => {
        if (notification.unread) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
        setIsNotificationOpen(false);
    };


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getRoleLabel = (role) => {
        const labels = {
            developer: 'Developer',
            tester: 'Tester',
            admin: 'Administrator'
        };
        return labels[role] || role;
    };

    // Get current page title
    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('dashboard')) return 'Dashboard';
        if (path.includes('create-task')) return 'Create Task';
        if (path.includes('marketplace')) return 'Task Marketplace';
        if (path.includes('requests/')) return 'Applicant Review';
        if (path.includes('requests')) return 'User Requests';
        if (path.includes('users')) return 'User Management';
        if (path.includes('analytics')) return 'Analytics';
        if (path.includes('payment')) return 'Payment';
        if (path.includes('feedback')) return 'Feedback';
        if (path.includes('proof')) return 'Proof Submission';
        if (path.includes('wallet')) return 'Wallet';
        if (path.endsWith('/tasks') || path.includes('my-tasks')) return 'My Tasks';
        return 'Dashboard';
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <button
                    className="navbar-menu-btn"
                    onClick={onMenuToggle}
                    aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                >
                    {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                </button>

                <div className="navbar-breadcrumb">
                    <span className="navbar-page-title">{getPageTitle()}</span>
                </div>
            </div>

            <div className="navbar-right">
                <ThemeToggle />
                
                {/* Notifications */}
                <div className="navbar-notification-container" ref={notificationRef}>
                    <button
                        className={`navbar-icon-btn ${isNotificationOpen ? 'active' : ''}`}
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        aria-label="Notifications"
                    >
                        <FiBell size={20} />
                        {unreadCount > 0 && (
                            <span className="notification-badge">{unreadCount}</span>
                        )}
                    </button>

                    <NotificationModal 
                        isOpen={isNotificationOpen} 
                        onClose={() => setIsNotificationOpen(false)} 
                        notifications={notifications}
                        onMarkAllAsRead={markAllAsRead}
                        onNotificationClick={handleNotificationClick}
                    />
                </div>

                {/* Profile dropdown */}
                <div className="navbar-profile-container" ref={profileRef}>
                    <button 
                        className={`navbar-profile-btn ${isProfileOpen ? 'active' : ''}`}
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                        <div className="avatar sm">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} />
                            ) : (
                                getInitials(user?.name || 'User')
                            )}
                        </div>
                        <div className="navbar-profile-info">
                            <span className="navbar-profile-name">{user?.name || 'User'}</span>
                            <span className="navbar-profile-role">{getRoleLabel(user?.role)}</span>
                        </div>
                        <FiChevronDown 
                            className={`chevron-icon ${isProfileOpen ? 'rotated' : ''}`} 
                            size={16} 
                        />
                    </button>

                    {isProfileOpen && (
                        <div className="navbar-profile-dropdown">
                            <div className="dropdown-header">
                                <Link to={`/${user?.role}/profile`} className="dropdown-user-link" onClick={() => setIsProfileOpen(false)}>
                                    <div className="dropdown-avatar">
                                        {user?.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.name} />
                                        ) : (
                                            getInitials(user?.name || 'U')
                                        )}
                                    </div>
                                    <div className="dropdown-user-info">
                                        <p className="dropdown-user-name">{user?.name}</p>
                                        <p className="dropdown-view-profile">View Profile</p>
                                    </div>
                                </Link>
                            </div>
                            <div className="dropdown-divider" />
                            <button className="dropdown-item logout" onClick={handleLogout}>
                                <FiLogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </nav>
    );
}

export default Navbar;
