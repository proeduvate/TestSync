import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tasksAPI, feedbackAPI } from '../../services/api';
import supabase from '../../lib/supabase';
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
                    if (res.feedback.status === 'needs-revision') {
                        setFormData({
                            testResult: res.feedback.testResult,
                            observations: res.feedback.observations,
                            stepsToReproduce: res.feedback.stepsToReproduce,
                            proofType: 'screenshot',
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
        { id: 'pass',         label: 'All Tests Passed',  icon: FiCheckCircle,  color: 'success' },
        { id: 'issues-found', label: 'Issues Found',       icon: FiAlertCircle,  color: 'warning' },
        { id: 'fail',         label: 'Critical Failures',  icon: FiMinusCircle,  color: 'danger'  },
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.observations.trim()) {
            newErrors.observations = 'Observations are required';
        } else if (formData.observations.length < 50) {
            newErrors.observations = 'Min 50 characters required';
        }

        if (!formData.proofUrl.trim()) {
            newErrors.proofUrl = 'Please provide a proof link';
        } else {
            try { new URL(formData.proofUrl); }
            catch { newErrors.proofUrl = 'Enter a valid URL (e.g. https://drive.google.com/...)'; }
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

            // 🤖 Trigger AI evaluation in the background (non-blocking)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                supabase.functions.invoke('evaluate-tester-work', {
                    body: {
                        testerId: user.id,
                        taskId,
                        proofText: formData.proofUrl,
                        feedbackText: formData.observations,
                    },
                }).catch(err => console.warn('AI evaluation error (non-critical):', err));
            }

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

            {/* ── Header ── */}
            <div className="sfp-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <FiArrowLeft size={16} />
                    <span>Back to Tasks</span>
                </button>
            </div>

            {/* ── Main Grid ── */}
            <div className="sfp-grid">

                {/* ── Left: Form Card ── */}
                <div className="sfp-form-card">

                    {isLoadingFeedback ? (
                        <div className="loading-state">Checking submission status…</div>

                    ) : existingFeedback
                        && existingFeedback.status !== 'needs-revision'
                        && existingFeedback.status !== 'rejected' ? (

                        <div className="submission-lock-state">
                            <div className="lock-icon">
                                {existingFeedback.status === 'approved'
                                    ? <FiCheckCircle size={48} className="success" />
                                    : <FiSend size={48} className="warning" />}
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
                                    <span className={`value status-${existingFeedback.status}`}>
                                        {existingFeedback.status.replace('-', ' ')}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Submitted On</span>
                                    <span className="value">
                                        {new Date(existingFeedback.submittedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <Button variant="secondary" onClick={() => navigate('/tester/dashboard')}>
                                Return to Dashboard
                            </Button>
                        </div>

                    ) : (
                        <form className="sfp-form" onSubmit={handleSubmit}>

                            {/* Revision alert */}
                            {existingFeedback?.status === 'needs-revision' && (
                                <div className="revision-alert">
                                    <FiAlertCircle size={16} />
                                    <span>The developer has requested changes. Please update your feedback and resubmit.</span>
                                </div>
                            )}

                            {/* ── Test Result ── */}
                            <div className="sfp-result-row">
                                <div className="sfp-section-label">Test Result</div>
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
                                            <result.icon size={16} />
                                            <span>{result.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* ── Textareas Row ── */}
                            <div className="sfp-textareas-row one-col">

                                {/* Observations */}
                                <div className="sfp-field">
                                    <div className="sfp-section-label">Detailed Observations *</div>
                                    <textarea
                                        name="observations"
                                        className={`form-input form-textarea ${errors.observations ? 'error' : ''}`}
                                        placeholder={"I tested the login functionality by...\n\nI noticed that...\n\nThe overall user experience was..."}
                                        value={formData.observations}
                                        onChange={handleChange}
                                    />
                                    <div className="char-count">{formData.observations.length}/50 min characters</div>
                                    {errors.observations && <p className="form-error">{errors.observations}</p>}
                                </div>


                            </div>

                            {/* ── Proof Row ── */}
                            <div className="sfp-proof-row">
                                <div>
                                    <div className="sfp-section-label">Proof of Testing *</div>
                                    <div className="sfp-proof-types">
                                        <label className={`proof-type-option ${formData.proofType === 'screenshot' ? 'selected' : ''}`}>
                                            <input type="radio" name="proofType" value="screenshot" checked={formData.proofType === 'screenshot'} onChange={handleChange} />
                                            <span>📷 Screenshots</span>
                                        </label>
                                        <label className={`proof-type-option ${formData.proofType === 'video' ? 'selected' : ''}`}>
                                            <input type="radio" name="proofType" value="video" checked={formData.proofType === 'video'} onChange={handleChange} />
                                            <span>🎥 Video Recording</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="sfp-proof-url-wrap">
                                    <div className="sfp-section-label">Link *</div>
                                    <div className="input-with-icon">
                                        <FiLink className="input-icon" size={16} />
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
                                    {errors.proofUrl
                                        ? <p className="form-error">{errors.proofUrl}</p>
                                        : <p className="proof-link-hint">
                                            💡 Upload to Google Drive, Dropbox, Imgur or Loom and paste the shareable link. Ensure it's publicly accessible.
                                          </p>
                                    }
                                </div>
                            </div>

                            {/* ── Submit ── */}
                            <div className="sfp-actions">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    icon={<FiSend />}
                                    loading={isSubmitting}
                                >
                                    Submit Feedback
                                </Button>
                            </div>

                        </form>
                    )}
                </div>

                {/* ── Right: Sidebar ── */}
                <div className="sfp-sidebar">

                    {/* Task Details */}
                    <div className="sfp-sidebar-card sfp-task-card">
                        <div className="sfp-sidebar-card-title">Task Details</div>
                        <div className="sfp-task-rows">
                            <div className="sfp-task-row">
                                <span className="sfp-task-row-label">App Name</span>
                                <span className="sfp-task-row-value">{task.appName}</span>
                            </div>
                            <div className="sfp-task-row">
                                <span className="sfp-task-row-label">Test Types</span>
                                <span className="sfp-task-row-value">{task.testTypes?.join(', ')}</span>
                            </div>
                            <div className="sfp-task-row">
                                <span className="sfp-task-row-label">Reward</span>
                                <span className="sfp-task-row-value reward-value">{task.credits} Credits</span>
                            </div>
                            <div className="sfp-task-row">
                                <span className="sfp-task-row-label">App URL</span>
                                <a href={task.appUrl} target="_blank" rel="noopener noreferrer" className="sfp-app-link">
                                    {task.appUrl}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="sfp-sidebar-card sfp-tips-card">
                        <div className="sfp-sidebar-card-title">💡 Tips for Approval</div>
                        <ul className="sfp-tips-list">
                            <li>Provide detailed observations with examples</li>
                            <li>Include clear screenshots or video recordings</li>
                            <li>List bugs with clear, numbered steps</li>
                        </ul>
                    </div>

                    {/* AI Verification */}
                    <div className="sfp-sidebar-card sfp-ai-card">
                        <div className="sfp-sidebar-card-title">🤖 AI Verification</div>
                        <p>AI automatically verifies proof quality and assigns credit scores.</p>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default SubmitFeedback;
