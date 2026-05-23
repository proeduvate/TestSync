import { useState, useEffect } from 'react';
import { feedbackAPI } from '../../services/api';
import Badge, { AIBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { FiCheckCircle, FiXCircle, FiInfo, FiEye } from 'react-icons/fi';
import './Verification.css';

function Verification() {
    const toast = useToast();
    const [pendingVerifications, setPendingVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionCredits, setActionCredits] = useState({}); // Tracking custom credits per item

    useEffect(() => {
        async function fetchPending() {
            try {
                // Now fetching specifically items verified by developers
                const res = await feedbackAPI.list({ status: 'dev-approved' });
                const feedbackItems = res.feedback || [];
                setPendingVerifications(feedbackItems);
                
                // Initialize default credits (AI Score * 3)
                const initialCredits = {};
                feedbackItems.forEach(item => {
                    initialCredits[item._id || item.id] = (item.creditScore || 0) * 3;
                });
                setActionCredits(initialCredits);
            } catch (err) {
                console.error('Failed to load verifications:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchPending();
    }, []);

    const handleCreditChange = (id, value) => {
        setActionCredits(prev => ({ ...prev, [id]: parseInt(value) || 0 }));
    };

    const handleApprove = async (id) => {
        try {
            const credits = actionCredits[id] || 0;
            await feedbackAPI.update(id, { 
                status: 'approved',
                customCredits: credits
            });
            
            setPendingVerifications(prev => prev.filter(v => (v._id || v.id) !== id));
            toast.success('Credits Released', `Successfully released ${credits} credits to the tester.`);
        } catch (err) {
            toast.error('Approval Failed', err.message);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Are you sure you want to reject this submission?')) return;
        try {
            await feedbackAPI.update(id, { status: 'rejected' });
            setPendingVerifications(prev => prev.filter(v => (v._id || v.id) !== id));
            toast.warning('Submission Rejected', 'The tester will be notified.');
        } catch (err) {
            toast.error('Rejection Failed', err.message);
        }
    };

    return (
        <div className="verification-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Manual Verification Queue</h1>
                    <p className="page-subtitle">Review flagged submissions and high-value testing reports.</p>
                </div>
            </div>

            <div className="verification-list">
                {pendingVerifications.map(item => (
                    <div key={item._id || item.id} className="card verification-card">
                        <div className="verification-card-header">
                            <div className="tester-profile">
                                <div className="avatar sm">{item.testerName.split(' ').map(n => n[0]).join('')}</div>
                                <div>
                                    <h4 className="tester-name">{item.testerName}</h4>
                                    <p className="task-ref">Task: {item.taskName}</p>
                                </div>
                            </div>
                            <div className="verification-status">
                                <AIBadge status={item.aiVerification} />
                                <Badge variant="warning">PENDING MANUAL</Badge>
                            </div>
                        </div>

                        <div className="verification-content">
                            <div className="content-section">
                                <span className="section-label">Observations</span>
                                <p className="section-text">{item.observations}</p>
                            </div>
                            
                        </div>

                        <div className="verification-footer">
                            <div className="credit-action-box">
                                <div className="credit-input-group">
                                    <label>Credits to Release:</label>
                                    <div className="input-with-icon" style={{ paddingLeft: '1rem' }}>
                                        <input 
                                            type="number" 
                                            className="credit-input"
                                            value={actionCredits[item._id || item.id] || 0}
                                            onChange={(e) => handleCreditChange(item._id || item.id, e.target.value)}
                                            style={{ paddingLeft: '0.5rem' }}
                                        />
                                    </div>
                                </div>
                                <div className="admin-actions">
                                    <Button 
                                        variant="danger" 
                                        icon={<FiXCircle />}
                                        onClick={() => handleReject(item._id || item.id)}
                                    >
                                        Reject
                                    </Button>
                                    <Button 
                                        variant="success" 
                                        icon={<FiCheckCircle />}
                                        onClick={() => handleApprove(item._id || item.id)}
                                    >
                                        Approve & Release Credits
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {pendingVerifications.length === 0 && (
                    <div className="empty-state">
                        <FiCheckCircle size={48} />
                        <h3>Queue is clear!</h3>
                        <p>No submissions currently require manual verification.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Verification;

