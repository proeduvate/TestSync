import { useState, useEffect } from 'react';
import { feedbackAPI, aiVerificationAPI } from '../../services/api';
import Badge, { AIBadge } from '../../components/common/Badge';
import { FiClock, FiCheckCircle, FiXCircle, FiInfo, FiZap, FiShield, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import './Status.css';

// ── AI Summary badge inline ────────────────────────────────────────────────
function AIStatusBanner({ log }) {
    if (!log) return null;

    const conf = log.vision_confidence ?? 0;
    const confPct = Math.round(conf * 100);
    const isDup = log.image_duplicate || log.text_duplicate;

    const color =
        log.final_status === 'approved' ? '#22c55e' :
        log.final_status === 'partial'  ? '#f59e0b' :
        log.final_status === 'rejected' ? '#ef4444' : '#6366f1';

    return (
        <div className="ai-status-banner" style={{ borderColor: color }}>
            <FiShield size={14} style={{ color }} />
            <div className="ai-status-content">
                <span className="ai-status-title" style={{ color }}>
                    🤖 AI Verification — {log.credit_status?.toUpperCase() ?? 'PENDING'}
                </span>
                <span className="ai-status-desc">
                    Confidence: <strong>{confPct}%</strong> ·{' '}
                    {isDup
                        ? '⚠️ Duplicate detected'
                        : log.vision_is_valid
                            ? '✅ Proof valid'
                            : '❌ Proof invalid'
                    } · Recommended: <strong>{log.recommended_credits ?? 0} credits</strong>
                </span>
                <span className="ai-status-reason">{log.credit_reason}</span>
            </div>
        </div>
    );
}

function Status() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiLogs, setAiLogs] = useState({});
    const [expandedIds, setExpandedIds] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState('newest');
    const [selectedTab, setSelectedTab] = useState('all');

    useEffect(() => {
        async function fetchSubmissions() {
            try {
                const res = await feedbackAPI.list();
                const items = res.feedback || [];
                setSubmissions(items);

                // Load AI logs for each submission (non-blocking)
                items.forEach(async (sub) => {
                    const id = sub._id || sub.id;
                    try {
                        const logRes = await aiVerificationAPI.getLog(id);
                        if (logRes.log) {
                            setAiLogs(prev => ({ ...prev, [id]: logRes.log }));
                        }
                    } catch {
                        // ignore missing logs
                    }
                });
            } catch (err) {
                console.error('Failed to load submissions:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchSubmissions();
    }, []);

    const toggleExpand = (id) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Calculate dynamic counts
    const counts = {
        all: submissions.length,
        pending: submissions.filter(sub => sub.status === 'pending').length,
        verified: submissions.filter(sub => sub.status === 'dev-approved').length,
        released: submissions.filter(sub => sub.status === 'approved').length,
        needsRevision: submissions.filter(sub => sub.status === 'needs-revision').length
    };

    // Filter logic based on tabs
    const filteredSubmissions = submissions.filter(sub => {
        if (selectedTab === 'all') return true;
        if (selectedTab === 'pending') return sub.status === 'pending';
        if (selectedTab === 'verified') return sub.status === 'dev-approved';
        if (selectedTab === 'released') return sub.status === 'approved';
        if (selectedTab === 'needs-revision') return sub.status === 'needs-revision';
        return true;
    });

    // Sorting logic
    const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.submittedAt) - new Date(a.submittedAt);
        }
        if (sortBy === 'oldest') {
            return new Date(a.submittedAt) - new Date(b.submittedAt);
        }
        if (sortBy === 'taskName') {
            return (a.taskName || '').localeCompare(b.taskName || '');
        }
        if (sortBy === 'status') {
            return (a.status || '').localeCompare(b.status || '');
        }
        return 0;
    });

    // Pagination calculations
    const tasksPerPage = 10;
    const totalPages = Math.ceil(sortedSubmissions.length / tasksPerPage);
    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    const currentSubmissions = sortedSubmissions.slice(indexOfFirstTask, indexOfLastTask);

    const getStatusConfig = (status) => {
        switch (status) {
            case 'approved':
                return { label: 'Completed & Released', variant: 'success', icon: <FiCheckCircle className="status-icon success" /> };
            case 'dev-approved':
                return { label: 'Waiting for Admin', variant: 'info', icon: <FiClock className="status-icon info" /> };
            case 'pending':
                return { label: 'Under AI Review', variant: 'warning', icon: <FiZap className="status-icon warning" /> };
            case 'needs-revision':
                return { label: 'Revision Requested', variant: 'danger', icon: <FiInfo className="status-icon danger" /> };
            case 'rejected':
                return { label: 'Rejected', variant: 'danger', icon: <FiXCircle className="status-icon danger" /> };
            default:
                return { label: status, variant: 'secondary', icon: <FiClock className="status-icon" /> };
        }
    };

    return (
        <div className="status-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Submission Tracking</h1>
                    <p className="page-subtitle">
                        Monitor the AI verification pipeline for your testing proofs.
                    </p>
                </div>
                <div className="status-filters-bar">
                    <div className="sort-group">
                        <label htmlFor="sort-select">Sort By:</label>
                        <select
                            id="sort-select"
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="newest">Newest Submitted</option>
                            <option value="oldest">Oldest Submitted</option>
                            <option value="taskName">Task Name</option>
                            <option value="status">Status</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="status-tabs-container">
                <button
                    className={`status-tab ${selectedTab === 'all' ? 'active' : ''}`}
                    onClick={() => {
                        setSelectedTab('all');
                        setCurrentPage(1);
                    }}
                >
                    All ({counts.all})
                </button>
                <button
                    className={`status-tab ${selectedTab === 'pending' ? 'active' : ''}`}
                    onClick={() => {
                        setSelectedTab('pending');
                        setCurrentPage(1);
                    }}
                >
                    Pending ({counts.pending})
                </button>
                <button
                    className={`status-tab ${selectedTab === 'verified' ? 'active' : ''}`}
                    onClick={() => {
                        setSelectedTab('verified');
                        setCurrentPage(1);
                    }}
                >
                    Verified ({counts.verified})
                </button>
                <button
                    className={`status-tab ${selectedTab === 'released' ? 'active' : ''}`}
                    onClick={() => {
                        setSelectedTab('released');
                        setCurrentPage(1);
                    }}
                >
                    Released ({counts.released})
                </button>
                <button
                    className={`status-tab ${selectedTab === 'needs-revision' ? 'active' : ''}`}
                    onClick={() => {
                        setSelectedTab('needs-revision');
                        setCurrentPage(1);
                    }}
                >
                    Needs Revision ({counts.needsRevision})
                </button>
            </div>

            <div className="status-list">
                {loading ? (
                    <div className="status-empty">
                        <FiZap size={32} className="spin-icon" />
                        <p>Loading submissions…</p>
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="status-empty">
                        <FiCheckCircle size={40} />
                        <p>No submissions yet. Accept a task and submit your proof!</p>
                    </div>
                ) : (
                    currentSubmissions.map(sub => {
                        const id = sub._id || sub.id;
                        const config = getStatusConfig(sub.status);
                        const log = aiLogs[id];
                        const isExpanded = !!expandedIds[id];

                        return (
                            <div key={id} className={`card status-card ${isExpanded ? 'is-expanded' : ''}`}>
                                <div 
                                    className="status-card-main" 
                                    onClick={() => toggleExpand(id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="status-header">
                                        {config.icon}
                                        <div className="status-info">
                                            <h3>{sub.taskName}</h3>
                                            <p className="submission-date">
                                                Submitted on {new Date(sub.submittedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="status-badges" onClick={(e) => e.stopPropagation()}>
                                        <AIBadge status={sub.aiVerification} />
                                        <Badge variant={config.variant}>{config.label}</Badge>
                                        <button 
                                            className="expand-toggle-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleExpand(id);
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '4px'
                                            }}
                                        >
                                            {isExpanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <>
                                        {/* AI Verification Banner */}
                                        {log && <AIStatusBanner log={log} />}

                                        <div className="status-details">
                                            <div className="detail-grid-row">
                                                <div className="detail-item">
                                                    <span className="detail-label">Observations</span>
                                                    <p className="detail-value">{sub.observations}</p>
                                                </div>
                                                <div className="status-timeline">
                                                    <div className={`timeline-step ${['pending', 'dev-approved', 'approved'].includes(sub.status) ? 'active' : ''} ${sub.status !== 'pending' ? 'completed' : ''}`}>
                                                        <div className="step-dot"></div>
                                                        <span>AI Verification</span>
                                                    </div>
                                                    <div className={`timeline-step ${['dev-approved', 'approved'].includes(sub.status) ? 'active' : ''} ${sub.status === 'approved' ? 'completed' : ''}`}>
                                                        <div className="step-dot"></div>
                                                        <span>Developer Review</span>
                                                    </div>
                                                    <div className={`timeline-step ${sub.status === 'approved' ? 'active completed' : ''}`}>
                                                        <div className="step-dot"></div>
                                                        <span>Credits Released</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {sub.creditScore > 0 && (
                                                <div className="detail-item">
                                                    <span className="detail-label">AI Confidence Score</span>
                                                    <div className="score-bar-container">
                                                        <div className="score-bar">
                                                            <div
                                                                className="score-fill"
                                                                style={{ width: `${sub.creditScore}%` }}
                                                            />
                                                        </div>
                                                        <span>{Math.round(sub.creditScore)}%</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination Bar */}
            {!loading && sortedSubmissions.length > 0 && (
                <div className="pagination-bar">
                    <button 
                        className="pagination-btn" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPage(prev => Math.max(prev - 1, 1));
                        }}
                        disabled={currentPage === 1}
                    >
                        &larr; Previous
                    </button>
                    
                    <div className="pagination-numbers" onClick={(e) => e.stopPropagation()}>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                className={`pagination-number-btn ${currentPage === page ? 'active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button 
                        className="pagination-btn" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPage(prev => Math.min(prev + 1, totalPages));
                        }}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        Next &rarr;
                    </button>
                </div>
            )}
        </div>
    );
}

export default Status;
