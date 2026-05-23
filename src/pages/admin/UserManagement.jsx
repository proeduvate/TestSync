import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { useToast } from '../../components/common/Toast';
import { FiSearch, FiEdit2, FiTrash2, FiMoreVertical, FiCheck, FiX, FiUsers, FiEye } from 'react-icons/fi';
import './UserManagement.css';

function UserManagement() {
    const navigate = useNavigate();
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        role: '',
        status: ''
    });

    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await usersAPI.list();
                setUsers(res.users || []);
                const pending = (res.users || []).filter(u => u.status === 'pending');
                setPendingCount(pending.length);
            } catch (err) {
                console.error('Failed to load users:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, []);

    if (loading) return <Loader />;

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const statusMap = {
            active: { label: 'Active', variant: 'success' },
            inactive: { label: 'Inactive', variant: 'secondary' },
            suspended: { label: 'Suspended', variant: 'danger' },
            pending: { label: 'Pending', variant: 'warning' },
        };
        const config = statusMap[status] || { label: status, variant: 'secondary' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getRoleBadge = (role) => {
        const roleMap = {
            developer: { label: 'Developer', variant: 'primary' },
            tester: { label: 'Tester', variant: 'secondary' },
            admin: { label: 'Admin', variant: 'info' },
        };
        const config = roleMap[role] || { label: role, variant: 'secondary' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const handleStatusChange = async (userId, newStatus) => {
        try {
            await usersAPI.update(userId, { status: newStatus });
            setUsers(prev => prev.map(u =>
                (u._id || u.id) === userId ? { ...u, status: newStatus } : u
            ));
            setShowDropdown(null);
            toast.success('Status Updated', `User status changed to ${newStatus}`);
        } catch (err) {
            toast.error('Error', err.message);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
        
        try {
            await usersAPI.delete(userId);
            setUsers(prev => prev.filter(u => (u._id || u.id) !== userId));
            toast.success('User Deleted', 'The user has been permanently removed from the platform.');
            setShowDropdown(null);
        } catch (err) {
            toast.error('Deletion Failed', err.message);
        }
    };

    const handleEditSave = async () => {
        if (!editFormData.name || !editFormData.email) {
            toast.error('Validation Error', 'Name and Email are required.');
            return;
        }

        setIsSaving(true);
        try {
            const { user: updatedUser } = await usersAPI.update(selectedUser.id, editFormData);
            
            setUsers(prev => prev.map(u => 
                (u._id || u.id) === selectedUser.id ? { ...u, ...editFormData } : u
            ));
            
            toast.success('User Updated', 'User details have been successfully saved.');
            setShowModal(false);
        } catch (err) {
            toast.error('Update Failed', err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setEditFormData({
            name: user.name || '',
            email: user.email || '',
            role: user.role || 'tester',
            status: user.status || 'active'
        });
        setShowModal(true);
        setShowDropdown(null);
    };

    return (
        <div className="user-management-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">Manage platform users and their permissions</p>
                </div>
                <Button
                    variant="primary"
                    icon={<FiUsers />}
                    onClick={() => navigate('/admin/requests')}
                >
                    User Requests {pendingCount > 0 && <span className="btn-badge">{pendingCount}</span>}
                </Button>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="search-box">
                    <FiSearch size={18} className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <select
                    className="form-input filter-select"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="all">All Roles</option>
                    <option value="developer">Developers</option>
                    <option value="tester">Testers</option>
                    <option value="admin">Admins</option>
                </select>

                <select
                    className="form-input filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>

            {/* Stats Summary */}
            <div className="stats-summary">
                <div className="stat-item">
                    <span className="stat-value">{users.length}</span>
                    <span className="stat-label">Total Users</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{users.filter(u => u.role === 'developer').length}</span>
                    <span className="stat-label">Developers</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{users.filter(u => u.role === 'tester').length}</span>
                    <span className="stat-label">Testers</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{users.filter(u => u.status === 'active').length}</span>
                    <span className="stat-label">Active</span>
                </div>
            </div>

            {/* Users Table */}
            <div className="card users-table-card">
                <div className="table-wrapper">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Tasks</th>
                                <th>Credits</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr
                                    key={user._id || user.id}
                                    className="clickable-row"
                                    onClick={() => navigate(`/admin/users/${user._id || user.id}`)}
                                >
                                    <td>
                                        <div className="user-cell">
                                            <div className="avatar">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt={user.name} />
                                                ) : (
                                                    user.name ? user.name.split(' ').map(n => n[0]).join('') : '?'
                                                )}
                                            </div>
                                            <div>
                                                <p className="user-name">{user.name}</p>
                                                <p className="user-email">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{getRoleBadge(user.role)}</td>
                                    <td>{getStatusBadge(user.status)}</td>
                                    <td className="number-cell">{user.completedTasks || 0}</td>
                                    <td className="number-cell">{user.credits?.toLocaleString() || 0}</td>
                                    <td className="date-cell">{formatDate(user.joinedAt || user.createdAt)}</td>
                                    <td>
                                        <div className="actions-cell">
                                            <button
                                                className="action-btn"
                                                onClick={(e) => { e.stopPropagation(); setShowDropdown(showDropdown === (user._id || user.id) ? null : (user._id || user.id)); }}
                                            >
                                                <FiMoreVertical size={18} />
                                            </button>
                                            {showDropdown === (user._id || user.id) && (
                                                <div className="actions-dropdown">
                                                    <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${user._id || user.id}`); }}>
                                                        <FiEye size={14} /> View Profile
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); openEditModal(user); }}>
                                                        <FiEdit2 size={14} /> Edit User
                                                    </button>
                                                    {user.status === 'active' ? (
                                                        <button onClick={(e) => { e.stopPropagation(); handleStatusChange(user._id || user.id, 'suspended'); }}>
                                                            <FiX size={14} /> Suspend
                                                        </button>
                                                    ) : (
                                                        <button onClick={(e) => { e.stopPropagation(); handleStatusChange(user._id || user.id, 'active'); }}>
                                                            <FiCheck size={14} /> Activate
                                                        </button>
                                                    )}
                                                    <button className="danger" onClick={(e) => { e.stopPropagation(); handleDelete(user._id || user.id); }}>
                                                        <FiTrash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="empty-table">
                        <p>No users found matching your criteria.</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Edit User"
            >
                {selectedUser && (
                    <div className="edit-user-form">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                value={editFormData.name}
                                onChange={handleEditChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                value={editFormData.email}
                                onChange={handleEditChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Platform Role</label>
                            <select 
                                name="role" 
                                className="form-input" 
                                value={editFormData.role}
                                onChange={handleEditChange}
                            >
                                <option value="developer">Developer</option>
                                <option value="tester">Tester</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Account Status</label>
                            <select 
                                name="status" 
                                className="form-input" 
                                value={editFormData.status}
                                onChange={handleEditChange}
                            >
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={isSaving}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleEditSave} loading={isSaving}>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default UserManagement;
