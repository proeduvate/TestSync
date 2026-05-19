import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import { FiZap } from 'react-icons/fi';
import { useEffect } from 'react';
import './AuthLayout.css';

function AuthLayout() {
    const { isLoading, isAuthenticated, user } = useAuth();

    useEffect(() => {
        // Force dark theme for auth pages
        const originalTheme = document.documentElement.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', 'dark');
        
        return () => {
            if (originalTheme) {
                document.documentElement.setAttribute('data-theme', originalTheme);
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        };
    }, []);

    if (isLoading) {
        console.debug('[AuthLayout] Rendering loader (isLoading=true)');
        return <Loader fullScreen text="Loading..." />;
    }

    return (
        <div className="auth-split-layout">
            <div className="auth-brand-panel">
                <div className="auth-brand-content">
                    <Link to="/" className="auth-logo" style={{ marginBottom: 'var(--space-8)' }}>
                        <div className="auth-logo-icon">
                            <FiZap size={32} />
                        </div>
                        <span className="auth-logo-text">TestFlow</span>
                    </Link>

                    <div className="auth-brand-hero">
                        <h1 className="auth-hero-title">
                            Software Testing,<br />
                            <span className="gradient-text">Made Simple.</span>
                        </h1>
                        <p className="auth-hero-text">
                            Connect with professional testers, get comprehensive feedback,
                            and ship quality software faster than ever.
                        </p>
                    </div>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-container">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default AuthLayout;
