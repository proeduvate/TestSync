import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import { FiMail, FiLock, FiEye, FiEyeOff, FiZap } from 'react-icons/fi';
import '../auth.css';

function Login() {
    const navigate = useNavigate();
    const { login, loginWithGoogle, logout } = useAuth();
    const toast = useToast();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'developer',
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const roles = [
        { id: 'developer', label: 'Developer', icon: '👨‍💻' },
        { id: 'tester', label: 'Tester', icon: '🧪' },
        { id: 'admin', label: 'Admin', icon: '🛡️' },
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            const userData = await login(formData.email, formData.password);
            
            if (userData.role && userData.role.toLowerCase() !== formData.role.toLowerCase()) {
                await logout();
                throw new Error('Role mismatch');
            }

            toast.success('Login Successful', `Welcome back, ${userData.name || userData.email}!`);
            if (userData.status === 'pending' && userData.role !== 'admin') {
                navigate('/pending-approval');
            } else {
                navigate(`/${userData.role}/dashboard`);
            }
        } catch (error) {
            const msg = error.message || 'Invalid credentials. Please try again.';
            // Distinguish between wrong credentials and other errors
            if (
                msg.toLowerCase().includes('invalid') ||
                msg.toLowerCase().includes('credentials') ||
                msg.toLowerCase().includes('password') ||
                msg.toLowerCase().includes('user not found')
            ) {
                toast.error('Login Failed', 'Invalid email or password. Please try again.');
            } else {
                toast.error('Login Failed', msg);
            }
            setErrors({ submit: msg });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-form">
            <Link to="/" className="auth-mobile-logo">
                <div className="auth-logo-icon">
                    <FiZap size={24} />
                </div>
                <span className="auth-logo-text">TestFlow</span>
            </Link>

            <div className="auth-form-header">
                <h2>Welcome back</h2>
                <p>Sign in to continue to your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form-body">
                {/* Role Selector */}
                <div className="form-group">
                    <label className="form-label">Select your role</label>
                    <div className="role-tabs">
                        {roles.map(role => (
                            <label key={role.id} className="role-tab">
                                <input
                                    type="radio"
                                    name="role"
                                    value={role.id}
                                    checked={formData.role === role.id}
                                    onChange={handleChange}
                                />
                                <div className="role-tab-content">
                                    <span className="role-tab-icon">{role.icon}</span>
                                    <span>{role.label}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Email */}
                <div className="form-group">
                    <label className="form-label" htmlFor="email">Email address</label>
                    <div className="input-with-icon">
                        <FiMail className="input-icon" size={18} />
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    {errors.email && <p className="form-error">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="form-group">
                    <label className="form-label" htmlFor="password">Password</label>
                    <div className="input-with-icon">
                        <FiLock className="input-icon" size={18} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            className={`form-input ${errors.password ? 'error' : ''}`}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                    </div>
                    {errors.password && <p className="form-error">{errors.password}</p>}
                </div>

                {/* Remember & Forgot */}
                <div className="auth-options">
                    <label className="form-checkbox">
                        <input type="checkbox" />
                        <span>Remember me</span>
                    </label>
                    <Link to="/forgot-password">Forgot password?</Link>
                </div>

                {errors.submit && (
                    <div className="form-error-banner" role="alert">
                        {errors.submit}
                    </div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                >
                    Sign in
                </Button>

                <div className="auth-separator">
                    <span>OR</span>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={() => loginWithGoogle(formData.role)}
                    className="google-btn"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" height="18" />
                    Continue with Google
                </Button>
            </form>

            <div className="auth-form-footer">
                <p>
                    Don't have an account? <Link to="/signup">Create one</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
