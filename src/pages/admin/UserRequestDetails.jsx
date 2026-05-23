import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { usersAPI, notificationsAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useToast } from '../../components/common/Toast';
import { FiArrowLeft, FiMail, FiCalendar, FiBriefcase, FiAward, FiCheck, FiX } from 'react-icons/fi';
import './UserRequestDetails.css';

function UserRequestDetails() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await usersAPI.get(userId);
                if (res.user) {
                    setUser({
                        ...res.user,
                        id: res.user.id || res.user._id,
                        name: res.user.name || '',
                        email: res.user.email || '',
                        role: res.user.role || 'developer',
                        status: res.user.status || 'pending',
                        bio: res.user.bio || '',
                        experience: res.user.experience || '',
                        company: res.user.company || '',
                        skills: res.user.skills || [],
                        joinedAt: res.user.created_at || res.user.joinedAt,
                    });
                } else {
                    navigate('/admin/requests');
                }
            } catch (err) {
                console.error('Failed to load user:', err);
                navigate('/admin/requests');
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, [userId, navigate]);

    const handleAccept = async () => {
        setIsProcessing(true);
        try {
            await usersAPI.update(user.id, { status: 'active' });
            
            // Create notification for the user
            await notificationsAPI.create({
                userId: user.id,
                title: 'Application Approved! 🎉',
                message: 'Welcome to ProEduvate! Your enrollment request has been approved. You now have full access to the platform.',
                type: 'success',
                link: `/${user.role}/dashboard`
            });

            toast.success(
                'User Approved',
                `An enrollment email has been sent to ${user.email}.`
            );
            setIsProcessing(false);
            navigate('/admin/requests');
        } catch (err) {
            toast.error('Error', err.message);
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        try {
            await usersAPI.update(user.id, { status: 'inactive' });
            
            // Create notification for the user
            await notificationsAPI.create({
                userId: user.id,
                title: 'Application Update',
                message: 'Thank you for your interest in ProEduvate. Unfortunately, your application could not be approved at this time.',
                type: 'warning'
            });

            toast.error('Application Rejected', `The request from ${user.name} has been declined.`);
            navigate('/admin/requests');
        } catch (err) {
            toast.error('Error', err.message);
        }
    };

    if (loading) return <Loader />;
    if (!user) return null;

    return (
        <div className="user-request-details-page">
            <div className="page-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/admin/requests')}>
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="page-title">Review Application</h1>
                        <p className="page-subtitle">Examine user credentials before granting access</p>
                    </div>
                </div>
            </div>

            <div className="details-container">
                <div className="details-grid">
                    {/* Profile Header Card */}
                    <div className="profile-header-card card">
                        <div className="profile-main-info">
                            <div className="avatar xl">
                                {user.name ? user.name.split(' ').map(n => n[0]).join('') : '?'}
                            </div>
                            <div className="profile-text">
                                <h2 className="profile-name">{user.name}</h2>
                                <Badge variant={user.role === 'developer' ? 'primary' : 'secondary'}>
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Candidate
                                </Badge>
                            </div>
                        </div>
                        
                        <div className="profile-quick-stats">
                            <div className="quick-stat">
                                <FiMail className="stat-icon" />
                                <div>
                                    <p className="stat-label">Email Address</p>
                                    <p className="stat-value">{user.email}</p>
                                </div>
                            </div>
                            <div className="quick-stat">
                                <FiCalendar className="stat-icon" />
                                <div>
                                    <p className="stat-label">Applied Date</p>
                                    <p className="stat-value">{formatDate(user.joinedAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Info Card */}
                    <div className="profile-details-card card">
                        <div className="detail-section">
                            <h3 className="section-title">
                                <FiBriefcase size={18} /> Experience & Background
                            </h3>
                            <div className="detail-content">
                                {user.role === 'developer' ? (
                                    <div className="info-item">
                                        <p className="info-label">Company / Affiliation</p>
                                        <p className="info-value">{user.company || 'Freelance / Individual'}</p>
                                    </div>
                                ) : (
                                    <div className="info-item">
                                        <p className="info-label">Testing Experience</p>
                                        <p className="info-value">{user.experience || 'Entry Level'}</p>
                                    </div>
                                )}
                                <div className="info-item">
                                    <p className="info-label">Biography</p>
                                    <p className="info-value bio-text">{user.bio || 'No biography provided.'}</p>
                                </div>
                            </div>
                        </div>

                        {user.skills && user.skills.length > 0 && (
                            <div className="detail-section">
                                <h3 className="section-title">
                                    <FiAward size={18} /> Core Skills
                                </h3>
                                <div className="skills-tags">
                                    {user.skills.map(skill => (
                                        <span key={skill} className="skill-tag">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="approval-actions">
                            <Button
                                variant="secondary"
                                icon={<FiX />}
                                onClick={handleReject}
                                disabled={isProcessing}
                            >
                                Reject Application
                            </Button>
                            <Button
                                variant="primary"
                                icon={<FiCheck />}
                                onClick={handleAccept}
                                isLoading={isProcessing}
                            >
                                Accept & Send Email
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserRequestDetails;
