import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI } from '../../services/api';
import { getDeadlineStatus, formatCurrency } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEye, FiExternalLink, FiMessageCircle, FiEdit2, FiTrash2, FiClipboard, FiCalendar } from 'react-icons/fi';
import './Tasks.css';

function Tasks() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [showDropdown, setShowDropdown] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingTask, setViewingTask] = useState(null);
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [extendingTask, setExtendingTask] = useState(null);
    const [newDeadline, setNewDeadline] = useState('');
    const toast = useToast();

    useEffect(() => {
        async function fetchTasks() {
            try {
                const res = await tasksAPI.list();
                setTasks(res.tasks || []);
            } catch (err) {
                console.error('Failed to load tasks:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchTasks();
    }, []);

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        setLoading(true);
        try {
            await tasksAPI.delete(taskId);
            toast.success('Task Deleted', 'The task has been successfully removed.');
            const res = await tasksAPI.list();
            setTasks(res.tasks || []);
        } catch (err) {
            toast.error('Deletion Failed', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExtendSubmit = async () => {
        if (!newDeadline) return;
        setLoading(true);
        try {
            await tasksAPI.update(extendingTask._id || extendingTask.id, { 
                deadline: newDeadline,
                status: 'open' 
            });
            toast.success('Deadline Extended', 'Your task is back in the marketplace.');
            setIsExtendModalOpen(false);
            setNewDeadline('');
            
            // Refresh tasks
            const res = await tasksAPI.list();
            setTasks(res.tasks || []);
        } catch(err) {
            toast.error('Failed to extend deadline', err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.appName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' 
            ? true 
            : statusFilter === 'active' 
                ? task.status !== 'completed' 
                : task.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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

    if (loading) return <Loader />;

    return (
        <div className="tasks-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Tasks</h1>
                    <p className="page-subtitle">Manage and track your testing requests.</p>
                </div>
                <Link to="/developer/create-task">
                    <Button variant="primary" icon={<FiPlus />}>
                        Create New Task
                    </Button>
                </Link>
            </div>

            <div className="card tasks-list-card">
                <div className="filters-bar">
                    <div className="search-box">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <FiFilter />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="active">Active Tasks</option>
                            <option value="all">All Tasks</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="pending-review">Pending Review</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="tasks-table">
                        <thead>
                            <tr>
                                <th>Task Name</th>
                                <th>Test Types</th>
                                <th>Budget</th>
                                <th>Testers</th>
                                <th>Progress</th>
                                <th>Status</th>
                                <th>Deadline</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                                        <div className="empty-state">
                                            <FiClipboard size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                                            <h3>No Tasks Found</h3>
                                            <p>You haven't created any tasks yet or no tasks match your filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {filteredTasks.map(task => {
                                const deadlineStatus = getDeadlineStatus(task.deadline);
                                return (
                                    <tr key={task._id || task.id}>
                                        <td>
                                            <div className="task-name-cell">
                                                <span className="task-name">{task.appName}</span>
                                                <span className="task-id">#{(task._id || task.id).slice(-6)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="test-types-tags">
                                                {task.testTypes.slice(0, 2).map((type, i) => (
                                                    <span key={i} className="type-tag">{type}</span>
                                                ))}
                                                {task.testTypes.length > 2 && (
                                                    <span className="type-tag">+{task.testTypes.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{formatCurrency(task.budget)}</td>
                                        <td>{task.testersAssigned || 0}</td>
                                        <td>
                                            <div className="progress-cell">
                                                <div className="progress-mini">
                                                    <div className="progress-bar" style={{ width: `${task.progress}%` }} />
                                                </div>
                                                <span>{task.progress}%</span>
                                            </div>
                                        </td>
                                        <td>{getStatusBadge(task.status)}</td>
                                        <td>
                                            <Badge variant={deadlineStatus.color} size="sm">
                                                {deadlineStatus.label}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button 
                                                    className="icon-btn" 
                                                    title="View Details"
                                                    onClick={() => {
                                                        setViewingTask(task);
                                                        setIsViewModalOpen(true);
                                                    }}
                                                >
                                                    <FiEye />
                                                </button>
                                                <div className="more-actions-container">
                                                    <button 
                                                        className={`icon-btn ${showDropdown === (task._id || task.id) ? 'active' : ''}`}
                                                        title="More Options"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowDropdown(showDropdown === (task._id || task.id) ? null : (task._id || task.id));
                                                        }}
                                                    >
                                                        <FiMoreVertical />
                                                    </button>
                                                    {showDropdown === (task._id || task.id) && (
                                                        <div className="actions-dropdown">
                                                            <button onClick={() => {
                                                                setViewingTask(task);
                                                                setIsViewModalOpen(true);
                                                                setShowDropdown(null);
                                                            }}>
                                                                <FiEye size={14} /> View Details
                                                            </button>
                                                            <Link to={`/developer/feedback?taskId=${task._id || task.id}`} style={{ textDecoration: 'none' }}>
                                                                <button>
                                                                    <FiMessageCircle size={14} /> View Feedback
                                                                </button>
                                                            </Link>
                                                            {task.status === 'open' && (
                                                                <button onClick={() => {
                                                                    toast.info('Task Editing', 'Full task editing is coming soon. For now, you can extend the deadline or delete and recreate.');
                                                                    setShowDropdown(null);
                                                                }}>
                                                                    <FiEdit2 size={14} /> Edit Task
                                                                </button>
                                                            )}
                                                            {deadlineStatus.status === 'overdue' && (
                                                                <button onClick={() => {
                                                                    setExtendingTask(task);
                                                                    setNewDeadline('');
                                                                    setIsExtendModalOpen(true);
                                                                    setShowDropdown(null);
                                                                }}>
                                                                    <FiCalendar size={14} /> Extend Deadline
                                                                </button>
                                                            )}
                                                            <button className="danger" onClick={() => { handleDeleteTask(task._id || task.id); setShowDropdown(null); }}>
                                                                <FiTrash2 size={14} /> Delete Task
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Task Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Task Details"
                size="lg"
            >
                {viewingTask && (
                    <div className="task-view-details">
                        <div className="view-section">
                            <div className="view-section-header">
                                <h4 className="section-title">Application Information</h4>
                                {getStatusBadge(viewingTask.status)}
                            </div>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">App Name</span>
                                    <span className="detail-value">{viewingTask.appName}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">App URL</span>
                                    <a 
                                        href={viewingTask.appUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="detail-value link"
                                    >
                                        {viewingTask.appUrl} <FiExternalLink size={12} />
                                    </a>
                                </div>
                                <div className="detail-item full-width">
                                    <span className="detail-label">Description</span>
                                    <p className="detail-value description">{viewingTask.description || 'No description provided.'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="view-section">
                            <h4 className="section-title">Testing Requirements</h4>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Testing Level</span>
                                    <span className="detail-value capitalize">{viewingTask.testingLevel || 'Intermediate'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Budget</span>
                                    <span className="detail-value">{formatCurrency(viewingTask.budget)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Testers Assigned</span>
                                    <span className="detail-value">{viewingTask.testersAssigned || 0}</span>
                                </div>
                                <div className="detail-item full-width">
                                    <span className="detail-label">Test Types Requested</span>
                                    <div className="detail-badges">
                                        {(viewingTask.testTypes || []).map(type => (
                                            <span key={type} className="mini-badge">{type}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Extend Deadline Modal */}
            <Modal
                isOpen={isExtendModalOpen}
                onClose={() => setIsExtendModalOpen(false)}
                title="Extend Task Deadline"
            >
                {extendingTask && (
                    <div className="extend-deadline-content">
                        <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                            Extending the deadline for <strong>{extendingTask.appName}</strong> will re-publish it to the marketplace if it was hidden.
                        </p>
                        <div className="form-group">
                            <label className="form-label">New Deadline *</label>
                            <input 
                                type="date" 
                                className="form-input"
                                value={newDeadline}
                                onChange={(e) => setNewDeadline(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="form-actions" style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                            <Button variant="outline" onClick={() => setIsExtendModalOpen(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleExtendSubmit} disabled={!newDeadline}>Save & Publish</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default Tasks;
