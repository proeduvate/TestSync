import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI } from '../../services/api';
import { getDeadlineStatus, formatCurrency } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { 
    FiPlus, 
    FiSearch, 
    FiFilter, 
    FiMoreVertical, 
    FiEye, 
    FiMessageCircle, 
    FiEdit2, 
    FiTrash2, 
    FiClipboard, 
    FiCalendar, 
    FiPieChart, 
    FiDollarSign, 
    FiUsers, 
    FiActivity 
} from 'react-icons/fi';
import './Tasks.css';

function Tasks() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [showDropdown, setShowDropdown] = useState(null);
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [extendingTask, setExtendingTask] = useState(null);
    const [newDeadline, setNewDeadline] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const tasksPerPage = 10;
    const toast = useToast();

    // Close dropdown on click outside
    useEffect(() => {
        const handleOutsideClick = () => setShowDropdown(null);
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

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

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        setLoading(true);
        try {
            await tasksAPI.delete(taskId);
            toast.success('Task Deleted', 'The task has been successfully removed.');
            fetchTasks();
        } catch (err) {
            toast.error('Deletion Failed', err.message);
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
            fetchTasks();
        } catch(err) {
            toast.error('Failed to extend deadline', err.message);
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

    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);

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

    // Calculate Summary Stats
    const totalCreatedTasks = tasks.length;
    const totalBudgetInvested = tasks.reduce((sum, t) => sum + (t.budget || 0), 0);
    const totalTestersAssigned = tasks.reduce((sum, t) => sum + (t.testersAssigned || 0), 0);
    const overallProgress = tasks.length > 0 
        ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length)
        : 0;

    if (loading) return <Loader />;

    return (
        <div className="tasks-page">




            {/* ── Tasks Table Card ── */}
            <div className="card tasks-list-card">
                <div className="filters-bar">
                    <div className="search-box">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="actions-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="filter-group" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', cursor: 'pointer' }}>
                            <FiFilter style={{ color: 'var(--text-secondary)' }} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            >
                                <option value="active">Active Tasks</option>
                                <option value="all">All Tasks</option>
                                <option value="open">Open</option>
                                <option value="in-progress">In Progress</option>
                                <option value="pending-review">Pending Review</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('/developer/create-task')}
                            icon={<FiPlus />}
                        >
                            Create New Task
                        </Button>
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
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                                        <div className="empty-state">
                                            <FiClipboard size={40} style={{ opacity: 0.4 }} />
                                            <h3>No Tasks Found</h3>
                                            <p>You haven't created any tasks yet or no tasks match your filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {currentTasks.map(task => {
                                const deadlineStatus = getDeadlineStatus(task.deadline);
                                const taskIdStr = task._id || task.id;
                                return (
                                    <tr key={taskIdStr}>
                                        <td>
                                            <div className="task-name-cell">
                                                <span className="task-name">{task.appName}</span>
                                                <span className="task-id">#{taskIdStr.slice(-6)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="test-types-tags">
                                                {task.testTypes.slice(0, 2).map((type, i) => (
                                                    <span key={i} className="type-tag">{type}</span>
                                                ))}
                                                {task.testTypes.length > 2 && (
                                                    <span className="type-tag plus-more">+{task.testTypes.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="budget-cell">{formatCurrency(task.budget)}</td>
                                        <td>{task.testersAssigned || 0}</td>
                                        <td>
                                            <div className="progress-cell">
                                                <div className="progress-mini">
                                                    <div className="progress-bar" style={{ width: `${task.progress || 0}%` }} />
                                                </div>
                                                <span>{task.progress || 0}%</span>
                                            </div>
                                        </td>
                                        <td>{getStatusBadge(task.status)}</td>
                                        <td>
                                            <Badge variant={deadlineStatus.color} size="sm">
                                                {deadlineStatus.label}
                                            </Badge>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                                                <button 
                                                    className="icon-btn" 
                                                    title="View Details"
                                                    onClick={() => navigate(`/developer/tasks/${taskIdStr}`)}
                                                >
                                                    <FiEye size={15} />
                                                </button>
                                                <div className="more-actions-container">
                                                    <button 
                                                        className={`icon-btn ${showDropdown === taskIdStr ? 'active' : ''}`}
                                                        title="More Options"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowDropdown(showDropdown === taskIdStr ? null : taskIdStr);
                                                        }}
                                                    >
                                                        <FiMoreVertical size={15} />
                                                    </button>
                                                    {showDropdown === taskIdStr && (
                                                        <div className="actions-dropdown" onClick={(e) => e.stopPropagation()}>
                                                            <button onClick={() => {
                                                                navigate(`/developer/tasks/${taskIdStr}`);
                                                                setShowDropdown(null);
                                                            }}>
                                                                <FiEye size={13} /> View Details
                                                            </button>
                                                            <Link to={`/developer/feedback?taskId=${taskIdStr}`} style={{ textDecoration: 'none' }}>
                                                                <button onClick={() => setShowDropdown(null)}>
                                                                    <FiMessageCircle size={13} /> View Feedback
                                                                 </button>
                                                            </Link>
                                                            {task.status === 'open' && (
                                                                <button onClick={() => {
                                                                    toast.info('Task Editing', 'Full task editing is coming soon. For now, you can extend the deadline or delete and recreate.');
                                                                    setShowDropdown(null);
                                                                }}>
                                                                    <FiEdit2 size={13} /> Edit Task
                                                                </button>
                                                            )}
                                                            {deadlineStatus.status === 'overdue' && (
                                                                <button onClick={() => {
                                                                    setExtendingTask(task);
                                                                    setNewDeadline('');
                                                                    setIsExtendModalOpen(true);
                                                                    setShowDropdown(null);
                                                                }}>
                                                                    <FiCalendar size={13} /> Extend Deadline
                                                                </button>
                                                            )}
                                                            <button className="danger" onClick={() => { handleDeleteTask(taskIdStr); setShowDropdown(null); }}>
                                                                <FiTrash2 size={13} /> Delete Task
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

                {/* Pagination bar inside card */}
                {filteredTasks.length > 0 && (
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
                            disabled={currentPage === totalPages}
                        >
                            Next &rarr;
                        </button>
                    </div>
                )}
            </div>

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
