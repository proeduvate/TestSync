import { useState, useEffect, useCallback } from 'react';
import { reputationAPI, tasksAPI } from '../../services/api';
import Badge from '../../components/common/Badge';
import { useToast } from '../../components/common/Toast';
import {
    FiAward, FiStar, FiTrendingUp, FiTrendingDown, FiAlertTriangle,
    FiCheckCircle, FiXCircle, FiUser, FiZap, FiTarget, FiShield,
    FiRefreshCw, FiChevronDown, FiChevronUp, FiInfo
} from 'react-icons/fi';
import './TesterReputation.css';

// ── Reputation level config ──────────────────────────────────────────────────
const LEVEL_CONFIG = {
    'Elite Tester':     { color: 'elite',   icon: '👑', badge: 'success' },
    'Trusted Tester':   { color: 'trusted', icon: '⭐', badge: 'primary' },
    'Normal Tester':    { color: 'normal',  icon: '✅', badge: 'info'    },
    'Risk Tester':      { color: 'risk',    icon: '⚠️', badge: 'warning' },
    'Low Reputation':   { color: 'low',     icon: '📉', badge: 'danger'  },
    'New Tester':       { color: 'new',     icon: '🌱', badge: 'secondary'},
    'Low Reputation Tester': { color: 'low', icon: '📉', badge: 'danger' },
};

const REC_STATUS_CONFIG = {
    'highly_recommended': { label: 'Highly Recommended', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '🏆' },
    'recommended':        { label: 'Recommended',        color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: '👍' },
    'backup':             { label: 'Backup',             color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🔄' },
    'not_recommended':    { label: 'Not Recommended',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: '❌' },
};

function ScoreBar({ value, max = 100, color = '#6366f1' }) {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className="score-bar-wrap">
            <div className="score-bar-track">
                <div
                    className="score-bar-fill"
                    style={{ width: `${pct}%`, background: color }}
                />
            </div>
            <span className="score-bar-label">{Math.round(value)}</span>
        </div>
    );
}

