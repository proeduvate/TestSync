import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tasksAPI, feedbackAPI } from '../../services/api';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { FiArrowLeft, FiSend, FiCheckCircle, FiAlertCircle, FiMinusCircle, FiLink } from 'react-icons/fi';
import './SubmitFeedback.css';

function SubmitFeedback() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        testResult: 'pass',
        observations: '',
        stepsToReproduce: '',
        proofType: 'screenshot',
        proofUrl: '',
    });
    const [errors, setErrors] = useState({});
    const [task, setTask] = useState({ appName: 'Loading...', testTypes: [], credits: 0 });
    const [existingFeedback, setExistingFeedback] = useState(null);
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(true);

    useEffect(() => {
        async function fetchTask() {
            try {
                const res = await tasksAPI.get(taskId);
                setTask(res.task || res);
            } catch (err) {
                console.error('Failed to load task:', err);
            }
        }

        async function checkExistingFeedback() {
            try {
                const res = await feedbackAPI.getByTask(taskId);
                if (res.feedback) {
                    setExistingFeedback(res.feedback);
                    // Pre-fill form if needs revision
                    if (res.feedback.status === 'needs-revision') {
                        setFormData({
                            testResult: res.feedback.testResult,
                            observations: res.feedback.observations,
                            stepsToReproduce: res.feedback.stepsToReproduce,
                            proofType: 'screenshot', // Or detect from url
                            proofUrl: res.feedback.proofUrl,
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to check existing feedback:', err);
            } finally {
                setIsLoadingFeedback(false);
            }
        }

        if (taskId) {
            fetchTask();
            checkExistingFeedback();
        }
    }, [taskId]);

    const testResults = [
        { id: 'pass', label: 'All Tests Passed', icon: FiCheckCircle, color: 'success' },
        { id: 'issues-found', label: 'Issues Found', icon: FiAlertCircle, color: 'warning' },
        { id: 'fail', label: 'Critical Failures', icon: FiMinusCircle, color: 'danger' },
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.observations.trim()) {
            newErrors.observations = 'Observations are required';
        } else if (formData.observations.length < 50) {
            newErrors.observations = 'Please provide more detailed observations (min 50 characters)';
        }

        if (formData.testResult !== 'pass' && !formData.stepsToReproduce.trim()) {
            newErrors.stepsToReproduce = 'Steps to reproduce are required when reporting issues';
        }

        if (!formData.proofUrl.trim()) {
            newErrors.proofUrl = 'Please provide a proof link';
        } else {
            try {
                new URL(formData.proofUrl);
            } catch {
                newErrors.proofUrl = 'Please enter a valid URL (e.g. https://drive.google.com/...)';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await feedbackAPI.submit({
                task: taskId,
                testResult: formData.testResult,
                observations: formData.observations,
                stepsToReproduce: formData.stepsToReproduce,
                proofType: formData.proofType,
                proofUrl: formData.proofUrl,
            });
            toast.success('Feedback Submitted!', 'Your submission is now pending AI verification.');
            navigate('/tester/dashboard');
        } catch (err) {
            toast.error('Error', err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="submit-feedback-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <FiArrowLeft size={18} />
                    <span>Back to Tasks</span>
                </button>
                <div>
                    <h1 className="page-title">Submit Testing Feedback</h1>
                    <p className="page-subtitle">Task: {task.appName}</p>
                </div>
            </div>

            <div className="submit-container">
                {/* Main Form */}
                <div className="card submit-form-card">
                    {isLoadingFeedback ? (
                        <div className="loading-state">Checking submission status...</div>
                    ) : existingFeedback && existingFeedback.status !== 'needs-revision' && existingFeedback.status !== 'rejected' ? (
                        <div className="submission-lock-state">
                            <div className="lock-icon">
                                {existingFeedback.status === 'approved' ? <FiCheckCircle size={48} className="success" /> : <FiSend size={48} className="warning" />}
                            </div>
                            <h2>Feedback Already Submitted</h2>
                            <p>
                                {existingFeedback.status === 'approved' 
                                    ? 'Your work has already been approved and rewards have been credited.' 
                                    : 'Your submission is currently under review. You can resubmit if the developer requests a revision.'}
                            </p>
                            <div className="submission-details">
                                <div className="detail-row">
                                    <span className="label">Status</span>
                                    <span className={`value status-${existingFeedback.status}`}>{existingFeedback.status.replace('-', ' ')}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Submitted On</span>
                                    <span className="value">{new Date(existingFeedback.submittedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <Button variant="secondary" onClick={() => navigate('/tester/dashboard')}>
                                Return to Dashboard
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {existingFeedback && existingFeedback.status === 'needs-revision' && (
                                <div className="revision-alert">
                                    <FiAlertCircle size={20} />
                                    <span>The developer has requested changes. Please update your feedback and resubmit.</span>
                                </div>
                            )}
                            {/* Test Result */}
                        <div className="form-section">
                            <h3 className="section-title">Test Result</h3>
                            <p className="section-description">What was the overall outcome of your testing?</p>

                            <div className="test-result-options">
                                {testResults.map(result => (
                                    <label
                                        key={result.id}
                                        className={`result-option ${formData.testResult === result.id ? 'selected' : ''} ${result.color}`}
                                    >
                                        <input
                                            type="radio"
                                            name="testResult"
                                            value={result.id}
                                            checked={formData.testResult === result.id}
                                            onChange={handleChange}
                                        />
                                        <result.icon size={24} />
                                        <span>{result.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Observations */}
                        <div className="form-section">
                            <h3 className="section-title">Detailed Observations *</h3>
                            <p className="section-description">Describe what you tested, how you tested it, and your findings.</p>

                            <textarea
                                name="observations"
                                className={`form-input form-textarea ${errors.observations ? 'error' : ''}`}
                                placeholder="I tested the login functionality by...&#10;&#10;I noticed that...&#10;&#10;The overall user experience was..."
                                value={formData.observations}
                                onChange={handleChange}
                                rows={6}
                            />
                            <div className="char-count">
                                {formData.observations.length}/50 min characters
                            </div>
                            {errors.observations && <p className="form-error">{errors.observations}</p>}
                        </div>

                        {/* Steps to Reproduce (conditional) */}
                        {formData.testResult !== 'pass' && (
                            <div className="form-section">
                                <h3 className="section-title">Steps to Reproduce *</h3>
                                <p className="section-description">For issues found, provide detailed steps to reproduce.</p>

                                <textarea
                                    name="stepsToReproduce"
                                    className={`form-input form-textarea ${errors.stepsToReproduce ? 'error' : ''}`}
                                    placeholder="1. Navigate to the login page&#10;2. Enter invalid credentials&#10;3. Click 'Submit'&#10;4. Bug: Error message not displayed"
                                    value={formData.stepsToReproduce}
                                    onChange={handleChange}
                                    rows={5}
                                />
                                {errors.stepsToReproduce && <p className="form-error">{errors.stepsToReproduce}</p>}
                            </div>
                        )}

                        {/* Proof Link */}
                        <div className="form-section">
                            <h3 className="section-title">Proof of Testing *</h3>
                            <p className="section-description">Provide a link to your screenshots or video recordings (Google Drive, Loom, Imgur, etc.)</p>

                            <div className="proof-type-selector">
                                <label className={`proof-type-option ${formData.proofType === 'screenshot' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="proofType"
                                        value="screenshot"
                                        checked={formData.proofType === 'screenshot'}
                                        onChange={handleChange}
                                    />
                                    <span>📷 Screenshots</span>
                                </label>
                                <label className={`proof-type-option ${formData.proofType === 'video' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="proofType"
                                        value="video"
                                        checked={formData.proofType === 'video'}
                                        onChange={handleChange}
                                    />
                                    <span>🎥 Video Recording</span>
                                </label>
                            </div>

                            <div className="proof-link-input">
                                <div className="input-with-icon">
                                    <FiLink className="input-icon" size={18} />
                                    <input
                                        type="url"
                                        name="proofUrl"
                                        className={`form-input ${errors.proofUrl ? 'error' : ''}`}
                                        placeholder={formData.proofType === 'video'
                                            ? 'https://drive.google.com/... or https://www.loom.com/...'
                                            : 'https://drive.google.com/... or https://imgur.com/...'}
                                        value={formData.proofUrl}
                                        onChange={handleChange}
                                    />
                                </div>
                                <p className="proof-link-hint">
                                    💡 Upload your {formData.proofType === 'video' ? 'screen recording' : 'screenshots'} to Google Drive, Dropbox, Imgur, or Loom and paste the shareable link here. Make sure the link is publicly accessible.
                                </p>
                            </div>
                            {errors.proofUrl && <p className="form-error">{errors.proofUrl}</p>}
                        </div>

                        {/* Submit Button */}
                        <div className="form-actions">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                icon={<FiSend />}
                                loading={isSubmitting}
                            >
                                Submit Feedback
                            </Button>
                        </div>
                    </form>
                )}
            </div>

                {/* Sidebar Info */}
                <div className="submit-sidebar">
                    <div className="card info-card">
                        <h4>Task Details</h4>
                        <div className="info-item">
                            <span className="info-label">App Name</span>
                            <span className="info-value">{task.appName}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Test Types</span>
                            <span className="info-value">{task.testTypes?.join(', ')}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Reward</span>
                            <span className="info-value reward">{task.credits} Credits</span>
                        </div>
                        <div className="info-item" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="info-label">App URL</span>
                            <a href={task.appUrl} target="_blank" rel="noopener noreferrer" className="app-link-sidebar">
                                {task.appUrl}
                            </a>
                        </div>
                    </div>

                    <div className="card tips-card">
                        <h4>💡 Tips for Approval</h4>
                        <ul>
                            <li>Provide detailed observations with specific examples</li>
                            <li>Include clear screenshots showing the tested areas</li>
                            <li>For video: record your entire testing session</li>
                            <li>Describe both positive findings and issues</li>
                            <li>Use numbered steps when describing bugs</li>
                        </ul>
                    </div>

                    <div className="card ai-info-card">
                        <h4>🤖 AI Verification</h4>
                        <p>Your submission will be automatically analyzed by our AI to verify proof quality and assign credit scores.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SubmitFeedback;
