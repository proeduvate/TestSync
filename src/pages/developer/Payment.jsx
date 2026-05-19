import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import { tasksAPI, transactionsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import { FiCreditCard, FiShield, FiCheck, FiArrowLeft, FiSmartphone, FiHome } from 'react-icons/fi';
import './Payment.css';

function Payment() {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardData, setCardData] = useState({
        number: '',
        name: '',
        expiry: '',
        cvv: '',
    });

    const task = location.state?.task || {};
    const amount = location.state?.amount || 0;

    const paymentMethods = [
        { id: 'card', name: 'Credit/Debit Card', icon: <FiCreditCard /> },
        { id: 'upi', name: 'UPI', icon: <FiSmartphone /> },
        { id: 'netbanking', name: 'Net Banking', icon: <FiHome /> },
    ];

    const handleCardChange = (e) => {
        let { name, value } = e.target;

        // Format card number with spaces
        if (name === 'number') {
            value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
        }

        // Format expiry
        if (name === 'expiry') {
            value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
        }

        setCardData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setIsProcessing(true);

        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Actually create the task in Supabase
            await tasksAPI.create({
                appName: task.appName,
                appUrl: task.appUrl,
                description: task.description,
                testingLevel: task.testingLevel,
                testTypes: task.selectedTestTypes || [],
                budget: task.budget,
                credits: task.budget,
                deadline: task.deadline,
                requiredTesters: task.requiredTesters || 3,
            });

            // Record the payment transaction
            await transactionsAPI.record({
                type: 'payment',
                amount: amount,
                description: `Payment for task: ${task.appName}`,
                taskName: task.appName,
                status: 'completed'
            });

            toast.success('Payment Successful & Task Created!', `Your task "${task.appName || 'New Task'}" is now live.`);
            navigate('/developer/dashboard');
        } catch (err) {
            console.error('Task creation failed:', err);
            toast.error('Task Creation Failed', err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="payment-page">
            <button className="back-btn" onClick={() => navigate(-1)}>
                <FiArrowLeft size={18} />
                <span>Back</span>
            </button>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Complete Payment</h1>
                    <p className="page-subtitle">Secure payment powered by TestFlow</p>
                </div>
            </div>

            <div className="payment-container">
                {/* Order Summary */}
                <div className="card order-summary">
                    <h3 className="card-title">Order Summary</h3>

                    <div className="order-item">
                        <span className="order-label">Testing Task</span>
                        <span className="order-value">{task.appName || 'New Task'}</span>
                    </div>

                    <div className="order-item">
                        <span className="order-label">Testing Level</span>
                        <span className="order-value" style={{ textTransform: 'capitalize' }}>{task.testingLevel}</span>
                    </div>

                    <div className="order-item">
                        <span className="order-label">Test Types</span>
                        <span className="order-value">{task.selectedTestTypes?.length || 0} types</span>
                    </div>

                    <div className="order-divider" />

                    <div className="order-item">
                        <span className="order-label">Subtotal</span>
                        <span className="order-value">{formatCurrency(task.budget || 0)}</span>
                    </div>

                    <div className="order-item">
                        <span className="order-label">Platform Fee (10%)</span>
                        <span className="order-value">{formatCurrency((task.budget || 0) * 0.1)}</span>
                    </div>

                    <div className="order-divider" />

                    <div className="order-item total">
                        <span className="order-label">Total</span>
                        <span className="order-value">{formatCurrency(amount)}</span>
                    </div>

                    <div className="secure-badge">
                        <FiShield size={16} />
                        <span>Secure 256-bit SSL encryption</span>
                    </div>
                </div>

                {/* Payment Form */}
                <div className="card payment-form-card">
                    <h3 className="card-title">Payment Method</h3>

                    <div className="payment-methods">
                        {paymentMethods.map(method => (
                            <label
                                key={method.id}
                                className={`payment-method-option ${paymentMethod === method.id ? 'selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value={method.id}
                                    checked={paymentMethod === method.id}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                <span className="method-icon">{method.icon}</span>
                                <span className="method-name">{method.name}</span>
                                {paymentMethod === method.id && <FiCheck className="method-check" size={18} />}
                            </label>
                        ))}
                    </div>

                    {paymentMethod === 'card' && (
                        <form onSubmit={handleSubmit} className="card-form">
                            <div className="form-group">
                                <label className="form-label">Card Number</label>
                                <div className="input-with-icon">
                                    <FiCreditCard className="input-icon" />
                                    <input
                                        type="text"
                                        name="number"
                                        className="form-input"
                                        placeholder="1234 5678 9012 3456"
                                        value={cardData.number}
                                        onChange={handleCardChange}
                                        maxLength={19}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Cardholder Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    placeholder="Anbarasan"
                                    value={cardData.name}
                                    onChange={handleCardChange}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Expiry Date</label>
                                    <input
                                        type="text"
                                        name="expiry"
                                        className="form-input"
                                        placeholder="MM/YY"
                                        value={cardData.expiry}
                                        onChange={handleCardChange}
                                        maxLength={5}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">CVV</label>
                                    <input
                                        type="password"
                                        name="cvv"
                                        className="form-input"
                                        placeholder="•••"
                                        value={cardData.cvv}
                                        onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value }))}
                                        maxLength={4}
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                loading={isProcessing}
                            >
                                Pay {formatCurrency(amount)}
                            </Button>
                        </form>
                    )}

                    {paymentMethod === 'upi' && (
                        <div className="upi-section">
                            <div className="form-group">
                                <label className="form-label">UPI ID</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="yourname@upi"
                                />
                            </div>
                            <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} loading={isProcessing}>
                                Pay {formatCurrency(amount)}
                            </Button>
                        </div>
                    )}

                    {paymentMethod === 'netbanking' && (
                        <div className="netbanking-section">
                            <p className="section-note">Select your bank to proceed with Net Banking</p>
                            <div className="bank-grid">
                                {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'].map(bank => (
                                    <button key={bank} className="bank-option">
                                        {bank}
                                    </button>
                                ))}
                            </div>
                            <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} loading={isProcessing}>
                                Pay {formatCurrency(amount)}
                            </Button>
                        </div>
                    )}

                    <p className="payment-note">
                        This is a demo payment page. No real transaction will occur.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Payment;
