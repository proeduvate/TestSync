import { BsCurrencyRupee } from 'react-icons/bs';
import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import Chart from '../../components/common/Chart';
import Loader from '../../components/common/Loader';
import { FiUsers, FiActivity, FiZap } from 'react-icons/fi';
import './Analytics.css';

function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const res = await analyticsAPI.overview();
                setData(res);
            } catch (err) {
                console.error('Failed to load analytics:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, []);

    if (loading || !data) return <Loader />;

    const stats = data.stats || {};
    const charts = data.charts || {};

    // Build chart data from API response or use defaults
    const tasksOverTimeData = charts.tasksOverTime || {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{ label: 'Tasks Created', data: [10, 15, 20, 25, 30, 35] }],
    };

    const revenueData = charts.platformRevenue
        ? {
            labels: charts.platformRevenue.labels,
            datasets: [{
                label: 'Monthly Revenue',
                data: charts.platformRevenue.data,
                backgroundColor: '#6366f1',
            }],
        }
        : {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Monthly Revenue',
                data: [5000, 7000, 8500, 9200, 11000, 13500],
                backgroundColor: '#6366f1',
            }],
        };

    return (
        <div className="analytics-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Platform Analytics</h1>
                    <p className="page-subtitle">Real-time data and growth metrics for the platform.</p>
                </div>
            </div>

            <div className="analytics-stats-grid">
                <div className="card analytics-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Total Users</span>
                        <h2 className="stat-value">{stats.totalUsers || 0}</h2>
                        <span className="stat-trend positive">+{stats.usersChange || 0}% growth</span>
                    </div>
                    <FiUsers className="stat-icon" />
                </div>

                <div className="card analytics-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Active Tasks</span>
                        <h2 className="stat-value">{stats.activeTasks || 0}</h2>
                        <span className="stat-trend">ongoing sessions</span>
                    </div>
                    <FiActivity className="stat-icon" />
                </div>

                <div className="card analytics-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Total Revenue</span>
                        <h2 className="stat-value">₹{stats.platformRevenue || 0}</h2>
                        <span className="stat-trend positive">+{stats.revenueChange || 0}% growth</span>
                    </div>
                    <BsCurrencyRupee className="stat-icon" />
                </div>

                <div className="card analytics-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">AI Verifications</span>
                        <h2 className="stat-value">98.5%</h2>
                        <span className="stat-trend">Average accuracy</span>
                    </div>
                    <FiZap className="stat-icon" />
                </div>
            </div>

            <div className="charts-grid">
                <div className="card chart-card">
                    <div className="card-header">
                        <h3 className="card-title">Tasks & Completion Overview</h3>
                    </div>
                    <div className="chart-wrapper">
                        <Chart type="line" data={tasksOverTimeData} height={300} />
                    </div>
                </div>

                <div className="card chart-card">
                    <div className="card-header">
                        <h3 className="card-title">Revenue Growth</h3>
                    </div>
                    <div className="chart-wrapper">
                        <Chart type="bar" data={revenueData} height={300} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Analytics;
