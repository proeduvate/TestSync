import { useState, useEffect } from 'react';
import { transactionsAPI } from '../../services/api';
import { formatDate, formatCredits } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { FiSearch, FiFilter } from 'react-icons/fi';
import './AdminCredits.css';

function AdminCredits() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        async function fetchTransactions() {
            try {
                const res = await transactionsAPI.list();
                setTransactions(res.transactions || []);
            } catch (err) {
                console.error('Failed to load transactions:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchTransactions();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, typeFilter]);

    if (loading) return <Loader />;

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = 
            (tx.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tx.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tx.taskName || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || tx.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

    const getTypeBadge = (type) => {
        if (type === 'credit') return <Badge variant="success">Credit</Badge>;
        if (type === 'payment') return <Badge variant="primary">Payment</Badge>;
        return <Badge variant="secondary">{type}</Badge>;
    };

    return (
        <div className="admin-credits">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Credit Activity</h1>
                    <p className="page-subtitle">View all platform transactions and credit logs</p>
                </div>
            </div>

            <div className="card">
                <div className="list-controls">
                    <div className="search-bar">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search user, description, or task..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="filters">
                        <div className="filter-group">
                            <FiFilter className="filter-icon" />
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="all">All Types</option>
                                <option value="credit">Credits (+)</option>
                                <option value="payment">Payments (-)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>User</th>
                                <th>Role</th>
                                <th>Type</th>
                                <th>Description / Task</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map(tx => (
                                    <tr key={tx.id || tx._id}>
                                        <td>{formatDate(tx.timestamp)}</td>
                                        <td>{tx.userName}</td>
                                        <td><span className="capitalize">{tx.userType}</span></td>
                                        <td>{getTypeBadge(tx.type)}</td>
                                        <td>
                                            <div className="tx-description">{tx.description}</div>
                                            {tx.taskName && <div className="tx-task-name">{tx.taskName}</div>}
                                        </td>
                                        <td className={`tx-amount ${tx.type}`}>
                                            {tx.type === 'credit' ? '+' : '-'}{formatCredits(tx.amount)}
                                        </td>
                                        <td>
                                            <Badge variant={tx.status === 'completed' ? 'success' : 'warning'}>
                                                {tx.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="empty-state">
                                        No transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            className="btn-page"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            Previous
                        </button>
                        <span className="page-info">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className="btn-page"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminCredits;
