import { BsCurrencyRupee } from 'react-icons/bs';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI, feedbackAPI } from '../../services/api';
import { formatCurrency, formatDate, getDeadlineStatus } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Badge, { AIBadge } from '../../components/common/Badge';
import Chart from '../../components/common/Chart';
import Loader from '../../components/common/Loader';
import { FiPlus, FiClipboard, FiCheckCircle, FiMessageSquare, FiArrowUpRight, FiTrendingUp, FiTrendingDown, FiStar } from 'react-icons/fi';
import './DeveloperDashboard.css';

function DeveloperDashboard() {
    const { user } = useAuth();
    const [dashStats, setDashStats] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, tasksRes, feedbackRes, analyticsRes] = await Promise.all([
                    tasksAPI.getStats(),
                    tasksAPI.list(),
                    feedbackAPI.list(),
                    tasksAPI.getDashboardAnalytics(),
                ]);
                setDashStats(statsRes);
                setTasks(tasksRes.tasks || []);
                setFeedback(feedbackRes.feedback || []);
                setAnalytics(analyticsRes);
            } catch (err) {
                console.error('Failed to load dashboard:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading || !dashStats) return <Loader />;

    const stats = [
        {
            label: 'Active Projects',
            value: dashStats.activeProjects,
            icon: FiClipboard,
            iconClass: 'primary',
            change: dashStats.activeProjectsChange,
            positive: true,
        },
        {
            label: 'Completed Projects',
            value: dashStats.completedProjects,
            icon: FiCheckCircle,
            iconClass: 'success',
            change: dashStats.completedProjectsChange,
            positive: true,
        },
        {
            label: 'Total Budget Spent',
            value: formatCurrency(dashStats.totalBudgetSpent),
            icon: FiTrendingUp,
            iconClass: 'secondary',
        },
        {
            label: 'Feedback Received',
            value: feedback.length,
            icon: FiMessageSquare,
            iconClass: 'accent',
        },
    ];

    const bugTrendsData = analytics?.bugTrends || {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
            {
                label: 'Critical Bugs',
                data: [12, 19, 3, 5],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
            },
            {
                label: 'Minor Issues',
                data: [45, 32, 56, 48],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
            }
        ]
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'open': { label: 'Open', variant: 'info' },
            'in-progress': { label: 'In Progress', variant: 'primary' },
            'pending-review': { label: 'Pending Review', variant: 'warning' },
            'completed': { label: 'Completed', variant: 'success' },
        };
        const config = statusMap[status] || { label: status, variant: 'secondary' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="developer-dashboard">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}!</h1>
                    <p className="page-subtitle">Here's what's happening with your projects today.</p>
                </div>
                <div className="page-actions">
                    <Link to="/developer/create-task">
                        <Button variant="primary" icon={<FiPlus />}>
                            Create New Task
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="card stats-card">
                        <div className={`stats-icon ${stat.iconClass}`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="stats-value">{stat.value}</div>
                        <div className="stats-label">{stat.label}</div>
                        {stat.change && (
                            <div className={`stats-change ${stat.positive ? 'positive' : 'negative'}`}>
                                {stat.positive ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                                <span>{stat.change}% from last month</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="content-grid">
                {/* Recent Tasks */}
                <div className="col-8">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Recent Tasks</h3>
                            <Link to="/developer/tasks" className="card-link">
                                View all <FiArrowUpRight size={14} />
                            </Link>
                        </div>
                        <div className="task-list">
                            {tasks.filter(t => t.status !== 'completed').slice(0, 4).map(task => {
                                const deadlineStatus = getDeadlineStatus(task.deadline);
                                return (
                                    <div key={task._id || task.id} className="task-item">
                                        <div className="task-info">
                                            <h4 className="task-name">{task.appName}</h4>
                                            <p className="task-meta">
                                                {task.testTypes.join(', ')} • {task.testersAssigned || 0} testers assigned
                                            </p>
                                        </div>
                                        <div className="task-status">
                                            {getStatusBadge(task.status)}
                                        </div>
                                        <div className="task-progress">
                                            <div className="progress">
                                                <div
                                                    className="progress-bar"
                                                    style={{ width: `${task.progress}%` }}
                                                />
                                            </div>
                                            <span className="progress-label">{task.progress}%</span>
                                        </div>
                                        <div className="task-deadline">
                                            <Badge variant={deadlineStatus.color} size="sm">
                                                {deadlineStatus.label}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="col-8">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Bug Discovery Trends</h3>
                        </div>
                        <Chart
                            type="line"
                            data={bugTrendsData}
                            height={220}
                        />
                    </div>
                </div>

                <div className="col-4">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Budget Spent</h3>
                        </div>
                        <Chart
                            type="bar"
                            data={{
                                labels: analytics?.budgetSpent?.labels || [],
                                datasets: [{
                                    label: 'Monthly Spend',
                                    data: analytics?.budgetSpent?.data || [],
                                    backgroundColor: '#10b981'
                                }]
                            }}
                            height={220}
                        />
                    </div>
                </div>

                {/* Recent Feedback */}
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Recent Feedback</h3>
                            <Link to="/developer/feedback" className="card-link">
                                View all <FiArrowUpRight size={14} />
                            </Link>
                        </div>
                        <div className="feedback-grid">
                            {feedback.slice(0, 3).map(fb => (
                                <div key={fb._id || fb.id} className="feedback-card">
                                    <div className="feedback-header">
                                        <div className="feedback-tester">
                                            <div className="avatar sm">{(fb.testerName || 'U').split(' ').map(n => n[0]).join('')}</div>
                                            <div>
                                                <p className="tester-name">{fb.testerName}</p>
                                                <p className="tester-rating">
                                                    <FiStar size={14} style={{ color: '#f59e0b', marginRight: '4px' }} />
                                                    {fb.testerRating}
                                                </p>
                                            </div>
                                        </div>
                                        <AIBadge status={fb.aiVerification} />
                                    </div>
                                    <p className="feedback-task">{fb.taskName}</p>
                                    <p className="feedback-observations">{fb.observations}</p>
                                    <div className="feedback-footer">
                                        <span className="feedback-date">{formatDate(fb.submittedAt || fb.createdAt)}</span>
                                        <Badge
                                            variant={fb.status === 'approved' ? 'success' : fb.status === 'needs-revision' ? 'warning' : 'info'}
                                        >
                                            {fb.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DeveloperDashboard;
