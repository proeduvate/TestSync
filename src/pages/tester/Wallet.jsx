import { BsCurrencyRupee } from 'react-icons/bs';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { transactionsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { FiTrendingUp, FiArrowUpRight, FiArrowDownLeft } from 'react-icons/fi';
import './Wallet.css';

function Wallet() {
    const { user } = useAuth();
    const [walletData, setWalletData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        async function fetchWallet() {
            try {
                console.log('Loading wallet data...');
                const res = await transactionsAPI.wallet();
                console.log('Wallet data received:', res);
                setWalletData(res);
            } catch (err) {
                console.error('Failed to load wallet:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchWallet();
    }, []);

    if (loading) return <Loader />;
    if (!walletData) return <div className="error-state">Failed to load wallet data. Please try again.</div>;

    const { 
        walletBalance = user?.wallet_balance || 0, 
        availableCredits = user?.wallet_balance || 0, 
        pendingCredits = user?.pending_credits || 0, 
        totalEarnings = user?.total_earnings || 0, 
        recentTransactions = [] 
    } = walletData || {};

    const displayBalance = (walletData?.walletBalance !== undefined && walletData?.walletBalance !== 0) 
        ? walletData.walletBalance 
        : (user?.wallet_balance || 0);

    const displayPending = (walletData?.pendingCredits !== undefined && walletData?.pendingCredits !== 0)
        ? walletData.pendingCredits
        : (user?.pending_credits || 0);

    const displayEarnings = (walletData?.totalEarnings !== undefined && walletData?.totalEarnings !== 0)
        ? walletData.totalEarnings
        : (user?.total_earnings || 0);

    const transactionsPerPage = 10;
    const totalPages = Math.ceil((recentTransactions || []).length / transactionsPerPage);
    const indexOfLastTx = currentPage * transactionsPerPage;
    const indexOfFirstTx = indexOfLastTx - transactionsPerPage;
    const currentTransactions = (recentTransactions || []).slice(indexOfFirstTx, indexOfLastTx);

    return (
        <div className="wallet-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Wallet</h1>
                </div>
                <Button variant="primary">
                    Withdraw Credits
                </Button>
            </div>

            <div className="wallet-stats-grid">
                <div className="card wallet-stat-card primary">
                    <div className="stat-top-row">
                        <span className="stat-label">Available Balance</span>
                        <div className="stat-icon"><FiTrendingUp size={18} /></div>
                    </div>
                    <h2 className="stat-value">{displayBalance} Credits</h2>
                    <span className="stat-subtext">≈ ₹{displayBalance * 10}</span>
                </div>

                <div className="card wallet-stat-card">
                    <div className="stat-top-row">
                        <span className="stat-label">Total Earnings</span>
                        <div className="stat-icon secondary"><FiTrendingUp size={18} /></div>
                    </div>
                    <h2 className="stat-value">{displayEarnings} Credits</h2>
                    <span className="stat-subtext">+12% from last month</span>
                </div>

                <div className="card wallet-stat-card">
                    <div className="stat-top-row">
                        <span className="stat-label">Pending Credits</span>
                        <div className="stat-icon warning"><FiArrowUpRight size={18} /></div>
                    </div>
                    <h2 className="stat-value">{displayPending} Credits</h2>
                    <span className="stat-subtext">Under verification</span>
                </div>
            </div>

            <div className="card transaction-card">
                <div className="tx-table-wrapper">
                    <table className="tx-table">
                        <thead>
                            <tr>
                                <th>TYPE</th>
                                <th>DESCRIPTION</th>
                                <th>DATE</th>
                                <th>AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="tx-empty">No transactions found.</td>
                                </tr>
                            ) : (
                                currentTransactions.map(log => (
                                    <tr key={log._id || log.id}>
                                        <td>
                                            <div className={`type-icon ${log.type}`}>
                                                {log.type === 'credit' ? <FiArrowDownLeft size={14} /> : <FiArrowUpRight size={14} />}
                                            </div>
                                        </td>
                                        <td className="tx-desc">{log.description || log.taskName || 'Withdrawal'}</td>
                                        <td className="tx-date">{formatDate(log.timestamp || log.createdAt)}</td>
                                        <td className={`transaction-amount ${log.type}`}>
                                            {log.type === 'credit' ? '+' : '-'}{log.amount} Credits
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {recentTransactions.length > 0 && (
                    <div className="pagination-bar">
                        <button
                            className="pagination-btn"
                            onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(prev - 1, 1)); }}
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
                            onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(prev + 1, totalPages)); }}
                            disabled={currentPage === totalPages || totalPages === 0}
                        >
                            Next &rarr;
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Wallet;
