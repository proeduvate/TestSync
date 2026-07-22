import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI, transactionsAPI } from '../../services/api';
import { formatCurrency, formatCredits, formatDate, getDeadlineStatus } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { FiClipboard, FiStar, FiCreditCard, FiArrowUpRight, FiTrendingUp, FiExternalLink } from 'react-icons/fi';
import './TesterDashboard.css';

function TesterDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [activeTasks, setActiveTasks] = useState([]);
    const [marketplaceTasks, setMarketplaceTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, myTasksRes, marketRes] = await Promise.all([
                    tasksAPI.getStats(),
                    tasksAPI.myTasks(),
                    tasksAPI.marketplace(),
                ]);
                setStats(statsRes);
                const tasks = (myTasksRes.tasks || []);
                setActiveTasks(tasks.filter(t => !t.hasSubmitted));
                setMarketplaceTasks(marketRes.tasks || []);
            } catch (err) {
                console.error('Failed to load dashboard:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading || !stats) return <Loader />;

    const statCards = [
        {
            label: 'Available Credits',
            value: (stats.availableCredits || 0).toLocaleString(),
            icon: FiCreditCard,
            iconClass: 'primary',
            subtext: `≈ ${formatCurrency((stats.availableCredits || 0) * 0.1)}`,
        },
        {
            label: 'Total Earnings',
            value: formatCurrency(stats.totalEarnings || 0),
            icon: FiTrendingUp,
            iconClass: 'success',
            change: '+12%',
            positive: true,
        },
        {
            label: 'Completed Tasks',
            value: stats.completedTasks || 0,
            icon: FiClipboard,
            iconClass: 'secondary',
        },
        {
            label: 'Rating',
            value: (stats.rating || 0).toFixed(1),
            icon: FiStar,
            iconClass: 'warning',
            subtext: `${stats.reviewCount || 0} reviews`,
        },
    ];

    const getStatusBadge = (task) => {
        if (task.submissionStatus === 'needs-revision') {
            return <Badge variant="warning">Needs Revision</Badge>;
        }
        if (task.submissionStatus === 'pending') {
            return <Badge variant="info">Pending Review</Badge>;
        }
        const statusMap = {
            'open': { label: 'Open', variant: 'info' },
            'in-progress': { label: 'In Progress', variant: 'primary' },
            'pending-review': { label: 'Pending Review', variant: 'warning' },
            'completed': { label: 'Completed', variant: 'success' },
        };
        const config = statusMap[task.status] || { label: task.status || 'Active', variant: 'secondary' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="tester-dashboard">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard Overview</h1>
                    <p className="page-subtitle">Here's what's happening with your tasks today.</p>
                </div>
                <div className="page-actions">
                    <Link to="/tester/marketplace">
                        <Button variant="primary" icon={<FiExternalLink />} size="sm">
                            Browse Tasks
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <div key={index} className="card stats-card">
                        <div className="stats-left">
                            <div className={`stats-icon ${stat.iconClass}`}>
                                <stat.icon size={20} />
                            </div>
                            <div className="stats-value">{stat.value}</div>
                            {stat.subtext && (
                                <div className="stats-subtext">{stat.subtext}</div>
                            )}
                            {stat.change && (
                                <div className={`stats-change ${stat.positive ? 'positive' : 'negative'}`}>
                                    <FiTrendingUp size={12} />
                                    <span>{stat.change} this month</span>
                                </div>
                            )}
                        </div>
                        <div className="stats-right">
                            <div className="stats-label">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="content-grid">
                {/* Active Tasks */}
                <div className="col-8">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Your Active Tasks</h3>
                            <Link to="/tester/my-tasks" className="card-link">
                                View all <FiArrowUpRight size={14} />
                            </Link>
                        </div>
                        <div className="task-list">
                            {activeTasks.slice(0, 4).map(task => {
                                const deadlineStatus = getDeadlineStatus(task.deadline);
                                return (
                                    <Link 
                                        key={task._id || task.id} 
                                        to={`/tester/submit/${task._id || task.id}`} 
                                        className="task-item"
                                    >
                                        <div className="task-info">
                                            <h4 className="task-name">{task.appName}</h4>
                                            <p className="task-meta">
                                                {task.testTypes.join(', ')}
                                            </p>
                                        </div>
                                        <div className="task-status">
                                            {getStatusBadge(task)}
                                        </div>
                                        <div className="task-progress">
                                            <span>{(task.credits || task.budget || 0).toLocaleString()} Credits</span>
                                        </div>
                                        <div className="task-deadline">
                                            <Badge variant={deadlineStatus.color} size="sm">
                                                {deadlineStatus.label}
                                            </Badge>
                                        </div>
                                    </Link>
                                );
                            })}
                            {activeTasks.length === 0 && (
                                <div className="empty-state">
                                    <p>No active tasks. Browse the marketplace to find new work.</p>
                                    <Link to="/tester/marketplace">
                                        <Button variant="secondary" size="sm">Browse Tasks</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Available Tasks Preview */}
                <div className="col-4">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Available Tasks</h3>
                            <Link to="/tester/marketplace" className="card-link">
                                Browse all <FiArrowUpRight size={14} />
                            </Link>
                        </div>
                        <div className="marketplace-vertical-list">
                            {marketplaceTasks.slice(0, 3).map(task => (
                                <Link 
                                    key={task._id || task.id} 
                                    to={`/tester/task/${task._id || task.id}`} 
                                    className="marketplace-item-mini"
                                >
                                    <div className="marketplace-header">
                                        <span className="task-app-name">{task.appName}</span>
                                        <Badge variant="primary" size="sm">{task.level || task.testingLevel}</Badge>
                                    </div>
                                    <p className="task-company">{task.companyName || task.company || 'TestSync Platform'}</p>
                                    <div className="task-footer-mini">
                                        <span className="credits-amount">{(task.credits || task.budget || 0).toLocaleString()} Credits</span>
                                        <span className="task-posted">{formatDate(task.postedAt || task.createdAt)}</span>
                                    </div>
                                </Link>
                            ))}
                            {marketplaceTasks.length === 0 && (
                                <p className="no-data">No tasks available in marketplace.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TesterDashboard;