function TesterCard({ tester, rank }) {
    const [expanded, setExpanded] = useState(false);
    const cfg = LEVEL_CONFIG[tester.reputation_level] || LEVEL_CONFIG['New Tester'];
    const scoreColor =
        tester.reputation_score >= 90 ? '#f59e0b' :
        tester.reputation_score >= 75 ? '#6366f1' :
        tester.reputation_score >= 60 ? '#14b8a6' :
        tester.reputation_score >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <div className={`tester-rep-card level-${cfg.color}`}>
            <div className="rep-card-main" onClick={() => setExpanded(!expanded)}>
                <div className="rep-rank-badge">#{rank}</div>

                <div className="rep-avatar">
                    {tester.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                    <span className="rep-level-icon">{cfg.icon}</span>
                </div>

                <div className="rep-tester-info">
                    <span className="rep-tester-name">{tester.name}</span>
                    <span className="rep-tester-email">{tester.email}</span>
                    <div className="rep-skills-row">
                        {(tester.skills || []).slice(0, 3).map((s, i) => (
                            <span key={i} className="skill-chip">{s}</span>
                        ))}
                        {(tester.skills || []).length > 3 && (
                            <span className="skill-chip more">+{tester.skills.length - 3}</span>
                        )}
                    </div>
                </div>

                <div className="rep-score-section">
                    <div className="rep-score-circle" style={{ '--score-color': scoreColor }}>
                        <span className="rep-score-num">{tester.reputation_score}</span>
                        <span className="rep-score-max">/100</span>
                    </div>
                    <Badge variant={cfg.badge}>{tester.reputation_level}</Badge>
                </div>

                <div className="rep-metrics">
                    <div className="rep-metric">
                        <FiCheckCircle size={14} className="metric-icon success" />
                        <span className="metric-label">Approval</span>
                        <span className="metric-val">{tester.approval_rate}%</span>
                    </div>
                    <div className="rep-metric">
                        <FiTrendingUp size={14} className="metric-icon info" />
                        <span className="metric-label">AI Confidence</span>
                        <span className="metric-val">{tester.avg_proof_confidence}%</span>
                    </div>
                    <div className="rep-metric">
                        <FiStar size={14} className="metric-icon warning" />
                        <span className="metric-label">Admin Rating</span>
                        <span className="metric-val">{tester.admin_rating}/5</span>
                    </div>
                    <div className="rep-metric">
                        <FiAlertTriangle size={14} className="metric-icon danger" />
                        <span className="metric-label">Duplicates</span>
                        <span className="metric-val">{tester.duplicate_count}</span>
                    </div>
                </div>

                <button className="rep-expand-btn">
                    {expanded ? <FiChevronUp /> : <FiChevronDown />}
                </button>
            </div>

            {expanded && (
                <div className="rep-card-expanded">
                    <div className="rep-expanded-grid">
                        <div className="rep-stat-group">
                            <h5>Task Performance</h5>
                            <div className="rep-stat-row">
                                <span>Total Tasks</span>
                                <span className="stat-val">{tester.total_tasks}</span>
                            </div>
                            <div className="rep-stat-row">
                                <span>Approved</span>
                                <span className="stat-val green">{tester.approved_tasks}</span>
                            </div>
                            <div className="rep-stat-row">
                                <span>Rejection Rate</span>
                                <span className="stat-val red">{tester.rejection_rate}%</span>
                            </div>
                            <div className="rep-stat-row">
                                <span>Completed Tests</span>
                                <span className="stat-val">{tester.completed_tests}</span>
                            </div>
                            <div className="rep-stat-row">
                                <span>Active Tasks</span>
                                <span className="stat-val">{tester.active_tasks}</span>
                            </div>
                            <div className="rep-stat-row">
                                <span>Total Earnings</span>
                                <span className="stat-val gold">₹{(tester.total_earnings || 0).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="rep-stat-group">
                            <h5>Score Breakdown</h5>
                            <div className="score-breakdown-item">
                                <span>Approval Rate</span>
                                <ScoreBar value={tester.approval_rate} color="#10b981" />
                            </div>
                            <div className="score-breakdown-item">
                                <span>Proof Confidence</span>
                                <ScoreBar value={tester.avg_proof_confidence} color="#6366f1" />
                            </div>
                            <div className="score-breakdown-item">
                                <span>Admin Rating</span>
                                <ScoreBar value={tester.admin_rating * 20} color="#f59e0b" />
                            </div>
                            <div className="score-breakdown-item">
                                <span>Duplicate Penalty</span>
                                <ScoreBar value={Math.min(100, tester.duplicate_count * 15)} color="#ef4444" />
                            </div>
                        </div>

                        {tester.suspicious_count > 0 && (
                            <div className="rep-flag-banner danger">
                                <FiAlertTriangle /> {tester.suspicious_count} suspicious submission(s) flagged for manual review
                            </div>
                        )}
                        {tester.duplicate_count > 0 && (
                            <div className="rep-flag-banner warning">
                                <FiXCircle /> {tester.duplicate_count} duplicate submission(s) detected
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function RecommendationCard({ rec, rank }) {
    const cfg = REC_STATUS_CONFIG[rec.recommendation_status] || REC_STATUS_CONFIG['not_recommended'];
    return (
        <div className="rec-card" style={{ borderLeft: `4px solid ${cfg.color}` }}>
            <div className="rec-card-header">
                <span className="rec-rank">#{rank}</span>
                <div className="rec-tester-name">{cfg.icon} {rec.tester_name}</div>
                <div
                    className="rec-status-badge"
                    style={{ background: cfg.bg, color: cfg.color }}
                >
                    {cfg.label}
                </div>
                <div className="rec-final-score">
                    <span className="rec-score-num" style={{ color: cfg.color }}>{rec.recommendation_score}</span>
                    <span className="rec-score-lbl">/100</span>
                </div>
            </div>

            <div className="rec-factors-grid">
                <div className="rec-factor">
                    <FiTarget size={13} /> Skill Match
                    <ScoreBar value={rec.skill_match_score} color={cfg.color} />
                </div>
                <div className="rec-factor">
                    <FiShield size={13} /> Reputation
                    <ScoreBar value={rec.reputation_score || 0} color="#6366f1" />
                </div>
                <div className="rec-factor">
                    <FiCheckCircle size={13} /> Availability
                    <ScoreBar value={rec.availability_score} color="#10b981" />
                </div>
                <div className="rec-factor">
                    <FiZap size={13} /> Platform Match
                    <ScoreBar value={rec.platform_match_score} color="#f59e0b" />
                </div>
            </div>

            {rec.matched_skills?.length > 0 && (
                <div className="rec-skills-row">
                    <span className="rec-skills-label">Matched:</span>
                    {rec.matched_skills.map((s, i) => (
                        <span key={i} className="skill-chip match">{s}</span>
                    ))}
                    {rec.missing_skills?.map((s, i) => (
                        <span key={i} className="skill-chip miss">{s}</span>
                    ))}
                </div>
            )}

            {rec.risks?.length > 0 && (
                <div className="rec-risks">
                    {rec.risks.map((r, i) => (
                        <span key={i} className="risk-tag"><FiAlertTriangle size={11} /> {r}</span>
                    ))}
                </div>
            )}

            <p className="rec-reason">{rec.reason}</p>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────
function TesterReputation() {
    const [scoreboard, setScoreboard] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [loadingScoreboard, setLoadingScoreboard] = useState(true);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [activeTab, setActiveTab] = useState('scoreboard');
    const [levelFilter, setLevelFilter] = useState('all');
    const toast = useToast();

    const LEVELS = ['all', 'Elite Tester', 'Trusted Tester', 'Normal Tester', 'Risk Tester', 'Low Reputation', 'Low Reputation Tester', 'New Tester'];

    // Load scoreboard
    const loadScoreboard = useCallback(async () => {
        setLoadingScoreboard(true);
        try {
            const res = await reputationAPI.getScoreboard();
            setScoreboard(res.scoreboard || []);
        } catch (err) {
            toast.error('Error', 'Failed to load tester scoreboard');
            console.error(err);
        } finally {
            setLoadingScoreboard(false);
        }
    }, []);

    // Load tasks for analysis dropdown
    useEffect(() => {
        loadScoreboard();
        tasksAPI.list().then(res => setTasks(res.tasks || [])).catch(console.error);
    }, [loadScoreboard]);

    // Run AI analysis
    const runAnalysis = async () => {
        if (!selectedTask) {
            toast.warning('Select Task', 'Please select a task to analyze first.');
            return;
        }
        setLoadingAnalysis(true);
        setAnalysisResult(null);
        try {
            const payload = await reputationAPI.getTesterDataForTask(selectedTask);
            const result = await reputationAPI.runAnalysis(payload);
            setAnalysisResult(result);
            setActiveTab('analysis');
            toast.success('Analysis Complete', `Analyzed ${result.summary?.total_testers_analyzed || 0} testers.`);
        } catch (err) {
            toast.error('Analysis Failed', err.message);
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const filteredScoreboard = levelFilter === 'all'
        ? scoreboard
        : scoreboard.filter(t => t.reputation_level === levelFilter);

    // Summary stats
    const elite = scoreboard.filter(t => t.reputation_level === 'Elite Tester').length;
    const trusted = scoreboard.filter(t => t.reputation_level === 'Trusted Tester').length;
    const risk = scoreboard.filter(t => ['Risk Tester', 'Low Reputation', 'Low Reputation Tester'].includes(t.reputation_level)).length;
    const avg = scoreboard.length > 0
        ? Math.round(scoreboard.reduce((s, t) => s + t.reputation_score, 0) / scoreboard.length)
        : 0;

    return (
        <div className="tester-reputation-page">

            {/* ── Page Header ── */}
            <div className="rep-page-header">
                <div className="rep-header-left">
                    <div className="rep-header-icon"><FiAward size={28} /></div>
                    <div>
                        <h1 className="rep-page-title">Tester Reputation Engine</h1>
                        <p className="rep-page-subtitle">
                            AI-powered scoreboard & task-specific tester recommendation
                        </p>
                    </div>
                </div>
                <div className="rep-header-actions">
                    <select
                        className="task-select"
                        value={selectedTask}
                        onChange={e => setSelectedTask(e.target.value)}
                    >
                        <option value="">Select task to analyze…</option>
                        {tasks.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.appName} ({t.status})
                            </option>
                        ))}
                    </select>
                    <button
                        className="run-analysis-btn"
                        onClick={runAnalysis}
                        disabled={loadingAnalysis || !selectedTask}
                    >
                        {loadingAnalysis ? (
                            <><div className="btn-spinner" /> Analyzing…</>
                        ) : (
                            <><FiZap size={16} /> Run AI Analysis</>
                        )}
                    </button>
                    <button className="refresh-btn" onClick={loadScoreboard} title="Refresh scoreboard">
                        <FiRefreshCw size={16} className={loadingScoreboard ? 'spinning' : ''} />
                    </button>
                </div>
            </div>

            {/* ── Summary Stats ── */}
            <div className="rep-stats-row">
                <div className="rep-stat-card">
                    <div className="rep-stat-icon elite-bg"><FiAward size={20} /></div>
                    <div className="rep-stat-info">
                        <span className="rep-stat-val">{scoreboard.length}</span>
                        <span className="rep-stat-lbl">Total Testers</span>
                    </div>
                </div>
                <div className="rep-stat-card">
                    <div className="rep-stat-icon trusted-bg"><FiStar size={20} /></div>
                    <div className="rep-stat-info">
                        <span className="rep-stat-val">{elite + trusted}</span>
                        <span className="rep-stat-lbl">Elite + Trusted</span>
                    </div>
                </div>
                <div className="rep-stat-card">
                    <div className="rep-stat-icon normal-bg"><FiTrendingUp size={20} /></div>
                    <div className="rep-stat-info">
                        <span className="rep-stat-val">{avg}</span>
                        <span className="rep-stat-lbl">Avg. Score</span>
                    </div>
                </div>
                <div className="rep-stat-card">
                    <div className="rep-stat-icon risk-bg"><FiAlertTriangle size={20} /></div>
                    <div className="rep-stat-info">
                        <span className="rep-stat-val">{risk}</span>
                        <span className="rep-stat-lbl">Risk Testers</span>
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="rep-tabs">
                <button
                    className={`rep-tab ${activeTab === 'scoreboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scoreboard')}
                >
                    <FiAward size={15} /> Scoreboard
                    <span className="tab-count">{scoreboard.length}</span>
                </button>
                <button
                    className={`rep-tab ${activeTab === 'analysis' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analysis')}
                    disabled={!analysisResult}
                >
                    <FiZap size={15} /> AI Task Analysis
                    {analysisResult && <span className="tab-count">{analysisResult.summary?.total_testers_analyzed}</span>}
                </button>
            </div>

            {/* ── Scoreboard Tab ── */}
            {activeTab === 'scoreboard' && (
                <div className="rep-scoreboard-section">
                    {/* Level filter bar */}
                    <div className="level-filter-bar">
                        {LEVELS.filter((l, i) => i === 0 || ['Elite Tester','Trusted Tester','Normal Tester','Risk Tester','Low Reputation','New Tester'].includes(l)).map(level => (
                            <button
                                key={level}
                                className={`level-filter-btn ${levelFilter === level ? 'active' : ''}`}
                                onClick={() => setLevelFilter(level)}
                            >
                                {level === 'all' ? 'All Levels' : (LEVEL_CONFIG[level]?.icon + ' ' + level)}
                            </button>
                        ))}
                    </div>

                    {loadingScoreboard ? (
                        <div className="rep-loading">
                            <div className="rep-spinner" />
                            <p>Loading reputation scoreboard…</p>
                        </div>
                    ) : filteredScoreboard.length === 0 ? (
                        <div className="rep-empty">
                            <FiUser size={48} />
                            <p>No testers found for this filter.</p>
                        </div>
                    ) : (
                        <div className="rep-cards-list">
                            {filteredScoreboard.map((tester, i) => (
                                <TesterCard key={tester.id} tester={tester} rank={i + 1} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── AI Analysis Tab ── */}
            {activeTab === 'analysis' && analysisResult && (
                <div className="rep-analysis-section">

                    {/* Task Analysis Summary */}
                    <div className="analysis-card task-info-card">
                        <h3 className="analysis-card-title"><FiInfo size={16} /> Task Analysis</h3>
                        <div className="task-info-grid">
                            <div className="task-info-item">
                                <span className="ti-label">Task Type</span>
                                <span className="ti-val">{analysisResult.task_analysis?.task_type}</span>
                            </div>
                            <div className="task-info-item">
                                <span className="ti-label">Difficulty</span>
                                <span className="ti-val capitalize">{analysisResult.task_analysis?.difficulty_level}</span>
                            </div>
                            <div className="task-info-item">
                                <span className="ti-label">Deadline Urgency</span>
                                <span className="ti-val capitalize">{analysisResult.task_analysis?.deadline_urgency}</span>
                            </div>
                            <div className="task-info-item">
                                <span className="ti-label">Risk Level</span>
                                <span className="ti-val capitalize">{analysisResult.task_analysis?.risk_level}</span>
                            </div>
                            <div className="task-info-item">
                                <span className="ti-label">Testers Required</span>
                                <span className="ti-val">{analysisResult.task_analysis?.number_of_testers_required}</span>
                            </div>
                            <div className="task-info-item full-width">
                                <span className="ti-label">Required Skills</span>
                                <div className="skill-chips-row">
                                    {(analysisResult.task_analysis?.required_skills || []).map((s, i) => (
                                        <span key={i} className="skill-chip">{s}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Banner */}
                    <div className="analysis-summary-banner">
                        <div className="summary-item">
                            <span className="summary-num">{analysisResult.summary?.total_testers_analyzed}</span>
                            <span className="summary-lbl">Testers Analyzed</span>
                        </div>
                        <div className="summary-divider" />
                        <div className="summary-item">
                            <span className="summary-num green">{analysisResult.summary?.total_testers_recommended}</span>
                            <span className="summary-lbl">Recommended</span>
                        </div>
                        <div className="summary-divider" />
                        <div className="summary-item">
                            <span className="summary-num">{analysisResult.summary?.recommendation_quality}</span>
                            <span className="summary-lbl">Quality</span>
                        </div>
                    </div>

                    {/* Notes */}
                    {(analysisResult.summary?.notes || []).length > 0 && (
                        <div className="analysis-notes">
                            {analysisResult.summary.notes.map((note, i) => (
                                <div key={i} className="analysis-note">
                                    <FiInfo size={13} /> {note}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Final Recommended Testers */}
                    {(analysisResult.final_recommended_testers || []).length > 0 && (
                        <div className="analysis-card">
                            <h3 className="analysis-card-title">
                                <FiCheckCircle size={16} className="success-icon" /> Final Recommended Testers
                                <span className="badge-count">{analysisResult.final_recommended_testers.length}</span>
                            </h3>
                            <div className="final-rec-list">
                                {analysisResult.final_recommended_testers.map((t) => (
                                    <div key={t.tester_id} className="final-rec-row">
                                        <div className="final-rec-rank">#{t.rank}</div>
                                        <div className="final-rec-avatar">
                                            {t.tester_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <div className="final-rec-info">
                                            <span className="final-rec-name">{t.tester_name}</span>
                                            <span className="final-rec-reason">{t.reason}</span>
                                        </div>
                                        <div className="final-rec-score">
                                            <span className="final-score-num">{t.final_score}</span>
                                            <span className="final-score-lbl">score</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Detailed Recommendations */}
                    <div className="analysis-card">
                        <h3 className="analysis-card-title">
                            <FiTarget size={16} /> All Tester Recommendations (Ranked)
                        </h3>
                        <div className="rec-cards-list">
                            {(analysisResult.task_recommendations || []).map((rec, i) => (
                                <RecommendationCard key={rec.tester_id} rec={rec} rank={i + 1} />
                            ))}
                        </div>
                    </div>

                    {/* Reputation Scoring Detail */}
                    <div className="analysis-card">
                        <h3 className="analysis-card-title">
                            <FiShield size={16} /> Reputation Scoring Detail
                        </h3>
                        <div className="rep-scoring-table">
                            <div className="rep-table-head">
                                <span>Tester</span>
                                <span>Rep. Score</span>
                                <span>Level</span>
                                <span>Approval</span>
                                <span>Proof Conf.</span>
                                <span>Penalty</span>
                                <span>Risk</span>
                            </div>
                            {(analysisResult.reputation_scoring || [])
                                .sort((a, b) => b.reputation_score - a.reputation_score)
                                .map(r => {
                                    const cfg = LEVEL_CONFIG[r.reputation_level] || LEVEL_CONFIG['New Tester'];
                                    return (
                                        <div key={r.tester_id} className="rep-table-row">
                                            <span className="rep-table-name">{r.tester_name}</span>
                                            <span className="rep-table-score">{r.reputation_score}</span>
                                            <span><Badge variant={cfg.badge}>{cfg.icon} {r.reputation_level}</Badge></span>
                                            <span>{r.approval_rate}%</span>
                                            <span>{r.average_proof_confidence}%</span>
                                            <span className="penalty-col">-{r.penalty_score}</span>
                                            <span>
                                                <span className={`risk-chip ${r.risk_level}`}>{r.risk_level}</span>
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'analysis' && !analysisResult && (
                <div className="rep-empty analysis-empty">
                    <FiZap size={48} />
                    <p>Select a task and click <strong>Run AI Analysis</strong> to get AI-powered recommendations.</p>
                </div>
            )}
        </div>
    );
}

export default TesterReputation;
