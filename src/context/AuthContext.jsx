import { createContext, useContext, useState, useEffect, useRef } from 'react';
import supabase from '../lib/supabase';
import { notificationsAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Track whether login/signup is in progress to avoid onAuthStateChange races
    const loginInProgressRef = useRef(false);

    // Fetch profile data from profiles table with a timeout
    const fetchProfile = async (authUser) => {
        if (!authUser) return null;
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), 4000)
        );

        try {
            console.debug('[Auth] fetchProfile: Fetching profile for', authUser.id);
            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

            if (error) {
                console.error('[Auth] Error fetching profile:', error.message);
                return null;
            }
            return data;
        } catch (e) {
            console.error('[Auth] fetchProfile exception:', e.message || e);
            return null;
        }
    };

    // On mount, check for existing Supabase session
    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            console.debug('[Auth] Initializing auth state...');
            try {
                // 1. Try to get current session
                const { data, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('[Auth] getSession error:', error.message);
                }

                const session = data?.session;
                console.debug('[Auth] Session retrieval complete:', !!session);

                if (session?.user && isMounted) {
                    console.debug('[Auth] User found in session, fetching profile...');
                    const profile = await fetchProfile(session.user);
                    if (profile && isMounted) {
                        setUser(profile);
                        setIsAuthenticated(true);
                        console.debug('[Auth] Profile loaded successfully');
                    } else {
                        console.warn('[Auth] No profile found for session user');
                    }
                }
            } catch (e) {
                console.error('[Auth] Init exception:', e);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    console.debug('[Auth] Initialization finished, loading set to false');
                }
            }
        };

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                // Skip if login/signup is being handled directly
                if (loginInProgressRef.current) return;

                console.debug('[Auth] State change event:', event, 'Session active:', !!session);

                if (session?.user) {
                    const profile = await fetchProfile(session.user);
                    if (isMounted) {
                        if (profile) {
                            setUser(profile);
                            setIsAuthenticated(true);
                        } else {
                            // If profile fetch failed but session exists, 
                            // we might still want to end loading
                            console.warn('[Auth] Session exists but profile fetch failed');
                        }
                        setIsLoading(false);
                    }
                } else {
                    // No session
                    if (isMounted) {
                        setUser(null);
                        setIsAuthenticated(false);
                        setIsLoading(false);
                    }
                }
            }
        );

        initAuth();

        // Safety timeout to ensure loading eventually stops
        const safetyTimeout = setTimeout(() => {
            if (isMounted) {
                setIsLoading(currentLoading => {
                    if (currentLoading) {
                        console.warn('[Auth] Safety timeout triggered: forcing isLoading=false after 5s');
                    }
                    return false;
                });
            }
        }, 5000);

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    const login = async (email, password) => {
        loginInProgressRef.current = true;
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.message.includes('Email not confirmed')) {
                    throw new Error('Please verify your email address. Check your inbox for a confirmation link.');
                }
                throw new Error(error.message);
            }

            // Check if email is confirmed in auth user (even if error didn't trigger)
            if (!data.user.email_confirmed_at) {
                await supabase.auth.signOut();
                throw new Error('Please verify your email address. Check your inbox for a confirmation link.');
            }

            const profile = await fetchProfile(data.user);
            if (!profile) throw new Error('Profile not found. Please contact support.');

            if (profile.status === 'suspended') {
                await supabase.auth.signOut();
                throw new Error('Your account has been suspended. Please contact support.');
            }

            // We allow login for 'pending' status users so they can see the Pending Approval page
            // The redirection logic will be handled in Login.jsx or DashboardLayout.jsx

            setUser(profile);
            setIsAuthenticated(true);
            return profile;
        } catch (err) {
            throw err;
        } finally {
            setIsLoading(false);
            loginInProgressRef.current = false;
        }
    };

    const loginWithGoogle = async (role = 'tester') => {
        loginInProgressRef.current = true;
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        role: role
                    }
                }
            });

            if (error) throw error;
        } catch (err) {
            console.error('Google Login Error:', err.message);
            throw err;
        } finally {
            loginInProgressRef.current = false;
        }
    };

    const signup = async (userData) => {
        loginInProgressRef.current = true;
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        name: userData.name,
                        role: userData.role || 'tester',
                        company: userData.company || '',
                    },
                },
            });

            if (error) throw new Error(error.message);

            // If confirmation is required, the user will be created but not have a session necessarily
            // We check if a session was returned
            if (!data.session) {
                return { needsVerification: true };
            }

            // Wait a moment for the trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 1000));

            const profile = await fetchProfile(data.user);
            if (profile) {
                // Update profile with company if provided and ensure status is pending
                const updates = { status: 'pending' };
                if (userData.company) updates.company = userData.company;
                
                await supabase.from('profiles').update(updates).eq('id', data.user.id);
                profile.status = 'pending';
                if (userData.company) profile.company = userData.company;
                
                // Notify all admins about new user request
                try {
                    await notificationsAPI.notifyAdmins({
                        title: 'New User Request 👤',
                        message: `${userData.name} has registered as a ${userData.role} and is pending approval.`,
                        type: 'info',
                        link: '/admin/requests'
                    });
                } catch (nError) {
                    console.error('Failed to notify admins of new user signup:', nError);
                }

                setUser(profile);
                setIsAuthenticated(true);
            }

            return profile || { ...data.user, role: userData.role };
        } catch (err) {
            throw err;
        } finally {
            setIsLoading(false);
            loginInProgressRef.current = false;
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error('Logout error:', e);
        }
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (updates) => {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
    };

    const value = {
        user,
        isLoading,
        isAuthenticated,
        login,
        loginWithGoogle,
        signup,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// No default export to avoid Vite HMR conflicts with multiple component exports
