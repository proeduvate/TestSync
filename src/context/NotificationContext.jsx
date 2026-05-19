import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from '../components/common/Toast';
import { notificationsAPI } from '../services/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const { user, isAuthenticated } = useAuth();
    const { info } = useToast();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated || !user) return;
        
        setIsLoading(true);
        try {
            const { notifications: data } = await notificationsAPI.list();
            setNotifications(data);
            setUnreadCount(data.filter(n => n.unread).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user]);

    // Mark as read
    const markAsRead = async (id) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, unread: false } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Initialize and Real-time subscription
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        fetchNotifications();

        // Subscribe to real-time notifications
        const channel = supabase
            .channel(`notifications:user_id=eq.${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotification = {
                        id: payload.new.id,
                        title: payload.new.title,
                        message: payload.new.message,
                        type: payload.new.type,
                        unread: !payload.new.is_read,
                        time: payload.new.created_at,
                        link: payload.new.link
                    };
                    
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    
                    // Show toast alert
                    info(newNotification.title, newNotification.message);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated, user, fetchNotifications, info]);

    const value = {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

// No default export to avoid Vite HMR conflicts with multiple component exports
