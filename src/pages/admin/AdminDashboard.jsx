import { BsCurrencyRupee } from 'react-icons/bs';
import { useState, useEffect } from 'react';
import { tasksAPI, usersAPI, transactionsAPI } from '../../services/api';
import { formatCurrency, formatCredits, formatDate } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import Chart from '../../components/common/Chart';
import { FiUsers, FiActivity, FiAlertTriangle, FiArrowUpRight, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
    const [timeRange, setTimeRange] = useState('7d');
    const [dashStats, setDashStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [creditLogs, setCreditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, usersRes, txRes] = await Promise.all([
                    tasksAPI.getStats(),
                    usersAPI.list(),
                    transactionsAPI.list(),
                ]);
                setDashStats(statsRes);
                setUsers(usersRes.users || []);
                setCreditLogs(txRes.transactions || []);
            } catch (err) {
                console.error('Failed to load dashboard:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading || !dashStats) return <div className="loading">Loading...</div>;

    const stats = [
        {
            label: 'Total Users',
            value: dashStats.totalUsers || 0,
            icon: FiUsers,
            iconClass: 'primary',
            change: dashStats.usersChange || 0,
            positive: true,
        },
        {
            label: 'Platform Revenue',
            value: formatCurrency(dashStats.platformRevenue || 0),
            icon: BsCurrencyRupee,
            iconClass: 'success',
            change: dashStats.revenueChange || 0,
            positive: true,
        },
        {
            label: 'Active Tasks',
            value: dashStats.activeTasks || 0,
            icon: FiActivity,
            iconClass: 'secondary',
        },
        {
            label: 'Disputes Pending',
            value: dashStats.disputesPending || 0,
            icon: FiAlertTriangle,
            iconClass: 'warning',
        },
    ];

    const revenueData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Revenue',
                data: [4500, 5200, 4800, 6100, 5800, 4200, 5500],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
            },
        ],
    };

    const userGrowthData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
            {
                label: 'Developers',
                data: [45, 62, 78, 95],
                borderColor: '#6366f1',
            },
            {
                label: 'Testers',
                data: [80, 110, 145, 180],
                borderColor: '#14b8a6',
            },
        ],
    };

    const taskDistributionData = {
        labels: ['UI Testing', 'Functional', 'Performance', 'Security', 'Usability'],
        datasets: [
            {
                data: [35, 25, 18, 12, 10],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(20, 184, 166, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                ],
            },
        ],
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            active: { label: 'Active', variant: 'success' },
            inactive: { label: 'Inactive', variant: 'secondary' },
            suspended: { label: 'Suspended', variant: 'danger' },
        };
        const config = statusMap[status] || { label: status, variant: 'secondary' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="admin-dashboard">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p className="page-subtitle">Platform overview and management</p>
                </div>
                <div className="time-range-selector">
                    {['24h', '7d', '30d', '90d'].map(range => (
                        <button
                            key={range}
                            className={`time-btn ${timeRange === range ? 'active' : ''}`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range}
                        </button>
                    ))}
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
                                <span>{stat.change}% vs last period</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="content-grid">
                <div className="col-8">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Platform Revenue</h3>
                        </div>
                        <Chart type="line" data={revenueData} height={280} />
                    </div>
                </div>
                <div className="col-4">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Task Distribution</h3>
                        </div>
                        <Chart type="doughnut" data={taskDistributionData} height={220} />
                    </div>
                </div>
            </div>

            {/* Users and Activity */}
            <div className="content-grid" style={{ marginTop: 'var(--space-6)' }}>
                {/* Recent Users */}
                <div className="col-6">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Recent Users</h3>
                            <Link to="/admin/users" className="card-link">
                                View all <FiArrowUpRight size={14} />
                            </Link>
                        </div>
                        <div className="users-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.slice(0, 5).map(user => (
                                        <tr key={user._id || user.id}>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="avatar sm">{user.name.split(' ').map(n => n[0]).join('')}</div>
                                                    <div>
                                                        <p className="user-name">{user.name}</p>
                                                        <p className="user-email">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <Badge variant={user.role === 'developer' ? 'primary' : 'secondary'}>
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td>{getStatusBadge(user.status)}</td>
                                            <td className="date-cell">{formatDate(user.joinedAt || user.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Recent Credit Activity */}
                <div className="col-6">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Credit Activity</h3>
                            <Link to="/admin/credits" className="card-link">
                                View all <FiArrowUpRight size={14} />
                            </Link>
                        </div>
                        <div className="credit-activity">
                            {creditLogs.slice(0, 5).map(log => (
                                <div key={log._id || log.id} className="credit-log-item">
                                    <div className="log-info">
                                        <p className="log-description">{log.description}</p>
                                        <p className="log-user">{log.userName} • {formatDate(log.timestamp)}</p>
                                    </div>
                                    <span className={`log-amount ${log.type}`}>
                                        {log.type === 'credit' ? '+' : '-'}{formatCredits(log.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* User Growth Chart */}
                <div className="col-12" style={{ marginTop: 'var(--space-6)' }}>
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">User Growth</h3>
                        </div>
                        <Chart type="line" data={userGrowthData} height={250} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
