import { BsCurrencyRupee } from 'react-icons/bs';
import { useState, useEffect } from 'react';
import { tasksAPI } from '../../services/api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useToast } from '../../components/common/Toast';
import { FiSearch, FiFilter, FiMoreVertical, FiExternalLink, FiTrash2, FiEdit2, FiEye, FiGlobe, FiCalendar, FiCheck } from 'react-icons/fi';
import './AdminTasks.css';

const testTypes = [
    { id: 'functional', name: 'Functional' },
    { id: 'usability', name: 'Usability' },
    { id: 'security', name: 'Security' },
    { id: 'performance', name: 'Performance' },
    { id: 'accessibility', name: 'Accessibility' },
    { id: 'compatibility', name: 'Compatibility' },
];

const testingLevels = [
    { id: 'basic', name: 'Basic' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'expert', name: 'Expert' },
];

function AdminTasks() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [viewingTask, setViewingTask] = useState(null);
    const [editFormData, setEditFormData] = useState({
        appName: '',
        appUrl: '',
        status: '',
        budget: 0,
        description: '',
        testingLevel: '',
        testTypes: [],
        deadline: ''
    });
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

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.appName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.developerName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const statusMap = {
            'open': { label: 'Open', variant: 'info' },
            'in-progress': { label: 'In Progress', variant: 'primary' },
            'pending-review': { label: 'Pending Review', variant: 'warning' },
            'under-verification': { label: 'Verification', variant: 'secondary' },
            'completed': { label: 'Completed', variant: 'success' },
            'cancelled': { label: 'Cancelled', variant: 'danger' },
        };
        const config = statusMap[status] || { label: status, variant: 'secondary' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const handleExternalLink = (url) => {
        if (!url) {
            toast.warning('No URL', 'This application does not have a URL provided.');
            return;
        }
        window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
    };

    const handleViewClick = (task) => {
        setViewingTask(task);
        setIsViewModalOpen(true);
        setShowDropdown(null);
    };

    const handleEditClick = (task) => {
        setEditingTask(task);
        setEditFormData({
            appName: task.appName,
            appUrl: task.appUrl,
            status: task.status,
            budget: task.budget,
            description: task.description || '',
            testingLevel: task.testingLevel || 'intermediate',
            testTypes: task.testTypes || [],
            deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''
        });
        setIsEditModalOpen(true);
        setShowDropdown(null);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTestTypeToggle = (typeId) => {
        setEditFormData(prev => ({
            ...prev,
            testTypes: prev.testTypes.includes(typeId)
                ? prev.testTypes.filter(t => t !== typeId)
                : [...prev.testTypes, typeId],
        }));
    };

    const handleUpdateTask = async () => {
        if (!editFormData.appName || !editFormData.appUrl) {
            toast.error('Validation Error', 'App Name and URL are required.');
            return;
        }

        try {
            const { task: updatedTask } = await tasksAPI.update(editingTask.id, {
                appName: editFormData.appName,
                appUrl: editFormData.appUrl,
                status: editFormData.status,
                budget: parseFloat(editFormData.budget),
                description: editFormData.description,
            });

            // Note: Since our update API is generic, we handle the local update manually
            setTasks(prev => prev.map(t => 
                (t._id || t.id) === editingTask.id 
                    ? { ...t, 
                        appName: editFormData.appName, 
                        appUrl: editFormData.appUrl, 
                        status: editFormData.status, 
                        budget: editFormData.budget,
                        description: editFormData.description,
                        testingLevel: editFormData.testingLevel,
                        testTypes: editFormData.testTypes,
                        deadline: editFormData.deadline
                    } 
                    : t
            ));

            toast.success('Task Updated', 'The task details have been successfully saved.');
            setIsEditModalOpen(false);
        } catch (err) {
            toast.error('Update Failed', err.message);
        }
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;
        
        try {
            await tasksAPI.delete(taskId);
            setTasks(prev => prev.filter(t => (t._id || t.id) !== taskId));
            toast.success('Task Deleted', 'The task has been permanently removed.');
            setShowDropdown(null);
        } catch (err) {
            toast.error('Deletion Failed', err.message);
        }
    };

    return (
        <div className="admin-tasks-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Global Task Management</h1>
                    <p className="page-subtitle">Oversight of all testing activities across the platform.</p>
                </div>
            </div>

            <div className="card admin-tasks-card">
                <div className="filters-bar">
                    <div className="search-box">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by app or developer..."
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
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="under-verification">Under Verification</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="admin-tasks-table">
                        <thead>
                            <tr>
                                <th>Task Detail</th>
                                <th>Developer</th>
                                <th>Budget</th>
                                <th>Testers</th>
                                <th>Status</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.map(task => (
                                <tr key={task._id || task.id}>
                                    <td>
                                        <div className="task-detail-cell">
                                            <span className="task-name">{task.appName}</span>
                                            <span className="task-type">{task.testTypes?.join(', ')}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="dev-cell">
                                            <span className="dev-name">{task.developerName || 'System'}</span>
                                            <span className="dev-company">{task.developerCompany || 'Internal'}</span>
                                        </div>
                                    </td>
                                    <td>{formatCurrency(task.budget)}</td>
                                    <td>{task.testersAssigned}</td>
                                    <td>{getStatusBadge(task.status)}</td>
                                    <td>{formatDate(task.createdAt)}</td>
                                    <td>
                                        <div className="action-btns-cell">
                                            <button 
                                                className="icon-btn" 
                                                onClick={() => handleExternalLink(task.appUrl)}
                                                title="Open App Link"
                                            >
                                                <FiExternalLink />
                                            </button>
                                            <div className="more-actions-container">
                                                <button 
                                                    className={`icon-btn ${showDropdown === (task._id || task.id) ? 'active' : ''}`}
                                                    onClick={() => setShowDropdown(showDropdown === (task._id || task.id) ? null : (task._id || task.id))}
                                                >
                                                    <FiMoreVertical />
                                                </button>
                                                {showDropdown === (task._id || task.id) && (
                                                    <div className="actions-dropdown">
                                                        <button onClick={() => handleViewClick(task)}>
                                                            <FiEye size={14} /> View Details
                                                        </button>
                                                        <button onClick={() => handleEditClick(task)}>
                                                            <FiEdit2 size={14} /> Edit Task
                                                        </button>
                                                        <button className="danger" onClick={() => handleDelete(task._id || task.id)}>
                                                            <FiTrash2 size={14} /> Delete Task
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Task Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Task Details"
                size="lg"
                footer={
                    <div className="modal-footer-btns">
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleUpdateTask}>Save Changes</Button>
                    </div>
                }
            >
                {editingTask && (
                    <div className="edit-task-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Application Name</label>
                                <input
                                    type="text"
                                    name="appName"
                                    className="form-input"
                                    value={editFormData.appName}
                                    onChange={handleEditChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Application URL</label>
                                <div className="input-with-icon">
                                    <FiGlobe className="input-icon" />
                                    <input
                                        type="text"
                                        name="appUrl"
                                        className="form-input"
                                        value={editFormData.appUrl}
                                        onChange={handleEditChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Task Status</label>
                                <select 
                                    name="status" 
                                    className="form-input"
                                    value={editFormData.status}
                                    onChange={handleEditChange}
                                >
                                    <option value="open">Open</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="pending-review">Pending Review</option>
                                    <option value="under-verification">Verification</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Budget (INR)</label>
                                <div className="input-with-icon">
                                    <BsCurrencyRupee className="input-icon" />
                                    <input
                                        type="number"
                                        name="budget"
                                        className="form-input"
                                        value={editFormData.budget}
                                        onChange={handleEditChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                name="description"
                                className="form-input"
                                rows="3"
                                value={editFormData.description}
                                onChange={handleEditChange}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Testing Level</label>
                                <select 
                                    name="testingLevel" 
                                    className="form-input"
                                    value={editFormData.testingLevel}
                                    onChange={handleEditChange}
                                >
                                    <option value="basic">Basic</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="expert">Expert</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deadline</label>
                                <div className="input-with-icon">
                                    <FiCalendar className="input-icon" />
                                    <input
                                        type="date"
                                        name="deadline"
                                        className="form-input"
                                        value={editFormData.deadline}
                                        onChange={handleEditChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Test Types</label>
                            <div className="test-types-selection">
                                {testTypes.map(type => (
                                    <label key={type.id} className="type-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={editFormData.testTypes.includes(type.id)}
                                            onChange={() => handleTestTypeToggle(type.id)}
                                        />
                                        <span>{type.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* View Task Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Task Details"
                size="lg"
                footer={
                    <div className="modal-footer-btns">
                        <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>Close</Button>
                        <Button variant="primary" onClick={() => {
                            handleEditClick(viewingTask);
                            setIsViewModalOpen(false);
                        }}>Edit Task</Button>
                    </div>
                }
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
                            <h4 className="section-title">Developer Details</h4>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Developer/Owner</span>
                                    <span className="detail-value">{viewingTask.developerName || viewingTask.developer?.name || 'System'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Company/Group</span>
                                    <span className="detail-value">{viewingTask.developerCompany || viewingTask.developer?.company || 'Internal'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Contact Email</span>
                                    <span className="detail-value">{viewingTask.developer?.email || 'admin@proeduvate.com'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="view-section">
                            <h4 className="section-title">Testing & Financials</h4>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Level</span>
                                    <span className="detail-value capitalize">{viewingTask.testingLevel}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Budget</span>
                                    <span className="detail-value">{formatCurrency(viewingTask.budget)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Testers Joined</span>
                                    <span className="detail-value">{viewingTask.testersAssigned} / {viewingTask.requiredTesters || 1}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Created At</span>
                                    <span className="detail-value">{formatDate(viewingTask.createdAt)}</span>
                                </div>
                                <div className="detail-item full-width">
                                    <span className="detail-label">Test Types Requsted</span>
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
        </div>
    );
}

export default AdminTasks;
