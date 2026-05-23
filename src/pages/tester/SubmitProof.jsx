import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI, feedbackAPI, notificationsAPI } from '../../services/api';
import Button from '../../components/common/Button';
import { FiUpload, FiCheckCircle, FiInfo, FiVideo, FiImage } from 'react-icons/fi';
import './SubmitProof.css';

function SubmitProof() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        observations: '',
        proofType: 'screenshots',
        issuesFound: 'none'
    });
    const [task, setTask] = useState({ appName: 'Loading...' });

    useEffect(() => {
        async function fetchTask() {
            try {
                const res = await tasksAPI.get(taskId);
                setTask(res.task || res);
            } catch (err) {
                console.error('Failed to load task:', err);
            }
        }
        if (taskId) fetchTask();
    }, [taskId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await feedbackAPI.submit({
                task: taskId,
                observations: formData.observations,
                proofType: formData.proofType,
                testResult: formData.issuesFound === 'none' ? 'pass' : formData.issuesFound === 'minor' ? 'issues-found' : 'fail',
                proofUrl: 'uploaded-proof',
            });

            // Notify the Developer
            if (task && (task.developer_id || task.user_id)) {
                try {
                    await notificationsAPI.create({
                        userId: task.developer_id || task.user_id,
                        title: 'New Proof Submitted 📤',
                        message: `A tester has submitted proof for your task: ${task.appName || 'Task'}`,
                        type: 'info',
                        link: `/developer/feedback`
                    });
                } catch (nError) {
                    console.error('Failed to notify developer:', nError);
                }
            }
            setIsLoading(false);
            navigate('/tester/status');
        } catch (err) {
            setIsLoading(false);
            console.error(err);
        }
    };

    return (
        <div className="submit-proof-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Submit Testing Proof</h1>
                    <p className="page-subtitle">Provide details and evidence of your testing for {task.appName}.</p>
                </div>
            </div>

            <div className="card submission-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Proof Type</label>
                        <div className="proof-type-selector">
                            <label className={`type-option ${formData.proofType === 'screenshots' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="proofType"
                                    value="screenshots"
                                    checked={formData.proofType === 'screenshots'}
                                    onChange={(e) => setFormData({ ...formData, proofType: e.target.value })}
                                />
                                <FiImage />
                                <span>Screenshots (ZIP)</span>
                            </label>
                            <label className={`type-option ${formData.proofType === 'video' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="proofType"
                                    value="video"
                                    checked={formData.proofType === 'video'}
                                    onChange={(e) => setFormData({ ...formData, proofType: e.target.value })}
                                />
                                <FiVideo />
                                <span>Screen Recording</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Upload Evidence</label>
                        <div className="upload-zone">
                            <FiUpload size={32} />
                            <p>Click or drag files to upload proof (Max 50MB)</p>
                            <span className="upload-hint">Supported formats: .zip, .mp4, .mov</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Key Observations</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Describe what you found during testing. Be specific about steps taken..."
                            rows="6"
                            value={formData.observations}
                            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                            required
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Test Result</label>
                        <select
                            className="form-select"
                            value={formData.issuesFound}
                            onChange={(e) => setFormData({ ...formData, issuesFound: e.target.value })}
                        >
                            <option value="none">No Issues Found (Pass)</option>
                            <option value="minor">Minor UI/UX Issues Found</option>
                            <option value="major">Major Functionality Bugs Found</option>
                            <option value="critical">Critical Security/Crash Vulnerabilities Found</option>
                        </select>
                    </div>

                    <div className="submission-actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={isLoading}
                            icon={<FiCheckCircle />}
                        >
                            Submit Proof
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SubmitProof;
