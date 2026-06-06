import { useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../../lib/supabase';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import { FiMail, FiArrowLeft, FiZap } from 'react-icons/fi';
import '../auth.css';

function ForgotPassword() {
    const toast = useToast();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Error', 'Please enter your email address.');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Check if user exists in our profiles
            const { data: profile, error: profileErr } = await supabase
                .from('profiles')
                .select('name')
                .eq('email', email)
                .maybeSingle();

            if (profileErr) throw profileErr;
            if (!profile) {
                // To avoid email enumeration, we pretend it's sent, but log a warning.
                console.warn(`[ForgotPassword] Password reset requested for non-existent email: ${email}`);
                setEmailSent(true);
                setIsLoading(false);
                return;
            }

            // 2. Trigger Supabase auth reset link (optional but good practice)
            const resetLink = `${window.location.origin}/auth/callback?type=recovery`;
            await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: resetLink
            });

            // 3. Send custom styled HTML email via our SMTP Edge Function
            await notificationService.sendPasswordResetEmail(email, profile.name || 'User', resetLink);

            setEmailSent(true);
            toast.success('Reset Link Sent', 'Please check your inbox for instructions to reset your password.');
        } catch (err) {
            console.error('Password reset request failed:', err);
            toast.error('Request Failed', err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="auth-form success-state">
                <div className="auth-logo-icon success">
                    <FiMail size={48} />
                </div>
                <h2>Check your email</h2>
                <p>We've sent a password reset link to <strong>{email}</strong>.</p>
                <p className="subtext">Please click the link in the email to reset your password and secure your account.</p>
                <div style={{ marginTop: '2rem' }}>
                    <Link to="/login">
                        <Button variant="primary" fullWidth>Back to Login</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-form">
            <Link to="/" className="auth-mobile-logo">
                <div className="auth-logo-icon">
                    <FiZap size={24} />
                </div>
                <span className="auth-logo-text">TestFlow</span>
            </Link>

            <div className="auth-form-header">
                <h2>Forgot password?</h2>
                <p>Enter your email and we'll send you a link to reset your password</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form-body">
                <div className="form-group">
                    <label className="form-label" htmlFor="email">Email address</label>
                    <div className="input-with-icon">
                        <FiMail className="input-icon" size={18} />
                        <input
                            type="email"
                            id="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                >
                    Send reset link
                </Button>
            </form>

            <div className="auth-form-footer">
                <p>
                    <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiArrowLeft /> Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;
