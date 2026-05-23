import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './components/common/Toast';

// Landing Page
import LandingPage from './pages/LandingPage';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AuthCallback from './pages/auth/AuthCallback';
import PendingApproval from './pages/auth/PendingApproval';

// Developer Pages
import DeveloperDashboard from './pages/developer/DeveloperDashboard';
import CreateTask from './pages/developer/CreateTask';
import Payment from './pages/developer/Payment';
import FeedbackReview from './pages/developer/FeedbackReview';
import Tasks from './pages/developer/Tasks';
import Reports from './pages/developer/Reports';

// Tester Pages
import TesterDashboard from './pages/tester/TesterDashboard';
import Marketplace from './pages/tester/Marketplace';
import SubmitFeedback from './pages/tester/SubmitFeedback';
import MyTasks from './pages/tester/MyTasks';
import Wallet from './pages/tester/Wallet';
import Status from './pages/tester/Status';
import TaskDetails from './pages/tester/TaskDetails';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminTasks from './pages/admin/AdminTasks';
import Verification from './pages/admin/Verification';
import UserRequests from './pages/admin/UserRequests';
import UserRequestDetails from './pages/admin/UserRequestDetails';
import SupportTickets from './pages/admin/SupportTickets';
import AdminUserProfile from './pages/admin/AdminUserProfile';
import Profile from './pages/profile/Profile';

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <NotificationProvider>
                    <Routes>
                        {/* Public Auth Routes */}
                        <Route element={<AuthLayout />}>
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/auth/callback" element={<AuthCallback />} />
                            <Route path="/pending-approval" element={<PendingApproval />} />
                        </Route>

                        {/* Developer Routes */}
                        <Route path="/developer" element={<DashboardLayout />}>
                            <Route path="dashboard" element={<DeveloperDashboard />} />
                            <Route path="create-task" element={<CreateTask />} />
                            <Route path="tasks" element={<Tasks />} />
                            <Route path="feedback" element={<FeedbackReview />} />
                            <Route path="payments" element={<Payment />} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="profile" element={<Profile />} />
                            <Route index element={<Navigate to="dashboard" replace />} />
                        </Route>

                        {/* Tester Routes */}
                        <Route path="/tester" element={<DashboardLayout />}>
                            <Route path="dashboard" element={<TesterDashboard />} />
                            <Route path="marketplace" element={<Marketplace />} />
                            <Route path="task/:taskId" element={<TaskDetails />} />
                            <Route path="my-tasks" element={<MyTasks />} />
                            <Route path="submit-proof" element={<MyTasks />} />
                            <Route path="submit/:taskId" element={<SubmitFeedback />} />
                            <Route path="wallet" element={<Wallet />} />
                            <Route path="status" element={<Status />} />
                            <Route path="profile" element={<Profile />} />
                            <Route index element={<Navigate to="dashboard" replace />} />
                        </Route>

                        {/* Admin Routes */}
                        <Route path="/admin" element={<DashboardLayout />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="requests" element={<UserRequests />} />
                            <Route path="requests/:userId" element={<UserRequestDetails />} />
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="users" element={<UserManagement />} />
                            <Route path="users/:userId" element={<AdminUserProfile />} />
                            <Route path="tasks" element={<AdminTasks />} />
                            <Route path="verification" element={<Verification />} />
                            <Route path="support" element={<SupportTickets />} />
                            <Route path="credits" element={<AdminDashboard />} />
                            <Route path="profile" element={<Profile />} />
                        </Route>

                        {/* Landing Page */}
                        <Route path="/" element={<LandingPage />} />

                        {/* Catch-all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </NotificationProvider>
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;
