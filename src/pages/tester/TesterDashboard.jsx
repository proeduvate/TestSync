import { BsCurrencyRupee } from 'react-icons/bs';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI, transactionsAPI } from '../../services/api';
import { formatCurrency, formatCredits, formatDate, getDeadlineStatus } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Badge, { AIBadge } from '../../components/common/Badge';
import Chart from '../../components/common/Chart';
import Loader from '../../components/common/Loader';
import { FiClipboard, FiStar, FiCreditCard, FiArrowUpRight, FiCalendar, FiTrendingUp, FiExternalLink } from 'react-icons/fi';
import './TesterDashboard.css';

function TesterDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [activeTasks, setActiveTasks] = useState([]);
    const [marketplaceTasks, setMarketplaceTasks] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, myTasksRes, marketRes, analyticsRes] = await Promise.all([
                    tasksAPI.getStats(),
                    tasksAPI.myTasks(),
                    tasksAPI.marketplace(),
                    transactionsAPI.getTesterAnalytics(),
                ]);
                setStats(statsRes);
                setAnalytics(analyticsRes);
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
            value: formatCredits(stats.availableCredits || 0),
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

    const earningsData = {
        labels: analytics?.earningsOverTime?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Credits Earned',
                data: analytics?.earningsOverTime?.data || [0, 0, 0, 0, 0, 0],
            },
        ],
    };

    const submissionData = {
        labels: analytics?.submissionQuality?.labels || ['Approved', 'Rejected', 'Revision', 'Pending'],
        datasets: [
            {
                data: analytics?.submissionQuality?.data || [0, 0, 0, 0],
                backgroundColor: [
                    '#10b981', // success
                    '#ef4444', // error
                    '#f59e0b', // warning
                    '#3b82f6', // primary
                ],
                borderWidth: 0,
            },
        ],
    };

    return (
        <div className="tester-dashboard">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}!</h1>
                    <p className="page-subtitle">Your testing performance this month</p>
                </div>
                <div className="page-actions">
                    <Link to="/tester/marketplace">
                        <Button variant="primary" icon={<FiExternalLink />}>
                            Browse Tasks
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <div key={index} className="card stats-card">
                        <div className={`stats-icon ${stat.iconClass}`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="stats-value">{stat.value}</div>
                        <div className="stats-label">{stat.label}</div>
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

                        {activeTasks.length > 0 ? (
                            <div className="active-tasks-list">
                                {activeTasks.map(task => {
                                    const deadline = getDeadlineStatus(task.deadline);
                                    return (
                                        <div key={task._id || task.id} className="active-task-item">
                                            <div className="task-main">
                                                <h4 className="task-app-name">{task.appName}</h4>
                                                <p className="task-test-types">{task.testTypes.join(', ')}</p>
                                            </div>
                                            <div className="task-deadline">
                                                <FiCalendar size={14} />
                                                <span>{formatDate(task.deadline)}</span>
                                                <Badge variant={deadline.color} size="sm">{deadline.label}</Badge>
                                            </div>
                                            <div className="task-credits">
                                                <span className="credits-value">{formatCredits(task.credits || task.budget || 0)}</span>
                                                <span className="credits-label">Credits</span>
                                            </div>
                                            <div className="task-action">
                                                <Link to={`/tester/submit/${task._id || task.id}`}>
                                                    <Button 
                                                        variant={task.submissionStatus === 'needs-revision' ? 'warning' : 'primary'} 
                                                        size="sm"
                                                    >
                                                        {task.submissionStatus === 'needs-revision' ? 'Revise Submission' : 'Submit Work'}
                                                    </Button>
                                                </Link>
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No active tasks. Browse the marketplace to find new work.</p>
                                <Link to="/tester/marketplace">
                                    <Button variant="secondary">Browse Tasks</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Earnings Chart */}
                <div className="col-4">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Weekly Earnings</h3>
                        </div>
                        <Chart
                            type="bar"
                            data={earningsData}
                            height={220}
                        />
                    </div>
                </div>

                {/* Available Tasks Preview */}
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Available in Marketplace</h3>
                            <Link to="/tester/marketplace" className="card-link">
                                View all <FiArrowUpRight size={14} />
                            </Link>
                        </div>
                        <div className="available-tasks-grid">
                            {marketplaceTasks.slice(0, 3).map(task => (
                                <div key={task._id || task.id} className="available-task-card">
                                    <div className="task-header">
                                        <Badge variant="primary">{task.level || task.testingLevel}</Badge>
                                        <span className="task-posted">Posted {formatDate(task.postedAt || task.createdAt)}</span>
                                    </div>
                                    <h4 className="task-title">{task.appName}</h4>
                                    <p className="task-company">{task.companyName || task.company || ''}</p>
                                    <div className="task-tags">
                                        {task.testTypes.slice(0, 2).map(type => (
                                            <span key={type} className="task-tag">{type}</span>
                                        ))}
                                        {task.testTypes.length > 2 && (
                                            <span className="task-tag">+{task.testTypes.length - 2}</span>
                                        )}
                                    </div>
                                    <div className="task-footer">
                                        <div className="task-reward">
                                            <span className="reward-value">{formatCredits(task.credits || task.budget || 0)}</span>
                                            <span className="reward-label">Credits</span>
                                        </div>
                                        <Link to={`/tester/task/${task._id || task.id}`}>
                                            <Button variant="ghost" size="sm">View Details</Button>
                                        </Link>
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

export default TesterDashboard;
