import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Chart from '../../components/common/Chart';
import Badge from '../../components/common/Badge';
import { FiDownload, FiFilter, FiCalendar } from 'react-icons/fi';
import { useToast } from '../../components/common/Toast';
import './Reports.css';

function Reports() {
    const { user } = useAuth();
    const toast = useToast();
    const [showExportDropdown, setShowExportDropdown] = useState(false);

    useEffect(() => {
        const handleOutsideClick = () => {
            setShowExportDropdown(false);
        };
        if (showExportDropdown) {
            window.addEventListener('click', handleOutsideClick);
        }
        return () => {
            window.removeEventListener('click', handleOutsideClick);
        };
    }, [showExportDropdown]);

    const triggerDownload = (format) => {
        setShowExportDropdown(false);
        if (format === 'csv') {
            const csvContent = 
                "Category,Critical Bugs,Minor Issues\n" +
                "Week 1,12,45\n" +
                "Week 2,19,32\n" +
                "Week 3,3,56\n" +
                "Week 4,5,48\n\n" +
                "Test Type,Total Reports\n" +
                "Functional,65\n" +
                "Security,59\n" +
                "Usability,80\n" +
                "Performance,81\n";
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `task_analytics_report_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('CSV Downloaded', 'The CSV report has been saved to your downloads.');
        } else if (format === 'pdf') {
            const pdfContent = 
                "%PDF-1.4\n" +
                "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
                "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
                "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n" +
                "4 0 obj\n<< /Length 150 >>\nstream\n" +
                "BT\n/F1 18 Tf\n50 750 Td\n(Software Testing Platform - Analytics & Reports) Tj\n" +
                "/F1 12 Tf\n0 -40 Td\n(Bug Discovery Trends:) Tj\n" +
                "0 -20 Td\n(  - Week 1: 12 Critical Bugs, 45 Minor Issues) Tj\n" +
                "0 -20 Td\n(  - Week 2: 19 Critical Bugs, 32 Minor Issues) Tj\n" +
                "0 -20 Td\n(  - Week 3: 3 Critical Bugs, 56 Minor Issues) Tj\n" +
                "0 -20 Td\n(  - Week 4: 5 Critical Bugs, 48 Minor Issues) Tj\n" +
                "ET\n" +
                "endstream\nendobj\n" +
                "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n" +
                "xref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000062 00000 n\n0000000119 00000 n\n0000000263 00000 n\n0000000463 00000 n\n" +
                "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n535\n%%EOF\n";
            
            const blob = new Blob([pdfContent], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `task_analytics_report_${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('PDF Downloaded', 'The PDF document has been saved to your downloads.');
        }
    };

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
                <div className="page-actions" style={{ position: 'relative' }}>
                    <button className="secondary-btn">
                        <FiCalendar /> Last 30 Days
                    </button>
                    <button className="primary-btn" onClick={(e) => { e.stopPropagation(); setShowExportDropdown(!showExportDropdown); }}>
                        <FiDownload /> Export
                    </button>
                    {showExportDropdown && (
                        <div className="export-dropdown">
                            <button onClick={() => triggerDownload('csv')}>
                                CSV Format (.csv)
                            </button>
                            <button onClick={() => triggerDownload('pdf')}>
                                PDF Document (.pdf)
                            </button>
                        </div>
                    )}
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
