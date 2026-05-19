import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { feedbackAPI } from '../../services/api';
import Badge, { AIBadge } from '../../components/common/Badge';
import { FiClock, FiCheckCircle, FiXCircle, FiInfo } from 'react-icons/fi';
import './Status.css';

function Status() {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSubmissions() {
            try {
                const res = await feedbackAPI.list();
                setSubmissions(res.feedback || []);
            } catch (err) {
                console.error('Failed to load submissions:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchSubmissions();
    }, []);

    const getStatusConfig = (status) => {
        switch (status) {
            case 'approved': 
                return { label: 'Completed & Released', variant: 'success', icon: <FiCheckCircle className="status-icon success" /> };
            case 'dev-approved': 
                return { label: 'Waiting for Admin', variant: 'info', icon: <FiClock className="status-icon info" /> };
            case 'pending': 
                return { label: 'Waiting for Developer', variant: 'warning', icon: <FiClock className="status-icon warning" /> };
            case 'needs-revision': 
                return { label: 'Revision Requested', variant: 'danger', icon: <FiInfo className="status-icon danger" /> };
            case 'rejected': 
                return { label: 'Rejected', variant: 'danger', icon: <FiXCircle className="status-icon danger" /> };
            default: 
                return { label: status, variant: 'secondary', icon: <FiClock className="status-icon" /> };
        }
    };

    return (
        <div className="status-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Submission Tracking</h1>
                    <p className="page-subtitle">Monitoring the verification pipeline for your testing reports.</p>
                </div>
            </div>

            <div className="status-list">
                {submissions.map(sub => {
                    const config = getStatusConfig(sub.status);
                    return (
                        <div key={sub._id || sub.id} className="card status-card">
                            <div className="status-card-main">
                                <div className="status-header">
                                    {config.icon}
                                    <div className="status-info">
                                        <h3>{sub.taskName}</h3>
                                        <p className="submission-date">Submitted on {new Date(sub.submittedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="status-badges">
                                    <AIBadge status={sub.aiVerification} />
                                    <Badge variant={config.variant}>
                                        {config.label}
                                    </Badge>
                                </div>
                            </div>
                            <div className="status-details">
                                <div className="detail-grid-row">
                                    <div className="detail-item">
                                        <span className="detail-label">Observations</span>
                                        <p className="detail-value">{sub.observations}</p>
                                    </div>
                                    <div className="status-timeline">
                                        <div className={`timeline-step ${['pending', 'dev-approved', 'approved'].includes(sub.status) ? 'active' : ''} ${sub.status !== 'pending' ? 'completed' : ''}`}>
                                            <div className="step-dot"></div>
                                            <span>Developer Review</span>
                                        </div>
                                        <div className={`timeline-step ${['dev-approved', 'approved'].includes(sub.status) ? 'active' : ''} ${sub.status === 'approved' ? 'completed' : ''}`}>
                                            <div className="step-dot"></div>
                                            <span>Admin Approval</span>
                                        </div>
                                        <div className={`timeline-step ${sub.status === 'approved' ? 'active completed' : ''}`}>
                                            <div className="step-dot"></div>
                                            <span>Payment Released</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {sub.creditScore && (
                                    <div className="detail-item">
                                        <span className="detail-label">AI Analysis Progress</span>
                                        <div className="score-bar-container">
                                            <div className="score-bar">
                                                <div className="score-fill" style={{ width: `${sub.creditScore}%` }}></div>
                                            </div>
                                            <span>{sub.creditScore}% Quality Score</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

            </div>
        </div>
    );
}

export default Status;
