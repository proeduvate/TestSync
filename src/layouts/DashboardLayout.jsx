import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Loader from '../components/common/Loader';
import './DashboardLayout.css';

function DashboardLayout() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (isLoading) {
        return <Loader fullScreen text="Loading..." />;
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (user.status === 'pending' && user.role !== 'admin') {
        return <Navigate to="/pending-approval" replace />;
    }

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
            <div className="dashboard-main">
                <Navbar onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;
