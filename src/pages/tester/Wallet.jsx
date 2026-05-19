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

    // Prioritize user profile data if walletData doesn't have it (or if it's 0)
    const displayBalance = (walletData?.walletBalance !== undefined && walletData?.walletBalance !== 0) 
        ? walletData.walletBalance 
        : (user?.wallet_balance || 0);

    const displayPending = (walletData?.pendingCredits !== undefined && walletData?.pendingCredits !== 0)
        ? walletData.pendingCredits
        : (user?.pending_credits || 0);

    const displayEarnings = (walletData?.totalEarnings !== undefined && walletData?.totalEarnings !== 0)
        ? walletData.totalEarnings
        : (user?.total_earnings || 0);



    return (
        <div className="wallet-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Wallet</h1>
                    <p className="page-subtitle">Track your earnings and manage withdrawals.</p>
                </div>
                <Button variant="primary">
                    Withdraw Credits
                </Button>
            </div>

            <div className="wallet-stats-grid">
                <div className="card wallet-stat-card primary">
                    <div className="stat-icon">
                        <FiTrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Available Balance</span>
                        <h2 className="stat-value">{displayBalance} Credits</h2>
                        <span className="stat-subtext">≈ ₹{displayBalance * 10}</span>
                    </div>
                </div>

                <div className="card wallet-stat-card">
                    <div className="stat-icon secondary">
                        <FiTrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Total Earnings</span>
                        <h2 className="stat-value">{displayEarnings} Credits</h2>
                        <span className="stat-subtext">+12% from last month</span>
                    </div>
                </div>

                <div className="card wallet-stat-card">
                    <div className="stat-icon warning">
                        <FiArrowUpRight size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Pending Credits</span>
                        <h2 className="stat-value">{displayPending} Credits</h2>
                        <span className="stat-subtext">Under verification</span>
                    </div>
                </div>
            </div>

            <div className="card transaction-card">
                <div className="card-header">
                    <h3 className="card-title">Transaction History</h3>
                </div>
                <div className="transaction-list">
                    {recentTransactions.map(log => (
                        <div key={log._id || log.id} className="transaction-item">
                            <div className="transaction-info">
                                <div className={`type-icon ${log.type}`}>
                                    {log.type === 'credit' ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                                </div>
                                <div>
                                    <p className="transaction-desc">{log.description || log.taskName || 'Withdrawal'}</p>
                                    <p className="transaction-date">{formatDate(log.timestamp || log.createdAt)}</p>
                                </div>
                            </div>
                            <div className={`transaction-amount ${log.type}`}>
                                {log.type === 'credit' ? '+' : '-'}{log.amount} Credits
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Wallet;
