import { BsCurrencyRupee } from 'react-icons/bs';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import HelpModal from './HelpModal';
import { FiHome, FiPlus, FiCreditCard, FiMessageSquare, FiFileText, FiShoppingCart, FiUpload, FiCheckCircle, FiUsers, FiActivity, FiPieChart, FiClipboard, FiShield, FiTrendingUp, FiZap, FiLogOut, FiHelpCircle, FiUser } from 'react-icons/fi';
import './Sidebar.css';

function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const developerLinks = [
        { path: '/developer/dashboard', icon: FiHome, label: 'Dashboard' },
        { path: '/developer/tasks', icon: FiClipboard, label: 'My Tasks' },
        { path: '/developer/create-task', icon: FiPlus, label: 'Create Task' },
        { path: '/developer/feedback', icon: FiMessageSquare, label: 'Feedback' },
        { path: '/developer/reports', icon: FiFileText, label: 'Reports' },
    ];

    const testerLinks = [
        { path: '/tester/dashboard', icon: FiHome, label: 'Dashboard' },
        { path: '/tester/marketplace', icon: FiShoppingCart, label: 'Marketplace' },
        { path: '/tester/my-tasks', icon: FiClipboard, label: 'My Tasks' },
        { path: '/tester/status', icon: FiCheckCircle, label: 'Task Status' },
        { path: '/tester/wallet', icon: BsCurrencyRupee, label: 'Wallet' },
    ];

    const adminLinks = [
        { path: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
        { path: '/admin/users', icon: FiUsers, label: 'Users' },
        { path: '/admin/requests', icon: FiZap, label: 'User Requests' },
        { path: '/admin/tasks', icon: FiActivity, label: 'Tasks' },
        { path: '/admin/verification', icon: FiShield, label: 'Verification' },
        { path: '/admin/support', icon: FiHelpCircle, label: 'Support Tickets' },
    ];

    const getLinks = () => {
        switch (user?.role) {
            case 'developer':
                return developerLinks;
            case 'tester':
                return testerLinks;
            case 'admin':
                return adminLinks;
            default:
                return [];
        }
    };

    const links = getLinks();

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div className="sidebar-overlay" onClick={onClose} />
            )}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="logo-icon">
                            <FiZap size={24} />
                        </div>
                        <span className="logo-text">TestFlow</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Menu</span>
                        <ul className="nav-list">
                            {links.map(link => (
                                <li key={link.path}>
                                    <NavLink
                                        to={link.path}
                                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                        onClick={onClose}
                                    >
                                        <link.icon size={20} className="nav-icon" />
                                        <span className="nav-label">{link.label}</span>
                                        {location.pathname === link.path && (
                                            <span className="nav-active-indicator" />
                                        )}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>


                </nav>

                <div className="sidebar-footer">
                    {user?.role !== 'admin' && (
                        <div className="sidebar-help" onClick={() => setIsHelpModalOpen(true)} style={{ cursor: 'pointer' }}>
                            <div className="help-icon">?</div>
                            <div className="help-content">
                                <p className="help-title">Need help?</p>
                                <p className="help-text">Contact administrator</p>
                            </div>
                        </div>
                    )}

                    <button className="sidebar-logout-btn" onClick={handleLogout}>
                        <FiLogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <HelpModal 
                isOpen={isHelpModalOpen} 
                onClose={() => setIsHelpModalOpen(false)} 
            />
        </>
    );
}

export default Sidebar;
