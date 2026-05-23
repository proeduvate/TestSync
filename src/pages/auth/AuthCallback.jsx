import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

function AuthCallback() {
    const navigate = useNavigate();
    const { user, loginInProgressRef } = useAuth();

    useEffect(() => {
        const handleAuthCallback = async () => {
            console.log('AuthCallback: Processing redirect...');
            
            // Wait for Supabase to process the URL fragment/codes
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('AuthCallback Error:', error.message);
                navigate('/login');
                return;
            }

            if (session) {
                console.log('AuthCallback: Session found, waiting for profile...');
                // The AuthContext onAuthStateChange will pick up the session 
                // and fetch the profile. We just need to wait for it.
            } else {
                console.warn('AuthCallback: No session found, redirecting to login');
                navigate('/login');
            }
        };

        handleAuthCallback();
    }, [navigate]);

    // Use a second effect to monitor when the user profile is loaded by AuthContext
    useEffect(() => {
        if (user) {
            console.log('AuthCallback: User profile loaded, redirecting to dashboard');
            if (user.status === 'pending' && user.role !== 'admin') {
                navigate('/pending-approval');
            } else {
                navigate(`/${user.role}/dashboard`);
            }
        }
    }, [user, navigate]);

    return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#0a0a0b',
            color: 'white',
            fontFamily: 'system-ui'
        }}>
            <div className="loading-spinner" style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
            }} />
            <p>Completing secure sign-in...</p>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default AuthCallback;
