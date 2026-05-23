import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { FiArrowLeft, FiUser, FiCalendar, FiChevronRight } from 'react-icons/fi';
import './UserRequests.css';

function UserRequests() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPendingUsers() {
            try {
                const res = await usersAPI.list({ status: 'pending' });
                setRequests((res.users || []).filter(u => u.status === 'pending'));
            } catch (err) {
                console.error('Failed to load pending users:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchPendingUsers();
    }, []);

    if (loading) return <Loader />;

    return (
        <div className="user-requests-page">
            <div className="page-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/admin/users')}>
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="page-title">User Requests</h1>
                        <p className="page-subtitle">Review and approve new platform registrations</p>
                    </div>
                </div>
            </div>

            <div className="requests-container">
                {requests.length > 0 ? (
                    <div className="requests-grid">
                        {requests.map(user => (
                            <div key={user._id || user.id} className="request-card" onClick={() => navigate(`/admin/requests/${user._id || user.id}`)}>
                                <div className="request-card-header">
                                    <div className="request-user-info">
                                        <div className="avatar">
                                            {user.name ? user.name.split(' ').map(n => n[0]).join('') : '?'}
                                        </div>
                                        <div>
                                            <h3 className="request-user-name">{user.name}</h3>
                                            <p className="request-user-email">{user.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant={user.role === 'developer' ? 'primary' : 'secondary'}>
                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    </Badge>
                                </div>
                                
                                <div className="request-card-body">
                                    <div className="request-meta">
                                        <div className="meta-item">
                                            <FiCalendar size={14} />
                                            <span>Joined: {formatDate(user.joinedAt || user.createdAt)}</span>
                                        </div>
                                    </div>
                                    <p className="request-bio">{user.bio || 'No bio provided.'}</p>
                                </div>

                                <div className="request-card-footer">
                                    <button className="review-link">
                                        Review Details <FiChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state card">
                        <div className="empty-icon">
                            <FiUser size={48} />
                        </div>
                        <h3>No pending requests</h3>
                        <p>All user registrations have been processed.</p>
                        <Button variant="secondary" onClick={() => navigate('/admin/users')}>
                            Back to Users
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserRequests;
