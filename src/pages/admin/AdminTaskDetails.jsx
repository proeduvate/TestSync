import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksAPI, feedbackAPI } from '../../services/api';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { FiArrowLeft, FiExternalLink, FiUser, FiCalendar, FiGlobe, FiMail, FiDollarSign, FiInfo, FiLayers } from 'react-icons/fi';
import './AdminTaskDetails.css';

function AdminTaskDetails() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTesterId, setSelectedTesterId] = useState(null);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [selectedTesterId]);

    useEffect(() => {
        async function fetchTaskAndFeedback() {
            try {
                const [taskRes, feedbackRes] = await Promise.all([
                    tasksAPI.get(taskId),
                    feedbackAPI.list({ taskId })
                ]);
                setTask(taskRes.task);
                setFeedbacks(feedbackRes.feedback || []);
                
                // Select first tester by default if available
                if (taskRes.task?.assignedTesters?.length > 0) {
                    setSelectedTesterId(taskRes.task.assignedTesters[0].id);
                }
            } catch (err) {
                console.error('Failed to load task details:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchTaskAndFeedback();
    }, [taskId]);

    if (loading) return <div className="loading">Loading task details...</div>;
    if (!task) return <div className="error-state">Task not found</div>;

    const getStatusBadge = (status) => {
        const statusMap = {
            'open': { label: 'Open', variant: 'info' },
            'in-progress': { label: 'In Progress', variant: 'primary' },
            'pending-review': { label: 'Pending Review', variant: 'warning' },
            'under-verification': { label: 'Verification', variant: 'secondary' },
            'completed': { label: 'Completed', variant: 'success' },
            'cancelled': { label: 'Cancelled', variant: 'danger' },
        };
        const config = statusMap[status] || { label: status, variant: 'secondary' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const selectedTester = task.assignedTesters?.find(t => t.id === selectedTesterId);
    const selectedFeedback = feedbacks.find(f => f.tester === selectedTesterId);

    const cleanLine = (l) => {
        return l.trim()
            .replace(/^[•\-\*\s]+/, '')
            .replace(/^\d+[\.\)\s]+\s*/, '');
    };

    const getObservationsCols = (obsText) => {
        if (!obsText || typeof obsText !== 'string') return { leftCol: [], rightCol: [] };
        const lines = obsText.split('\n')
            .map(cleanLine)
            .filter(Boolean);
        const mid = Math.ceil(lines.length / 2);
        return {
            leftCol: lines.slice(0, mid),
            rightCol: lines.slice(mid)
        };
    };

    const getStepsList = (stepsText) => {
        if (!stepsText || typeof stepsText !== 'string') return [];
        return stepsText.split('\n')
            .map(cleanLine)
            .filter(Boolean);
    };

    const { leftCol, rightCol } = selectedFeedback ? getObservationsCols(selectedFeedback.observations) : { leftCol: [], rightCol: [] };
    const steps = selectedFeedback ? getStepsList(selectedFeedback.stepsToReproduce) : [];

    return (
        <div className="admin-task-details-page">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <button className="back-btn" onClick={() => navigate('/admin/tasks')}>
                        <FiArrowLeft size={16} /> Back to Tasks
                    </button>
                    <h1 className="page-title">{task.appName}</h1>
                    <p className="page-subtitle">Platform oversight of task status, developers, and tester submissions.</p>
                </div>
                <div>
                    {getStatusBadge(task.status)}
                </div>
            </div>

            {/* Grid Layout */}
            <div className="task-details-grid">
                
                {/* Application Information */}
                <div className="card app-info-card">
                    <h3 className="card-title"><FiGlobe /> Application Information</h3>
                    <div className="card-body">
                        <div className="detail-item">
                            <span className="detail-label">App Name</span>
                            <span className="detail-value">{task.appName}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">App URL</span>
                            <a 
                                href={task.appUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="detail-value link"
                            >
                                {task.appUrl} <FiExternalLink size={12} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Developer Details */}
                <div className="card developer-card">
                    <h3 className="card-title"><FiUser /> Developer Details</h3>
                    <div className="card-body">
                        <div className="detail-item">
                            <span className="detail-label">Developer/Owner</span>
                            <span className="detail-value">{task.developerName || task.developer?.name || 'System'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Company/Group</span>
                            <span className="detail-value">{task.developerCompany || task.developer?.company || 'Internal'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Contact Email</span>
                            <span className="detail-value"><FiMail size={12} /> {task.developer?.email || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Description (Full Width) */}
                <div className="card description-card full-width">
                    <h3 className="card-title"><FiInfo /> Description</h3>
                    <div className="card-body">
                        <p className="detail-value description">{task.description || 'No description provided.'}</p>
                    </div>
                </div>

                {/* Testing & Financials */}
                <div className="card financials-card">
                    <h3 className="card-title"><FiDollarSign /> Testing & Financials</h3>
                    <div className="card-body">
                        <div className="detail-item">
                            <span className="detail-label">Testing Level</span>
                            <span className="detail-value capitalize">{task.testingLevel}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Budget</span>
                            <span className="detail-value">{formatCurrency(task.budget)}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Created At</span>
                            <span className="detail-value"><FiCalendar size={12} /> {formatDate(task.createdAt)}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Required Testers</span>
                            <span className="detail-value">{task.testersAssigned} / {task.requiredTesters || 1} Assigned</span>
                        </div>
                        <div className="detail-item full-width" style={{ marginTop: 'var(--space-2)' }}>
                            <span className="detail-label">Test Types Requested</span>
                            <div className="detail-badges">
                                {(task.testTypes || []).map(type => (
                                    <span key={type} className="mini-badge">{type}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assigned Testers List */}
                <div className="card testers-list-card">
                    <h3 className="card-title"><FiLayers /> Assigned Testers</h3>
                    <div className="card-body">
                        {task.assignedTesters?.length === 0 ? (
                            <p className="no-data">No testers assigned to this task yet.</p>
                        ) : (
                            <div className="testers-interactive-list">
                                {task.assignedTesters.map(tester => {
                                    const submission = feedbacks.find(f => f.tester === tester.id);
                                    return (
                                        <div
                                            key={tester.id}
                                            className={`tester-item-row ${selectedTesterId === tester.id ? 'active' : ''}`}
                                            onClick={() => setSelectedTesterId(tester.id)}
                                        >
                                            <div className="tester-profile-info">
                                                <div className="avatar sm">
                                                    {tester.name?.split(' ').map(n => n[0]).join('') || '?'}
                                                </div>
                                                <div>
                                                    <p className="tester-name-text">{tester.name}</p>
                                                    <p className="tester-email-text">{tester.email}</p>
                                                </div>
                                            </div>
                                            <div className="tester-badge-wrap">
                                                {submission ? (
                                                    <Badge variant={
                                                        submission.status === 'approved' ? 'success' :
                                                        submission.status === 'rejected' ? 'danger' : 'warning'
                                                    }>
                                                        {submission.status}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">In Progress</Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Proof Submission & Feedback Details (Full Width in Grid) */}
                <div className="card submission-details-card full-width">
                    <h3 className="card-title">Submission Details & Submitted Proof</h3>
                    <div className="card-body">
                        {selectedTester ? (
                            selectedFeedback ? (
                                <div className="submission-grid">
                                    <div className="submission-item">
                                        <span className="detail-label">Observations</span>
                                        <div className="observations-grid">
                                            <div className="observations-col">
                                                {leftCol.map((line, idx) => (
                                                    <div key={idx} className="observation-item">
                                                        <span className="bullet-dot"></span>
                                                        <span className="observation-text-item">{line}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="observations-col">
                                                {rightCol.map((line, idx) => (
                                                    <div key={idx} className="observation-item">
                                                        <span className="bullet-dot"></span>
                                                        <span className="observation-text-item">{line}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {steps.length > 0 && (
                                        <div className="submission-item">
                                            <span className="detail-label">Steps to Reproduce</span>
                                            <div className="steps-list">
                                                {steps.map((line, idx) => (
                                                    <div key={idx} className="step-item">
                                                        <span className="step-number">{idx + 1}</span>
                                                        <span className="step-text-item">{line}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="submission-metadata-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Test Result</span>
                                            <Badge variant={selectedFeedback.testResult === 'pass' ? 'success' : 'danger'}>
                                                {selectedFeedback.testResult?.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">AI Verification Status</span>
                                            <Badge variant={
                                                selectedFeedback.aiVerification === 'verified' ? 'success' :
                                                selectedFeedback.aiVerification === 'failed' || selectedFeedback.aiVerification === 'rejected' ? 'danger' : 'warning'
                                            }>
                                                {selectedFeedback.aiVerification}
                                            </Badge>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Credit Score</span>
                                            <span className="credits-score-value">{selectedFeedback.creditScore} Credits</span>
                                        </div>
                                    </div>
                                    {selectedFeedback.proofUrl && (
                                        <div className="submission-item full-width proof-viewer-section">
                                            <span className="detail-label">Submitted Proof URL / Document</span>
                                            <a 
                                                href={selectedFeedback.proofUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="proof-link-tag"
                                            >
                                                <FiExternalLink /> View Original Proof URL
                                            </a>
                                            {selectedFeedback.proofType === 'screenshot' && !imageError && (
                                                <div className="proof-screenshot-container">
                                                    <img 
                                                        src={selectedFeedback.proofUrl} 
                                                        alt="Tester Submission Screenshot" 
                                                        onError={() => setImageError(true)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="no-submission-state">
                                    <p className="info-msg">{selectedTester.name} has not submitted any proof or feedback yet.</p>
                                    <p className="sub-msg">This tester is currently assigned and working on this task.</p>
                                </div>
                            )
                        ) : (
                            <p className="no-tester-selected-msg">Select a tester from the list to view their submissions.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AdminTaskDetails;
