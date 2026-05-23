import { BsCurrencyRupee } from 'react-icons/bs';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { formatDate, formatCredits } from '../../utils/helpers';
import { FiArrowRight, FiClock, FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import './MyTasks.css';

function MyTasks() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('active');
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTasks() {
            try {
                const res = await tasksAPI.myTasks();
                setTasks(res.tasks || []);
            } catch (err) {
                console.error('Failed to load tasks:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchTasks();
    }, []);

    const activeTasks = tasks.filter(t => !t.hasSubmitted);
    const completedTasks = tasks.filter(t => t.hasSubmitted);


    const displayedTasks = activeTab === 'active' ? activeTasks : completedTasks;

    const getStatusBadge = (task) => {
        if (task.submissionStatus === 'approved') {
            return <Badge variant="success">Completed</Badge>;
        }
        if (task.submissionStatus === 'rejected' || task.status === 'rejected') {
            return <Badge variant="danger">Rejected</Badge>;
        }

        const statusMap = {
            'open': { label: 'Accepted', variant: 'info' },
            'in-progress': { label: 'In Progress', variant: 'primary' },
            'pending-review': { label: 'Pending Review', variant: 'warning' },
            'under-verification': { label: 'Under Verification', variant: 'warning' },
            'completed': { label: 'Completed', variant: 'success' },
        };
        const config = statusMap[task.status] || { label: task.status, variant: 'secondary' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getActionButton = (task) => {
        if (task.submissionStatus === 'approved' || task.status === 'completed') {
            return (
                <div className="completed-info">
                    <FiCheckCircle size={16} style={{ color: 'var(--accent-success)' }} />
                    <span>Credits Earned: {formatCredits(task.credits || task.budget || 0)}</span>
                </div>
            );
        }

        switch (task.status) {
            case 'open':
            case 'in-progress':
                return (
                    <Link to={`/tester/submit/${task._id || task.taskId || task.id}`}>
                        <Button 
                            variant={task.submissionStatus === 'needs-revision' ? 'warning' : 'primary'} 
                            fullWidth 
                            icon={<FiArrowRight />} 
                            iconPosition="right"
                        >
                            {task.submissionStatus === 'needs-revision' ? 'Revise Submission' : 'Continue Testing'}
                        </Button>
                    </Link>
                );

            case 'pending-review':
            case 'under-verification':
                return (
                    <Button variant="secondary" fullWidth disabled>
                        Awaiting Review
                    </Button>
                );
            case 'rejected':
                return (
                    <Button variant="danger" fullWidth disabled>
                        Submission Rejected
                    </Button>
                );
            default:
                return (
                    <Link to={`/tester/submit/${task._id || task.taskId || task.id}`}>
                        <Button variant="primary" fullWidth icon={<FiArrowRight />} iconPosition="right">
                            View Task
                        </Button>
                    </Link>
                );
        }
    };


    return (
        <div className="my-tasks-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Tasks</h1>
                    <p className="page-subtitle">Manage your active tests and track submissions.</p>
                </div>
                <div className="tab-switcher">
                    <button
                        className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active Tasks ({activeTasks.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed ({completedTasks.length})
                    </button>
                </div>
            </div>

            <div className="tasks-grid">
                {displayedTasks.map(task => (
                    <div key={task._id || task.id} className={`card task-card ${task.status === 'completed' ? 'completed' : ''}`}>
                        <div className="task-card-header">
                            <div className="company-info">
                                <div className="company-logo">
                                    {(task.company || task.developerCompany || 'C').split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="company-name">{task.company || task.developerCompany || ''}</span>
                            </div>
                            {getStatusBadge(task.status)}
                        </div>

                        <h3 className="app-name">{task.appName}</h3>

                        <div className="task-meta-grid">
                            <div className="meta-item">
                                <FiClock size={14} />
                                <span>Deadline: {formatDate(task.deadline)}</span>
                            </div>
                            <div className="meta-item">
                                <BsCurrencyRupee size={14} />
                                <span>Credits: {formatCredits(task.credits || task.budget || 0)}</span>
                            </div>
                            <div className="meta-item full-width">
                                <FiExternalLink size={14} />
                                <a href={task.appUrl} target="_blank" rel="noopener noreferrer" className="app-link-inline">
                                    Visit App URL
                                </a>
                            </div>
                        </div>

                        {activeTab === 'active' && (
                            <div className="task-progress-section">
                                <div className="progress-info">
                                    <span>Overall Progress</span>
                                    <span>{task.progress || 0}%</span>
                                </div>
                                <div className="progress-bar-container">
                                    <div className="progress-bar" style={{ width: `${task.progress || 0}%` }} />
                                </div>
                            </div>
                        )}

                        <div className="task-card-footer">
                            {getActionButton(task)}
                        </div>
                    </div>
                ))}
            </div>

            {displayedTasks.length === 0 && (
                <div className="empty-state">
                    {activeTab === 'active' ? (
                        <>
                            <p>You don't have any active tasks.</p>
                            <Link to="/tester/marketplace">
                                <Button variant="primary">Browse Marketplace</Button>
                            </Link>
                        </>
                    ) : (
                        <p>No completed tasks yet. Keep testing to earn credits!</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default MyTasks;
