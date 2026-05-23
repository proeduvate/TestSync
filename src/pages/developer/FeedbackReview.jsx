import { useState, useEffect } from 'react';
import { feedbackAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Badge, { AIBadge } from '../../components/common/Badge';
import { useToast } from '../../components/common/Toast';
import { FiCheck, FiMessageCircle, FiImage, FiVideo, FiStar, FiFilter } from 'react-icons/fi';
import './FeedbackReview.css';

function FeedbackReview() {
    const toast = useToast();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all');
    const [clarificationNote, setClarificationNote] = useState('');

    useEffect(() => {
        async function fetchFeedback() {
            try {
                const res = await feedbackAPI.list();
                setFeedbacks(res.feedback || []);
            } catch (err) {
                console.error('Failed to load feedback:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchFeedback();
    }, []);

    const filteredFeedbacks = filter === 'all'
        ? feedbacks
        : feedbacks.filter(f => f.status === filter);

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': { label: 'Pending Review', variant: 'warning' },
            'dev-approved': { label: 'Verified by Dev', variant: 'info' },
            'approved': { label: 'Accepted (Credits Released)', variant: 'success' },
            'needs-revision': { label: 'Needs Revision', variant: 'danger' },
        };
        const config = statusMap[status] || { label: status, variant: 'secondary' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const handleApprove = async (id) => {
        try {
            await feedbackAPI.update(id, { status: 'dev-approved' });
            setFeedbacks(prev => prev.map(f =>
                (f._id || f.id) === id ? { ...f, status: 'dev-approved' } : f
            ));
            toast.success('Feedback Verified', 'Sent to Administrator for final credit release.');
            setShowModal(false);
        } catch (err) {
            toast.error('Error', err.message);
        }
    };

    const handleRequestClarification = async (id) => {
        if (!clarificationNote.trim()) {
            toast.error('Note Required', 'Please provide a clarification note.');
            return;
        }
        try {
            await feedbackAPI.update(id, { status: 'needs-revision' });
            setFeedbacks(prev => prev.map(f =>
                (f._id || f.id) === id ? { ...f, status: 'needs-revision' } : f
            ));
            toast.warning('Clarification Requested', 'The tester has been notified.');
            setShowModal(false);
            setClarificationNote('');
        } catch (err) {
            toast.error('Error', err.message);
        }
    };

    const openReviewModal = (feedback) => {
        setSelectedFeedback(feedback);
        setShowModal(true);
    };

    return (
        <div className="feedback-review-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Feedback Review</h1>
                    <p className="page-subtitle">Review and manage tester submissions</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({feedbacks.length})
                </button>
                <button
                    className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    Pending ({feedbacks.filter(f => f.status === 'pending').length})
                </button>
                <button
                    className={`filter-tab ${filter === 'dev-approved' ? 'active' : ''}`}
                    onClick={() => setFilter('dev-approved')}
                >
                    Verified ({feedbacks.filter(f => f.status === 'dev-approved').length})
                </button>
                <button
                    className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
                    onClick={() => setFilter('approved')}
                >
                    Released ({feedbacks.filter(f => f.status === 'approved').length})
                </button>
                <button
                    className={`filter-tab ${filter === 'needs-revision' ? 'active' : ''}`}
                    onClick={() => setFilter('needs-revision')}
                >
                    Needs Revision ({feedbacks.filter(f => f.status === 'needs-revision').length})
                </button>
            </div>

            {/* Feedback List */}
            <div className="table-responsive">
                {filteredFeedbacks.length === 0 ? (
                    <div className="empty-state">
                        <FiMessageCircle size={48} />
                        <h3>No Feedback Found</h3>
                        <p>
                            {filter === 'all' 
                                ? "You haven't received any feedback for your tasks yet." 
                                : `No submissions found with status "${filter}".`}
                        </p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Tester</th>
                                <th>Task & Date</th>
                                <th>Score</th>
                                <th>AI Check</th>
                                <th>Result</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFeedbacks.map(feedback => (
                                <tr key={feedback.id || feedback._id}>
                                    <td>
                                        <div className="tester-info">
                                            <div className="avatar">{(feedback.testerName || 'Anonymous').split(' ').map(n => n[0]).join('')}</div>
                                            <div>
                                                <div className="tester-name">{feedback.testerName || 'Anonymous Tester'}</div>
                                                <div className="tester-rating">
                                                    <FiStar size={12} />
                                                    <span>{feedback.testerRating || 5.0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="task-info">
                                            <div className="task-name">{feedback.taskName}</div>
                                            <div className="submit-date">{formatDate(feedback.submittedAt)}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="score-value">{feedback.creditScore}/100</div>
                                    </td>
                                    <td>
                                        <AIBadge status={feedback.aiVerification} />
                                    </td>
                                    <td>
                                        <Badge
                                            variant={
                                                feedback.testResult === 'pass' ? 'success' :
                                                    feedback.testResult === 'fail' ? 'danger' : 'warning'
                                            }
                                        >
                                            {feedback.testResult === 'issues-found' ? 'Issues Found' : feedback.testResult}
                                        </Badge>
                                    </td>
                                    <td>
                                        {getStatusBadge(feedback.status)}
                                    </td>
                                    <td>
                                        <Button 
                                            variant={feedback.status === 'pending' ? 'primary' : 'secondary'} 
                                            size="sm" 
                                            onClick={() => openReviewModal(feedback)}
                                        >
                                            {feedback.status === 'pending' ? 'Review' : 'View'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Review Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Review Submission"
                size="xl"
                footer={
                    selectedFeedback && selectedFeedback.status === 'pending' ? (
                        <>
                            <Button
                                variant="danger"
                                size="sm"
                                icon={<FiMessageCircle />}
                                onClick={() => handleRequestClarification(selectedFeedback._id || selectedFeedback.id)}
                            >
                                Request Clarification
                            </Button>
                            <Button
                                variant="success"
                                size="sm"
                                icon={<FiCheck />}
                                onClick={() => handleApprove(selectedFeedback._id || selectedFeedback.id)}
                            >
                                Approve & Release Credits
                            </Button>
                        </>
                    ) : null
                }
            >
                {selectedFeedback && (
                    <div className="review-modal-content">
                        <div className="review-header">
                            <div className="tester-info">
                                <div className="avatar lg">{selectedFeedback.testerName.split(' ').map(n => n[0]).join('')}</div>
                                <div>
                                    <h3>{selectedFeedback.testerName}</h3>
                                    <p className="tester-rating">
                                        <FiStar size={14} /> {selectedFeedback.testerRating} rating
                                    </p>
                                </div>
                            </div>
                            <AIBadge status={selectedFeedback.aiVerification} />
                        </div>

                        <div className="review-section">
                            <h4>Task</h4>
                            <p>{selectedFeedback.taskName}</p>
                        </div>

                        <div className="review-section">
                            <h4>Observations</h4>
                            <p>{selectedFeedback.observations}</p>
                        </div>

                        {selectedFeedback.stepsToReproduce && (
                            <div className="review-section">
                                <h4>Steps to Reproduce</h4>
                                <div className="steps-container">
                                    {selectedFeedback.stepsToReproduce}
                                </div>
                            </div>
                        )}

                        <div className="review-section">
                            <h4>Proof</h4>
                            <div className="proof-placeholder">
                                {selectedFeedback.proofType === 'video' ? (
                                    <div className="video-placeholder">
                                        <FiVideo size={40} />
                                        <p>Video Recording</p>
                                        <Button 
                                            variant="secondary" 
                                            size="sm"
                                            onClick={() => window.open(selectedFeedback.proofUrl, '_blank')}
                                        >
                                            Open Video Link
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="screenshot-placeholder">
                                        <FiImage size={40} />
                                        <p>Proof Screenshots</p>
                                        <Button 
                                            variant="secondary" 
                                            size="sm"
                                            onClick={() => window.open(selectedFeedback.proofUrl, '_blank')}
                                        >
                                            View Screenshots
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="review-section">
                            <h4>AI Analysis</h4>
                            <div className="ai-analysis">
                                <div className="analysis-item">
                                    <span>Verification Status</span>
                                    <AIBadge status={selectedFeedback.aiVerification} />
                                </div>
                                <div className="analysis-item">
                                    <span>Credit Score</span>
                                    <strong>{selectedFeedback.creditScore}/100</strong>
                                </div>
                            </div>
                        </div>

                        {selectedFeedback.status === 'pending' && (
                            <div className="review-section">
                                <h4>Request Clarification Note (Optional)</h4>
                                <textarea
                                    className="form-input form-textarea"
                                    placeholder="Explain what needs to be clarified or fixed..."
                                    value={clarificationNote}
                                    onChange={(e) => setClarificationNote(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default FeedbackReview;
