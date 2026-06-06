import { useState, useEffect } from 'react';
import { feedbackAPI, aiVerificationAPI } from '../../services/api';
import Badge, { AIBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import {
    FiCheckCircle, FiXCircle, FiAlertTriangle, FiEye,
    FiRefreshCw, FiShield, FiZap, FiCopy, FiInfo, FiLink
} from 'react-icons/fi';
import './Verification.css';

// ── Helper: confidence bar colour ────────────────────────────────────────────
function confidenceColor(score) {
    if (score >= 0.80) return '#22c55e';
    if (score >= 0.55) return '#f59e0b';
    return '#ef4444';
}

// ── AI Pipeline Breakdown Panel ───────────────────────────────────────────────
function AIPipelinePanel({ log, loading }) {
    if (loading) {
        return (
            <div className="ai-pipeline-panel loading">
                <FiZap className="spin-icon" /> Running AI pipeline…
            </div>
        );
    }
    if (!log) {
        return (
            <div className="ai-pipeline-panel empty">
                <FiInfo size={16} /> No AI log available yet.
            </div>
        );
    }

    const conf = log.vision_confidence ?? 0;
    const confPct = Math.round(conf * 100);

    const stageBadge = (ok, label) => (
        <span className={`pipeline-stage-badge ${ok ? 'pass' : 'fail'}`}>
            {ok ? <FiCheckCircle size={12} /> : <FiXCircle size={12} />} {label}
        </span>
    );

    return (
        <div className="ai-pipeline-panel">
            <div className="pipeline-header">
                <FiShield size={14} /> <strong>AI Pipeline Breakdown</strong>
                <span className="pipeline-ran-at">
                    {log.pipeline_ran_at
                        ? new Date(log.pipeline_ran_at).toLocaleString()
                        : ''}
                </span>
            </div>

            {/* Stage 1 — Vision */}
            <div className="pipeline-stage">
                <div className="stage-title">
                    🧠 Stage 1 — Vision LLM
                    {stageBadge(log.vision_is_valid, log.vision_is_valid ? 'Valid' : 'Invalid')}
                </div>
                <div className="stage-body">
                    <div className="confidence-bar-wrap">
                        <span className="cb-label">Confidence</span>
                        <div className="confidence-bar">
                            <div
                                className="confidence-fill"
                                style={{
                                    width: `${confPct}%`,
                                    background: confidenceColor(conf)
                                }}
                            />
                        </div>
                        <span className="cb-pct" style={{ color: confidenceColor(conf) }}>
                            {confPct}%
                        </span>
                    </div>
                    {log.vision_detected_text && (
                        <p className="stage-detail">
                            <em>Detected:</em> {log.vision_detected_text}
                        </p>
                    )}
                    <p className="stage-reason">{log.vision_reason}</p>
                </div>
            </div>

            {/* Stage 2 — Image Duplicate */}
            <div className="pipeline-stage">
                <div className="stage-title">
                    🖼️ Stage 2 — Image Duplicate
                    {stageBadge(!log.image_duplicate, log.image_duplicate ? 'Duplicate!' : 'Unique')}
                </div>
                {log.image_duplicate && (
                    <div className="stage-body stage-warning">
                        <FiCopy size={13} /> Same proof URL matched a prior submission
                        {log.image_matched_proof_id && (
                            <span className="match-id"> — ID: {log.image_matched_proof_id.slice(0, 8)}…</span>
                        )}
                    </div>
                )}
            </div>

            {/* Stage 3 — Text Duplicate */}
            <div className="pipeline-stage">
                <div className="stage-title">
                    📝 Stage 3 — Text Duplicate (Embeddings)
                    {stageBadge(!log.text_duplicate, log.text_duplicate ? 'Duplicate!' : 'Unique')}
                </div>
                <div className="stage-body">
                    <span className="cb-label">Similarity Score: </span>
                    <strong style={{ color: log.text_duplicate ? '#ef4444' : '#22c55e' }}>
                        {Math.round((log.text_similarity_score ?? 0) * 100)}%
                    </strong>
                    {log.text_duplicate && log.text_matched_feedback_id && (
                        <p className="stage-warning">
                            Matched feedback ID: {log.text_matched_feedback_id.slice(0, 8)}…
                        </p>
                    )}
                </div>
            </div>

            {/* Stage 4 — Credit Rule Engine */}
            <div className="pipeline-stage">
                <div className="stage-title">
                    💳 Stage 4 — Credit Rule Engine
                    <span className={`pipeline-stage-badge ${
                        log.credit_status === 'approved' ? 'pass' :
                        log.credit_status === 'partial'  ? 'warn' : 'fail'
                    }`}>
                        {log.credit_status?.toUpperCase() ?? 'N/A'}
                    </span>
                </div>
                <div className="stage-body">
                    <div className="credit-rec-row">
                        <span>Recommended Credits</span>
                        <strong className="credit-rec-amount">{log.recommended_credits ?? 0}</strong>
                    </div>
                    <p className="stage-reason">{log.credit_reason}</p>
                </div>
            </div>
        </div>
    );
}

// ── Main Verification Page ────────────────────────────────────────────────────
function Verification() {
    const toast = useToast();
    const [pendingVerifications, setPendingVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionCredits, setActionCredits] = useState({});
    const [expandedId, setExpandedId] = useState(null);
    const [aiLogs, setAiLogs] = useState({});
    const [aiLogLoading, setAiLogLoading] = useState({});
    const [retriggeringId, setRetriggeringId] = useState(null);

    useEffect(() => {
        fetchPending();
    }, []);

    async function fetchPending() {
        setLoading(true);
        try {
            const res = await feedbackAPI.list({ status: 'dev-approved' });
            const feedbackItems = res.feedback || [];
            setPendingVerifications(feedbackItems);

            // Initialize default credits
            const initialCredits = {};
            feedbackItems.forEach(item => {
                initialCredits[item._id || item.id] = (item.creditScore || 0) * 3;
            });
            setActionCredits(initialCredits);
        } catch (err) {
            console.error('Failed to load verifications:', err);
            toast.error('Load Failed', err.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadAiLog(feedbackId) {
        if (aiLogs[feedbackId]) return; // already loaded
        setAiLogLoading(prev => ({ ...prev, [feedbackId]: true }));
        try {
            const res = await aiVerificationAPI.getLog(feedbackId);
            setAiLogs(prev => ({ ...prev, [feedbackId]: res.log }));
        } catch (err) {
            console.error('Failed to load AI log:', err);
        } finally {
            setAiLogLoading(prev => ({ ...prev, [feedbackId]: false }));
        }
    }

    function toggleExpand(id) {
        const next = expandedId === id ? null : id;
        setExpandedId(next);
        if (next) loadAiLog(next);
    }

    const handleCreditChange = (id, value) => {
        setActionCredits(prev => ({ ...prev, [id]: parseInt(value) || 0 }));
    };

    const handleApprove = async (id) => {
        try {
            const credits = actionCredits[id] || 0;
            await feedbackAPI.update(id, {
                status: 'approved',
                customCredits: credits
            });
            setPendingVerifications(prev => prev.filter(v => (v._id || v.id) !== id));
            toast.success('Credits Released', `Successfully released ${credits} credits to the tester.`);
        } catch (err) {
            toast.error('Approval Failed', err.message);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Are you sure you want to reject this submission?')) return;
        try {
            await feedbackAPI.update(id, { status: 'rejected' });
            setPendingVerifications(prev => prev.filter(v => (v._id || v.id) !== id));
            toast.warning('Submission Rejected', 'The tester will be notified.');
        } catch (err) {
            toast.error('Rejection Failed', err.message);
        }
    };

    const handleRetrigger = async (id) => {
        setRetriggeringId(id);
        try {
            await aiVerificationAPI.retrigger(id);
            // Reload AI log
            setAiLogs(prev => ({ ...prev, [id]: undefined }));
            await loadAiLog(id);
            toast.success('AI Pipeline Re-ran', 'AI verification has been re-triggered for this submission.');
        } catch (err) {
            toast.error('Re-trigger Failed', err.message);
        } finally {
            setRetriggeringId(null);
        }
    };

    return (
        <div className="verification-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Manual Verification Queue</h1>
                    <p className="page-subtitle">
                        Review AI-flagged submissions. Each card shows the full 4-stage AI pipeline breakdown.
                    </p>
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    icon={<FiRefreshCw />}
                    onClick={fetchPending}
                    loading={loading}
                >
                    Refresh
                </Button>
            </div>

            <div className="verification-list">
                {loading ? (
                    <div className="empty-state">
                        <FiRefreshCw size={32} className="spin-icon" />
                        <p>Loading queue…</p>
                    </div>
                ) : pendingVerifications.length === 0 ? (
                    <div className="empty-state">
                        <FiCheckCircle size={48} />
                        <h3>Queue is clear!</h3>
                        <p>No submissions currently require manual verification.</p>
                    </div>
                ) : (
                    pendingVerifications.map(item => {
                        const id = item._id || item.id;
                        const isExpanded = expandedId === id;
                        return (
                            <div key={id} className="card verification-card">
                                <div className="verification-card-header">
                                    <div className="tester-profile">
                                        <div className="avatar sm">
                                            {item.testerName?.split(' ').map(n => n[0]).join('') || '?'}
                                        </div>
                                        <div>
                                            <h4 className="tester-name">{item.testerName}</h4>
                                            <p className="task-ref">Task: {item.taskName}</p>
                                        </div>
                                    </div>
                                    <div className="verification-status">
                                        <AIBadge status={item.aiVerification} />
                                        <Badge variant="warning">PENDING MANUAL</Badge>
                                    </div>
                                </div>

                                <div className="verification-content">
                                    <div className="content-section">
                                        <span className="section-label">Observations</span>
                                        <p className="section-text">{item.observations}</p>
                                    </div>
                                    {item.proofUrl && (
                                        <div className="content-section">
                                            <span className="section-label">Proof Link</span>
                                            <a
                                                href={item.proofUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="proof-link-tag"
                                            >
                                                <FiLink size={13} /> {item.proofUrl.slice(0, 60)}…
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* AI Pipeline Toggle */}
                                <div className="pipeline-toggle-row">
                                    <button
                                        className="pipeline-toggle-btn"
                                        onClick={() => toggleExpand(id)}
                                    >
                                        <FiZap size={14} />
                                        {isExpanded ? 'Hide' : 'View'} AI Pipeline Breakdown
                                    </button>
                                    <button
                                        className="pipeline-retrigger-btn"
                                        onClick={() => handleRetrigger(id)}
                                        disabled={retriggeringId === id}
                                    >
                                        <FiRefreshCw size={13} className={retriggeringId === id ? 'spin-icon' : ''} />
                                        {retriggeringId === id ? 'Re-running…' : 'Re-run AI'}
                                    </button>
                                </div>

                                {isExpanded && (
                                    <AIPipelinePanel
                                        log={aiLogs[id]}
                                        loading={aiLogLoading[id]}
                                    />
                                )}

                                <div className="verification-footer">
                                    <div className="credit-action-box">
                                        <div className="credit-input-group">
                                            <label>Credits to Release:</label>
                                            <div className="input-with-icon" style={{ paddingLeft: '1rem' }}>
                                                <input
                                                    type="number"
                                                    className="credit-input"
                                                    value={actionCredits[id] || 0}
                                                    onChange={(e) => handleCreditChange(id, e.target.value)}
                                                    style={{ paddingLeft: '0.5rem' }}
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                        <div className="admin-actions">
                                            <Button
                                                variant="danger"
                                                icon={<FiXCircle />}
                                                onClick={() => handleReject(id)}
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                variant="success"
                                                icon={<FiCheckCircle />}
                                                onClick={() => handleApprove(id)}
                                            >
                                                Approve &amp; Release Credits
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default Verification;
