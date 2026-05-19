import { useState, useEffect } from 'react';
import { supportAPI } from '../../services/api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/helpers';
import { useToast } from '../../components/common/Toast';
import { FiSearch, FiFilter, FiUser, FiMessageSquare, FiCheckCircle } from 'react-icons/fi';
import './SupportTickets.css';

function SupportTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [isResponding, setIsResponding] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await supportAPI.adminListTickets();
            setTickets(res.tickets || []);
        } catch (err) {
            toast.error('Load Error', 'Failed to fetch support tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (ticketId, newStatus) => {
        try {
            await supportAPI.updateTicket(ticketId, { status: newStatus });
            setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
            toast.success('Status Updated', `Ticket is now ${newStatus}`);
        } catch (err) {
            toast.error('Update Failed', err.message);
        }
    };

    const handleSendResponse = async () => {
        if (!adminResponse.trim()) {
            toast.error('Validation Error', 'Please enter a response.');
            return;
        }

        setIsResponding(true);
        try {
            await supportAPI.updateTicket(selectedTicket.id, { 
                admin_response: adminResponse,
                status: 'resolved'
            });
            
            setTickets(prev => prev.map(t => 
                t.id === selectedTicket.id 
                    ? { ...t, admin_response: adminResponse, status: 'resolved' } 
                    : t
            ));
            
            toast.success('Response Sent', 'Ticket has been marked as resolved.');
            setSelectedTicket(null);
            setAdminResponse('');
        } catch (err) {
            toast.error('Response Failed', err.message);
        } finally {
            setIsResponding(false);
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = 
            ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'open': return <Badge variant="warning">Open</Badge>;
            case 'in-progress': return <Badge variant="info">In Progress</Badge>;
            case 'resolved': return <Badge variant="success">Resolved</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="support-tickets-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Support Tickets</h1>
                    <p className="page-subtitle">Manage user queries and platform issues.</p>
                </div>
            </div>

            <div className="card support-card">
                <div className="filters-bar">
                    <div className="search-box">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by subject or user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <FiFilter className="filter-icon" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Loading tickets...</div>
                ) : filteredTickets.length === 0 ? (
                    <div className="empty-state">No support tickets found.</div>
                ) : (
                    <div className="tickets-list">
                        <div className="table-responsive">
                            <table className="support-table">
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>User</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTickets.map(ticket => (
                                        <tr key={ticket.id}>
                                            <td>
                                                <div className="ticket-subject-cell">
                                                    <span className="subject-text">{ticket.subject}</span>
                                                    <span className="message-snippet">{ticket.message.substring(0, 50)}...</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="user-cell">
                                                    <span className="user-name">{ticket.profiles?.name}</span>
                                                    <span className="user-email">{ticket.profiles?.email}</span>
                                                </div>
                                            </td>
                                            <td><span className="category-badge">{ticket.category}</span></td>
                                            <td>{getStatusBadge(ticket.status)}</td>
                                            <td>{formatDate(ticket.created_at)}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => {
                                                            setSelectedTicket(ticket);
                                                            setAdminResponse(ticket.admin_response || '');
                                                        }}
                                                        title="View & Respond"
                                                    >
                                                        <FiMessageSquare />
                                                    </Button>
                                                    {ticket.status === 'open' && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => handleStatusUpdate(ticket.id, 'in-progress')}
                                                            title="Mark In Progress"
                                                        >
                                                            <FiCheckCircle />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Ticket Details Modal */}
            <Modal
                isOpen={!!selectedTicket}
                onClose={() => setSelectedTicket(null)}
                title="Support Ticket Details"
                size="lg"
                footer={
                    <div className="modal-footer-btns">
                        <Button variant="secondary" onClick={() => setSelectedTicket(null)}>Close</Button>
                        {selectedTicket?.status !== 'resolved' && (
                            <Button variant="primary" onClick={handleSendResponse} loading={isResponding}>
                                Send Response & Resolve
                            </Button>
                        )}
                    </div>
                }
            >
                {selectedTicket && (
                    <div className="ticket-details-view">
                        <div className="detail-section">
                            <h4 className="section-title">Query Information</h4>
                            <div className="info-grid">
                                <div className="info-row">
                                    <span className="info-label">Subject:</span>
                                    <span className="info-value">{selectedTicket.subject}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">From:</span>
                                    <span className="info-value">{selectedTicket.profiles?.name} ({selectedTicket.profiles?.email})</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Category:</span>
                                    <span className="info-value capitalize">{selectedTicket.category}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Submitted:</span>
                                    <span className="info-value">{formatDate(selectedTicket.created_at, { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4 className="section-title">User Message</h4>
                            <div className="message-content">
                                {selectedTicket.message}
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4 className="section-title">Admin Response</h4>
                            {selectedTicket.status === 'resolved' ? (
                                <div className="response-content resolved">
                                    <p className="response-text">{selectedTicket.admin_response}</p>
                                    <span className="resolved-on">Resolved on {formatDate(selectedTicket.updated_at)}</span>
                                </div>
                            ) : (
                                <div className="response-input-container">
                                    <textarea
                                        className="admin-response-input"
                                        placeholder="Type your response to the user..."
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                        rows="5"
                                    />
                                    <p className="helper-text">Sending a response will automatically mark the ticket as "Resolved".</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default SupportTickets;
