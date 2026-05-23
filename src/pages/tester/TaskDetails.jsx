import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksAPI } from '../../services/api';
import { formatCredits, formatDate, getDeadlineStatus } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { useToast } from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../lib/supabase';
import { FiCalendar, FiClock, FiCheckCircle, FiInfo, FiArrowLeft } from 'react-icons/fi';
import './TaskDetails.css';

function TaskDetails() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [alreadyAccepted, setAlreadyAccepted] = useState(false);

    useEffect(() => {
        async function fetchTask() {
            try {
                const res = await tasksAPI.get(taskId);
                setTask(res.task);

                // Check if current tester has already accepted this task
                if (user?.id) {
                    const { data } = await supabase
                        .from('task_testers')
                        .select('id')
                        .eq('task_id', taskId)
                        .eq('tester_id', user.id)
                        .maybeSingle();
                    if (data) setAlreadyAccepted(true);
                }
            } catch (err) {
                console.error('Failed to load task:', err);
            } finally {
                setLoading(false);
            }
        }
        if (taskId) fetchTask();
    }, [taskId, user]);

    if (loading) return <Loader />;

    if (!task) {
        return (
            <div className="task-details-page">
                <div className="error-container">
                    <h2>Task Not Found</h2>
                    <p>The task you are looking for might have been removed or is no longer available.</p>
                    <Button variant="primary" onClick={() => navigate('/tester/marketplace')}>
                        Back to Marketplace
                    </Button>
                </div>
            </div>
        );
    }

    const deadline = getDeadlineStatus(task.deadline);

    const handleAcceptTask = async () => {
        setApplying(true);
        try {
            await tasksAPI.apply(task.id || task._id);
            toast.success(
                'Task Accepted!',
                `You have successfully accepted "${task.appName}". Good luck!`
            );
            setTimeout(() => {
                navigate('/tester/my-tasks');
            }, 500);
        } catch (err) {
            toast.error('Error', err.message || 'Failed to accept task');
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="task-details-page">
            <button className="back-link" onClick={() => navigate(-1)}>
                <FiArrowLeft size={18} />
                Back to Marketplace
            </button>

            <div className="task-details-header">
                <div className="header-main">
                    <Badge variant="primary" size="lg">{task.level || task.testingLevel}</Badge>
                    <h1 className="task-title">{task.appName}</h1>
                    <p className="company-name">by {task.companyName || task.company || 'Unknown'}</p>
                </div>
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-value">{formatCredits(task.credits || task.budget)}</span>
                        <span className="stat-label">Credits</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-value">{task.openSlots ?? 0}</span>
                        <span className="stat-label">Spots Left</span>
                    </div>
                </div>
            </div>

            <div className="task-details-grid">
                <div className="details-main">
                    <section className="details-section">
                        <h2 className="section-title">Description</h2>
                        <p className="description-text">{task.description}</p>
                    </section>

                    <section className="details-section">
                        <h2 className="section-title">What to Test</h2>
                        <div className="test-types-list">
                            {(task.testTypes || []).map(type => (
                                <div key={type} className="test-type-item">
                                    <FiCheckCircle className="check-icon" />
                                    <span>{type} Testing</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="details-section">
                        <h2 className="section-title">Requirements</h2>
                        <ul className="requirements-list">
                            <li>Must have a stable internet connection.</li>
                            <li>Environment: Latest version of Chrome or Safari.</li>
                            <li>Detailed observations for each test case.</li>
                            <li>Clear screenshots or video recording of issues found.</li>
                        </ul>
                    </section>
                </div>

                <div className="details-sidebar">
                    <div className="card info-card">
                        <h3 className="card-title">Task Info</h3>
                        <div className="info-row">
                            <FiCalendar className="info-icon" />
                            <div className="info-content">
                                <span className="info-label">Deadline</span>
                                <span className="info-value">{formatDate(task.deadline)}</span>
                                <Badge variant={deadline.color} size="sm">{deadline.label}</Badge>
                            </div>
                        </div>
                        <div className="info-row">
                            <FiClock className="info-icon" />
                            <div className="info-content">
                                <span className="info-label">Estimated Time</span>
                                <span className="info-value">{task.estimatedTime || 'TBD'}</span>
                            </div>
                        </div>
                        <div className="info-row">
                            <FiInfo className="info-icon" />
                            <div className="info-content">
                                <span className="info-label">App URL</span>
                                <a href={task.appUrl} target="_blank" rel="noopener noreferrer" className="app-link">
                                    {task.appUrl}
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="acceptance-card">
                        {alreadyAccepted ? (
                            <>
                                <h3>✅ Task Accepted</h3>
                                <p>You have already accepted this task. Head to My Tasks to continue testing.</p>
                                <Button
                                    variant="primary"
                                    fullWidth
                                    size="lg"
                                    onClick={() => navigate('/tester/my-tasks')}
                                >
                                    Go to My Tasks
                                </Button>
                            </>
                        ) : (
                            <>
                                <h3>Ready to start?</h3>
                                <p>By accepting this task, you agree to complete it before the deadline and follow the testing requirements.</p>
                                <Button
                                    variant="primary"
                                    fullWidth
                                    size="lg"
                                    onClick={handleAcceptTask}
                                    loading={applying}
                                >
                                    Accept & Start Testing
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TaskDetails;
