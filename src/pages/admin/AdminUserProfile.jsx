import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import {
    FiArrowLeft, FiUser, FiMail, FiCalendar, FiShield,
    FiActivity, FiEdit2, FiCheck, FiX, FiTrash2,
    FiBriefcase, FiStar, FiDollarSign, FiCheckCircle
} from 'react-icons/fi';
import './AdminUserProfile.css';

function AdminUserProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await usersAPI.get(userId);
                setUser(res.user);
            } catch (err) {
                toast.error('Error', 'Could not load user profile.');
                navigate('/admin/users');
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, [userId]);

    const handleStatusChange = async (newStatus) => {
        setActionLoading(true);
        try {
            await usersAPI.update(userId, { status: newStatus });
            setUser(prev => ({ ...prev, status: newStatus }));
            toast.success('Status Updated', `User status changed to ${newStatus}.`);
        } catch (err) {
            toast.error('Error', err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
        setActionLoading(true);
        try {
            await usersAPI.delete(userId);
            toast.success('User Deleted', 'The user has been permanently removed.');
            navigate('/admin/users');
        } catch (err) {
            toast.error('Deletion Failed', err.message);
            setActionLoading(false);
        }
    };

    if (loading) return <Loader />;
    if (!user) return null;

    const getStatusBadge = (status) => {
        const map = {
            active: 'success', inactive: 'secondary',
            suspended: 'danger', pending: 'warning',
        };
        return <Badge variant={map[status] || 'secondary'}>{status}</Badge>;
    };

    const getRoleBadge = (role) => {
        const map = { developer: 'primary', tester: 'secondary', admin: 'info' };
        return <Badge variant={map[role] || 'secondary'}>{role}</Badge>;
    };

    const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : '?';

    const isTester = user.role === 'tester';
    const taskLabel = isTester ? 'Tests Completed' : 'Tasks Created';
    const taskValue = isTester ? (user.completed_tests || 0) : (user.tasks_created || 0);
    const creditLabel = isTester ? 'Total Earnings' : 'Total Spent';
    const creditValue = isTester ? (user.total_earnings || 0) : (user.total_spent || 0);

    return (
        <div className="admin-user-profile">
            {/* Back header */}
            <div className="page-header">
                <div className="page-header-left">
                    <button className="back-btn" onClick={() => navigate('/admin/users')}>
                        <FiArrowLeft size={18} />
                        Back to Users
                    </button>
                    <div>
                        <h1 className="page-title">User Profile</h1>
                        <p className="page-subtitle">Full details for {user.name}</p>
                    </div>
                </div>
                <div className="profile-actions">
                    {user.status === 'active' ? (
                        <Button
                            variant="warning"
                            icon={<FiX />}
                            onClick={() => handleStatusChange('suspended')}
                            loading={actionLoading}
                        >
                            Suspend
                        </Button>
                    ) : (
                        <Button
                            variant="success"
                            icon={<FiCheck />}
                            onClick={() => handleStatusChange('active')}
                            loading={actionLoading}
                        >
                            Activate
                        </Button>
                    )}
                    <Button
                        variant="danger"
                        icon={<FiTrash2 />}
                        onClick={handleDelete}
                        loading={actionLoading}
                    >
                        Delete
                    </Button>
                </div>
            </div>

            <div className="profile-layout">
                {/* Left — Identity Card */}
                <div className="profile-identity card">
                    <div className="profile-avatar-wrap">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} className="profile-avatar-img" />
                        ) : (
                            <div className="profile-avatar-initials">{initials}</div>
                        )}
                        <div className="profile-status-dot" data-status={user.status} />
                    </div>

                    <h2 className="profile-name">{user.name}</h2>
                    <div className="profile-badges">
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.status)}
                    </div>

                    {user.company && (
                        <p className="profile-company">
                            <FiBriefcase size={13} /> {user.company}
                        </p>
                    )}

                    <div className="profile-info-list">
                        <div className="profile-info-item">
                            <FiMail size={14} />
                            <span>{user.email}</span>
                        </div>
                        <div className="profile-info-item">
                            <FiCalendar size={14} />
                            <span>Joined {formatDate(user.created_at)}</span>
                        </div>
                        {user.experience && (
                            <div className="profile-info-item">
                                <FiStar size={14} />
                                <span>{user.experience}</span>
                            </div>
                        )}
                    </div>

                    {/* Stats mini-grid */}
                    <div className="profile-mini-stats">
                        <div className="mini-stat">
                            <span className="mini-stat-value">{taskValue}</span>
                            <span className="mini-stat-label">{taskLabel}</span>
                        </div>
                        <div className="mini-stat">
                            <span className="mini-stat-value">{creditValue}</span>
                            <span className="mini-stat-label">{creditLabel}</span>
                        </div>
                        <div className="mini-stat">
                            <span className="mini-stat-value">{user.wallet_balance || 0}</span>
                            <span className="mini-stat-label">Wallet Balance</span>
                        </div>
                    </div>
                </div>

                {/* Right — Details panels */}
                <div className="profile-details">
                    {/* About */}
                    <div className="card profile-section">
                        <div className="profile-section-header">
                            <FiUser size={16} />
                            <h3>About</h3>
                        </div>
                        <p className="profile-bio">
                            {user.bio || <span className="profile-empty">No bio provided.</span>}
                        </p>
                    </div>

                    {/* Skills */}
                    {user.skills && user.skills.length > 0 && (
                        <div className="card profile-section">
                            <div className="profile-section-header">
                                <FiCheckCircle size={16} />
                                <h3>Skills</h3>
                            </div>
                            <div className="profile-skills">
                                {(Array.isArray(user.skills) ? user.skills : user.skills.split(',')).map((skill, i) => (
                                    <span key={i} className="skill-tag">{skill.trim()}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Account Details */}
                    <div className="card profile-section">
                        <div className="profile-section-header">
                            <FiShield size={16} />
                            <h3>Account Details</h3>
                        </div>
                        <div className="profile-detail-grid">
                            <div className="detail-row">
                                <span className="detail-label">User ID</span>
                                <span className="detail-value detail-mono">{user.id}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Role</span>
                                <span className="detail-value">{getRoleBadge(user.role)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Status</span>
                                <span className="detail-value">{getStatusBadge(user.status)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Joined</span>
                                <span className="detail-value">{formatDate(user.created_at)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Last Updated</span>
                                <span className="detail-value">{formatDate(user.updated_at)}</span>
                            </div>
                            {user.pending_credits > 0 && (
                                <div className="detail-row">
                                    <span className="detail-label">Pending Credits</span>
                                    <span className="detail-value">{user.pending_credits}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminUserProfile;
