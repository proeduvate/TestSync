import { useAuth } from '../../context/AuthContext';
import Chart from '../../components/common/Chart';
import Badge from '../../components/common/Badge';
import { FiDownload, FiFilter, FiCalendar } from 'react-icons/fi';
import './Reports.css';

function Reports() {
    const { user } = useAuth();

    const bugTrendsData = {
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

    const testerPerformanceData = {
        labels: ['Functional', 'Security', 'Usability', 'Performance'],
        datasets: [
            {
                label: 'Total Reports',
                data: [65, 59, 80, 81],
                backgroundColor: '#14b8a6',
            }
        ]
    };

    return (
        <div className="reports-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics & Reports</h1>
                    <p className="page-subtitle">Detailed insights into your software testing cycles.</p>
                </div>
                <div className="page-actions">
                    <button className="secondary-btn">
                        <FiCalendar /> Last 30 Days
                    </button>
                    <button className="primary-btn">
                        <FiDownload /> Export PDF
                    </button>
                </div>
            </div>

            <div className="reports-grid">
                <div className="card report-card main-chart">
                    <div className="card-header">
                        <h3 className="card-title">Bug Discovery Trends</h3>
                        <div className="header-actions">
                            <FiFilter />
                        </div>
                    </div>
                    <div className="chart-container">
                        <Chart type="line" data={bugTrendsData} height={300} />
                    </div>
                </div>

                <div className="card report-card">
                    <div className="card-header">
                        <h3 className="card-title">Testing Types Distribution</h3>
                    </div>
                    <div className="chart-container">
                        <Chart type="bar" data={testerPerformanceData} height={300} />
                    </div>
                </div>

                <div className="card report-card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Critical Reports</h3>
                    </div>
                    <div className="reports-list">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="report-item">
                                <div className="report-info">
                                    <p className="report-task">E-Commerce Mobile App</p>
                                    <p className="report-meta">Report by Sarah Tester • 2 hours ago</p>
                                </div>
                                <Badge variant="danger">Critical</Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Reports;
