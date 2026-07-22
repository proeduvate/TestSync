import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { FiClock, FiZap, FiLogOut, FiCheckCircle } from 'react-icons/fi';
import '../auth.css';

function PendingApproval() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="auth-form pending-approval-page">
            <div className="auth-mobile-logo">
                <div className="auth-logo-icon">
                    <FiZap size={24} />
                </div>
                <span className="auth-logo-text">TestFlow</span>
            </div>

            <div className="auth-form-header">
                <div className="pending-icon-glamor">
                    <div className="icon-pulse"></div>
                    <FiClock size={48} className="main-icon" />
                </div>
                <h2>Application Pending</h2>
                <p>
                    Thank you for joining <strong>TestFlow</strong>, {user?.name || 'User'}!
                </p>
            </div>

            <div className="auth-form-body">
                <div className="pending-status-card">
                    <div className="status-step active">
                        <div className="step-icon"><FiCheckCircle size={18} /></div>
                        <div className="step-text">
                            <h4>Registration Received</h4>
                            <p>Your details have been securely stored.</p>
                        </div>
                    </div>
                    <div className="status-step current">
                        <div className="step-icon"><FiClock size={18} /></div>
                        <div className="step-text">
                            <h4>Admin Review</h4>
                            <p>Our team is verifying your profile credentials.</p>
                        </div>
                    </div>
                    <div className="status-step">
                        <div className="step-icon"><FiZap size={18} /></div>
                        <div className="step-text">
                            <h4>Access Granted</h4>
                            <p>You'll receive full access once approved.</p>
                        </div>
                    </div>
                </div>

                <div className="info-box">
                    <p>
                        Verification usually takes <strong>12-24 hours</strong>. 
                        We'll notify you via email once your account is ready.
                    </p>
                </div>

                <Button
                    variant="outline"
                    icon={<FiLogOut />}
                    fullWidth
                    onClick={handleLogout}
                    className="logout-btn"
                >
                    Sign out
                </Button>
            </div>

            <div className="auth-form-footer">
                <p>
                    Need help? <a href="mailto:support@proeduvate.com">Contact Support</a>
                </p>
            </div>

            <style jsx>{`
                .pending-icon-glamor {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-color);
                }

                .icon-pulse {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: var(--primary-color);
                    border-radius: 50%;
                    opacity: 0.15;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.2; }
                    50% { transform: scale(1.1); opacity: 0.1; }
                    100% { transform: scale(0.95); opacity: 0.2; }
                }

                .main-icon {
                    position: relative;
                    z-index: 1;
                }

                .pending-status-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 24px;
                }

                .status-step {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 20px;
                    opacity: 0.4;
                }

                .status-step:last-child {
                    margin-bottom: 0;
                }

                .status-step.active {
                    opacity: 1;
                    color: #10b981;
                }

                .status-step.current {
                    opacity: 1;
                    color: var(--primary-color);
                }

                .step-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .status-step.active .step-icon {
                    background: rgba(16, 185, 129, 0.1);
                }

                .status-step.current .step-icon {
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid var(--primary-color);
                }

                .step-text h4 {
                    font-size: 0.95rem;
                    margin: 0 0 2px 0;
                    font-weight: 600;
                }

                .step-text p {
                    font-size: 0.8rem;
                    margin: 0;
                    opacity: 0.7;
                }

                .info-box {
                    padding: 16px;
                    background: rgba(99, 102, 241, 0.05);
                    border-radius: 12px;
                    margin-bottom: 24px;
                    text-align: center;
                }

                .info-box p {
                    font-size: 0.85rem;
                    line-height: 1.5;
                    margin: 0;
                }

                .logout-btn {
                    margin-top: 10px;
                }
            `}</style>
        </div>
    );
}

export default PendingApproval;
