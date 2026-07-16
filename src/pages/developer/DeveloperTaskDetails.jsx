import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksAPI, feedbackAPI } from '../../services/api';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { FiArrowLeft, FiExternalLink, FiCalendar, FiGlobe, FiInfo, FiLayers, FiDollarSign, FiUser } from 'react-icons/fi';
import './DeveloperTaskDetails.css';

function DeveloperTaskDetails() {
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
        <div className="developer-task-details-page">

            {/* ── Row 1: Header ── */}
            <div className="page-header">
                <div>
                    <button className="back-btn" onClick={() => navigate('/developer/tasks')}>
                        <FiArrowLeft size={14} /> Back to Tasks
                    </button>
                </div>
                <div>{getStatusBadge(task.status)}</div>
            </div>

            {/* ── Row 2: 4 cards at top ── */}
            <div className="task-top-strip">

                {/* Card 1 – App Information */}
                <div className="card">
                    <h3 className="card-title"><FiGlobe size={13} /> Application Information</h3>
                    <div className="detail-item">
                        <span className="detail-label">App Name</span>
                        <span className="detail-value">{task.appName}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">App URL</span>
                        <a href={task.appUrl} target="_blank" rel="noopener noreferrer" className="detail-value link">
                            {task.appUrl} <FiExternalLink size={11} />
                        </a>
                    </div>
                </div>

                {/* Card 2 – Testing Constraints */}
                <div className="card">
                    <h3 className="card-title"><FiUser size={13} /> Testing Constraints</h3>
                    <div className="detail-item">
                        <span className="detail-label">Required Testers</span>
                        <span className="detail-value">{task.testersAssigned} / {task.requiredTesters || 1} Assigned</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Testing Level</span>
                        <span className="detail-value capitalize">{task.testingLevel}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Created At</span>
                        <span className="detail-value"><FiCalendar size={11} /> {formatDate(task.createdAt)}</span>
                    </div>
                </div>

                {/* Card 3 – Description */}
                <div className="card">
                    <h3 className="card-title"><FiInfo size={13} /> Description</h3>
                    <p className="detail-value description">{task.description || 'No description provided.'}</p>
                </div>


            </div>


            {/* ── Row 3: Assigned Testers (left) + Submission Details (right) ── */}
            <div className="task-submission-row">

                {/* Card 4 – Assigned Testers (Left) */}
                <div className="card testers-list-card">
                    <h3 className="card-title"><FiUser size={13} /> Assigned Testers</h3>
                    <div className="tester-card-body">
                        {task.assignedTesters?.length === 0 ? (
                            <p className="no-data">No testers assigned.</p>
                        ) : (
                            <div className="testers-interactive-list">
                                {task.assignedTesters.map(tester => {
                                    const feedback = feedbacks.find(f => f.tester === tester.id);
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
                                                    <Badge variant="warning" size="sm" style={{ marginTop: '4px' }}>
                                                        ★ {(tester.average_rating || 0).toFixed(1)} AI Rating
                                                    </Badge>
                                                </div>
                                            </div>
                                            {feedback && (
                                                <Badge variant={feedback.testResult === 'pass' ? 'success' : 'danger'}>
                                                    {feedback.testResult?.toUpperCase()}
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Submission Details & Submitted Proof (Right) */}
                <div className="card submission-details-card">
                    <h3 className="card-title">Submission Details &amp; Submitted Proof</h3>
                    <div className="submission-body">
                        {selectedTester ? (
                            selectedFeedback ? (
                                <>
                                    {/* Metadata strip */}
                                    <div className="submission-metadata-grid" style={{flexShrink: 0}}>
                                        <div className="detail-item">
                                            <span className="detail-label">Test Result</span>
                                            <Badge variant={selectedFeedback.testResult === 'pass' ? 'success' : 'danger'}>
                                                {selectedFeedback.testResult?.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">AI Verification</span>
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

                                    {/* Observations – fills remaining height */}
                                    <div className="observations-wrapper">
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

                                    {/* Steps */}
                                    {steps.length > 0 && (
                                        <div className="submission-item" style={{flexShrink: 0}}>
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

                                    {/* Proof link */}
                                    {selectedFeedback.proofUrl && (
                                        <div className="proof-viewer-section" style={{flexShrink: 0}}>
                                            <span className="detail-label">Submitted Proof</span>
                                            <a href={selectedFeedback.proofUrl} target="_blank" rel="noopener noreferrer" className="proof-link-tag">
                                                <FiExternalLink size={12} /> View Original Proof URL
                                            </a>
                                            {selectedFeedback.proofType === 'screenshot' && !imageError && (
                                                <div className="proof-screenshot-container">
                                                    <img src={selectedFeedback.proofUrl} alt="Screenshot" onError={() => setImageError(true)} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="no-submission-state">
                                    <p className="info-msg">{selectedTester.name} has not submitted any proof yet.</p>
                                    <p className="sub-msg">This tester is assigned and working on the task.</p>
                                </div>
                            )
                        ) : (
                            <p className="no-tester-selected-msg">Select a tester from the list to view their submission.</p>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );

}

export default DeveloperTaskDetails;

