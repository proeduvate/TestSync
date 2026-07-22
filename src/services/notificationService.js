/**
 * Notification Service - High-level orchestrator that maps database events to HTML templates
 * and sends email notifications using emailService.
 */

import supabase from '../lib/supabase';
import { sendEmail } from './emailService';
import * as templates from '../templates/emailTemplates';

// ============ DB Helpers ============

/**
 * Fetch all admin emails from profiles
 */
const getAdminEmails = async () => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('role', 'admin');
        
        if (error) throw error;
        return data.map(admin => admin.email).filter(Boolean);
    } catch (err) {
        console.error('[NotificationService] Failed to fetch admin emails:', err.message);
        return [];
    }
};

/**
 * Fetch a single user profile by ID
 */
const getUserProfile = async (userId) => {
    if (!userId) return null;
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        return data;
    } catch (err) {
        console.error(`[NotificationService] Failed to fetch profile for ID ${userId}:`, err.message);
        return null;
    }
};

// ============ Service Methods ============

export const notificationService = {
    // ============ USER MANAGEMENT ============

    /**
     * Send welcome email to user
     */
    sendWelcomeEmail: async (email, name, role) => {
        const subject = 'Welcome to ProEduvate TestSync! 🎉';
        const html = templates.welcomeEmail(name, role);
        return await sendEmail(email, subject, html);
    },

    /**
     * Send new user registration alert to Admins
     */
    sendNewUserRegistrationAlertToAdmin: async (userName, userRole) => {
        const adminEmails = await getAdminEmails();
        if (adminEmails.length === 0) return { success: false, error: 'No admin emails found' };

        const subject = `[Admin Alert] New User Registration Request: ${userName}`;
        const html = `
            <h2>New Registration Request 👤</h2>
            <p>A new user has registered on the platform and is pending approval.</p>
            <ul>
                <li><strong>Name:</strong> ${userName}</li>
                <li><strong>Role:</strong> ${userRole}</li>
                <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
            </ul>
            <p>Please log in to review their profile and approve/reject access.</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="https://proeduvate.com/admin/requests" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Review Application</a>
            </div>
        `;

        const results = await Promise.allSettled(
            adminEmails.map(email => sendEmail(email, subject, html))
        );
        return { success: true, results };
    },

    /**
     * Send account approval email
     */
    sendAccountApprovedEmail: async (email, name, role) => {
        const subject = 'Your ProEduvate Account has been Approved! 🎉';
        const html = templates.accountApproved(name, role);
        return await sendEmail(email, subject, html);
    },

    /**
     * Send account rejection email
     */
    sendAccountRejectedEmail: async (email, name, reason) => {
        const subject = 'Update on your ProEduvate Registration Status';
        const html = templates.accountRejected(name, reason);
        return await sendEmail(email, subject, html);
    },

    /**
     * Send password reset email
     */
    sendPasswordResetEmail: async (email, name, resetLink) => {
        const subject = 'Reset Your ProEduvate Password 🔑';
        const html = templates.passwordReset(name, resetLink);
        return await sendEmail(email, subject, html);
    },

    /**
     * Send first-time login alert email to Admin
     */
    sendLoginAlertEmailToAdmin: async (userName, userRole) => {
        const adminEmails = await getAdminEmails();
        if (adminEmails.length === 0) return { success: false, error: 'No admin emails found' };

        const subject = `[Admin Security] First-Time Login Alert: ${userName}`;
        const html = `
            <h2>First-Time Login Alert 🛡️</h2>
            <p>User <strong>${userName}</strong> (${userRole}) has successfully logged in for the first time.</p>
            <ul>
                <li><strong>User Name:</strong> ${userName}</li>
                <li><strong>Role:</strong> ${userRole}</li>
                <li><strong>Login Time:</strong> ${new Date().toLocaleString()}</li>
            </ul>
            <p>No action is required. This is a security notification.</p>
        `;

        const results = await Promise.allSettled(
            adminEmails.map(email => sendEmail(email, subject, html))
        );
        return { success: true, results };
    },


    // ============ TASK MANAGEMENT ============

    /**
     * Send email to Developer (and Tester) when a task is assigned
     */
    sendTaskAssignedEmail: async (developerId, testerId, taskName, deadline, budget) => {
        const developer = await getUserProfile(developerId);
        const tester = await getUserProfile(testerId);

        const results = [];

        if (developer) {
            const devSubject = `Tester Assigned to "${taskName}" 🧪`;
            const devHtml = templates.taskAssigned(taskName, tester?.name || 'A Tester', deadline, budget, 'developer');
            const devRes = await sendEmail(developer.email, devSubject, devHtml);
            results.push({ role: 'developer', ...devRes });
        }

        if (tester) {
            const testerSubject = `New Task Assignment: "${taskName}" 📝`;
            const testerHtml = templates.taskAssigned(taskName, tester.name, deadline, budget, 'tester');
            const testerRes = await sendEmail(tester.email, testerSubject, testerHtml);
            results.push({ role: 'tester', ...testerRes });
        }

        return { success: true, results };
    },

    /**
     * Send email when task details are updated
     */
    sendTaskDetailsUpdatedEmail: async (taskName, developerId, testerIds = []) => {
        const developer = await getUserProfile(developerId);
        const subject = `[Update] Task details updated for "${taskName}" 🔄`;
        const html = `
            <h2>Task Details Updated 🔄</h2>
            <p>Please note that details for the task <strong>"${taskName}"</strong> have been updated by the owner.</p>
            <p>Kindly review the new requirements, deadlines, or testing parameters on the platform.</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="https://proeduvate.com/login" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Task Details</a>
            </div>
        `;

        const emailsToSend = [];
        if (developer) emailsToSend.push(developer.email);

        // Fetch emails of all testers assigned
        if (testerIds.length > 0) {
            const { data: testers } = await supabase
                .from('profiles')
                .select('email')
                .in('id', testerIds);
            
            if (testers) {
                testers.forEach(t => emailsToSend.push(t.email));
            }
        }

        const uniqueEmails = [...new Set(emailsToSend)].filter(Boolean);
        const results = await Promise.allSettled(
            uniqueEmails.map(email => sendEmail(email, subject, html))
        );

        return { success: true, results };
    },

    /**
     * Send email to Developer and Admin when task feedback/proof is submitted
     */
    sendTaskSubmittedEmail: async (developerId, testerName, taskName, submissionDate) => {
        const developer = await getUserProfile(developerId);
        const adminEmails = await getAdminEmails();

        const results = [];

        // 1. Email Developer
        if (developer) {
            const devSubject = `New Test Feedback Submitted for "${taskName}" 📝`;
            const devHtml = templates.taskSubmitted(taskName, testerName, submissionDate, 'developer');
            const devRes = await sendEmail(developer.email, devSubject, devHtml);
            results.push({ role: 'developer', ...devRes });
        }

        // 2. Email Admins
        if (adminEmails.length > 0) {
            const adminSubject = `[Admin Notification] Feedback Submitted for "${taskName}"`;
            const adminHtml = `
                <h2>Feedback Submitted for Review ⚖️</h2>
                <p>Tester <strong>${testerName}</strong> has submitted feedback for the task <strong>"${taskName}"</strong>.</p>
                <p>This submission is now pending developer and/or admin verification.</p>
            `;
            const adminResults = await Promise.allSettled(
                adminEmails.map(email => sendEmail(email, adminSubject, adminHtml))
            );
            results.push({ role: 'admin', adminResults });
        }

        return { success: true, results };
    },

    /**
     * Send confirmation email to Tester upon task submission
     */
    sendTaskSubmissionConfirmation: async (testerEmail, testerName, taskName, submissionDate) => {
        const subject = `Submission Confirmed: "${taskName}" ✅`;
        const html = templates.taskSubmitted(taskName, testerName, submissionDate, 'tester');
        return await sendEmail(testerEmail, subject, html);
    },

    /**
     * Send email to Admin when task status changes
     */
    sendTaskStatusChangeEmail: async (developerId, taskName, oldStatus, newStatus) => {
        const adminEmails = await getAdminEmails();
        if (adminEmails.length === 0) return { success: false, error: 'No admin emails found' };

        const subject = `[Admin Alert] Task Status Change: "${taskName}"`;
        const html = templates.projectStatusUpdate(taskName, oldStatus, newStatus, 'admin');

        const results = await Promise.allSettled(
            adminEmails.map(email => sendEmail(email, subject, html))
        );
        return { success: true, results };
    },

    /**
     * Send email to Admin and Developer when task is completed
     */
    sendTaskCompletedEmail: async (developerId, testerId, taskName, credits) => {
        const developer = await getUserProfile(developerId);
        const tester = await getUserProfile(testerId);
        const adminEmails = await getAdminEmails();

        const results = [];

        // 1. Email Developer
        if (developer) {
            const devSubject = `Task Completed: "${taskName}" 🎉`;
            const devHtml = templates.taskCompleted(taskName, credits, 'developer');
            const devRes = await sendEmail(developer.email, devSubject, devHtml);
            results.push({ recipient: 'developer', ...devRes });
        }

        // 2. Email Tester
        if (tester) {
            const testerSubject = `Credits Released! Task Completed: "${taskName}" 💰`;
            const testerHtml = templates.taskCompleted(taskName, credits, 'tester');
            const testerRes = await sendEmail(tester.email, testerSubject, testerHtml);
            results.push({ recipient: 'tester', ...testerRes });
        }

        // 3. Email Admins
        if (adminEmails.length > 0) {
            const adminSubject = `[Task Completed] "${taskName}" has been finalized`;
            const adminHtml = `
                <h2>Task Completed 🎉</h2>
                <p>The task <strong>"${taskName}"</strong> is completed, and ${credits} credits have been released successfully.</p>
            `;
            const adminRes = await Promise.allSettled(
                adminEmails.map(email => sendEmail(email, adminSubject, adminHtml))
            );
            results.push({ recipient: 'admin', adminRes });
        }

        return { success: true, results };
    },

    /**
     * Send email to Admin, Developer and Tester when task feedback is rejected and returned for rework
     */
    sendTaskReworkRejectedEmail: async (developerId, testerId, taskName, feedbackComment) => {
        const developer = await getUserProfile(developerId);
        const tester = await getUserProfile(testerId);
        const adminEmails = await getAdminEmails();

        const subject = `Revision Request / Rework Required: "${taskName}" 📝`;
        const html = `
            <h2>Rework Required for "${taskName}" 📝</h2>
            <p>The submission for the task has been returned for rework with developer notes.</p>
            <div class="details-box">
                <div class="details-row">
                    <div class="details-label">Task Name</div>
                    <div class="details-value">${taskName}</div>
                </div>
                <div class="details-row">
                    <div class="details-label">Developer Comments</div>
                    <div class="details-value" style="color: #d97706;">${feedbackComment || 'No comments provided.'}</div>
                </div>
            </div>
            <p>Please review and submit revised feedback proof on the dashboard.</p>
        `;

        const emails = [];
        if (developer) emails.push(developer.email);
        if (tester) emails.push(tester.email);
        adminEmails.forEach(email => emails.push(email));

        const uniqueEmails = [...new Set(emails)].filter(Boolean);
        const results = await Promise.allSettled(
            uniqueEmails.map(email => sendEmail(email, subject, html))
        );

        return { success: true, results };
    },


    // ============ PAYMENT MANAGEMENT ============

    /**
     * Send payment success email to User/Developer
     */
    sendPaymentSuccessEmail: async (developerId, amount, invoiceNo, taskName) => {
        const developer = await getUserProfile(developerId);
        if (!developer) return { success: false, error: 'Developer not found' };

        const subject = `Payment Successful: Invoice #${invoiceNo} 💳`;
        const html = templates.paymentSuccess(developer.name, amount, invoiceNo, taskName);
        return await sendEmail(developer.email, subject, html);
    },

    /**
     * Send payment received notification to Admin
     */
    sendPaymentReceivedNotificationToAdmin: async (developerName, amount, taskName) => {
        const adminEmails = await getAdminEmails();
        if (adminEmails.length === 0) return { success: false, error: 'No admin emails found' };

        const subject = `[Payment Received] ${amount} Credits for "${taskName}"`;
        const html = `
            <h2>Payment Confirmed 💰</h2>
            <p>Developer <strong>${developerName}</strong> has deposited <strong>${amount} Credits</strong> for task <strong>"${taskName}"</strong>.</p>
            <p>The system has updated developer credits and published the task live.</p>
        `;

        const results = await Promise.allSettled(
            adminEmails.map(email => sendEmail(email, subject, html))
        );
        return { success: true, results };
    },

    /**
     * Send payment failure email to User
     */
    sendPaymentFailureEmail: async (developerId, amount, errorMsg) => {
        const developer = await getUserProfile(developerId);
        if (!developer) return { success: false, error: 'Developer not found' };

        const subject = `Payment Transaction Failed ❌`;
        const html = templates.paymentFailure(developer.name, amount, errorMsg);
        return await sendEmail(developer.email, subject, html);
    },

    /**
     * Send invoice/receipt email after successful payment
     */
    sendInvoiceReceiptEmail: async (developerId, amount, invoiceNo, taskName, date = new Date().toLocaleDateString()) => {
        const developer = await getUserProfile(developerId);
        if (!developer) return { success: false, error: 'Developer not found' };

        const subject = `Invoice / Payment Receipt for "${taskName}"`;
        const html = templates.paymentSuccess(developer.name, amount, invoiceNo, taskName);
        return await sendEmail(developer.email, subject, html);
    },


    // ============ PROJECT MANAGEMENT ============

    /**
     * Send notification to Admin when a new project is created
     */
    sendNewProjectCreatedAlertToAdmin: async (developerName, projectName) => {
        const adminEmails = await getAdminEmails();
        if (adminEmails.length === 0) return { success: false, error: 'No admin emails found' };

        const subject = `[Admin Notification] New Project Created: "${projectName}"`;
        const html = `
            <h2>New Project Posted 🚀</h2>
            <p>Developer <strong>${developerName}</strong> has posted a new project: <strong>"${projectName}"</strong>.</p>
            <p>The project is now active and listed in the marketplace.</p>
        `;

        const results = await Promise.allSettled(
            adminEmails.map(email => sendEmail(email, subject, html))
        );
        return { success: true, results };
    },

    /**
     * Send notification to assigned Developer when added to a project
     */
    sendDeveloperAddedToProjectEmail: async (developerId, projectName) => {
        const developer = await getUserProfile(developerId);
        if (!developer) return { success: false, error: 'Developer not found' };

        const subject = `Project Online: "${projectName}" 🚀`;
        const html = `
            <h2>Project Created Successfully 🚀</h2>
            <p>Hello ${developer.name}, your project <strong>"${projectName}"</strong> has been successfully set up and is now online in the tester marketplace.</p>
            <p>We'll notify you as soon as testers start applying to test your application.</p>
        `;
        return await sendEmail(developer.email, subject, html);
    },

    /**
     * Check active projects and send approaching deadline notifications
     */
    sendProjectDeadlineApproachingEmail: async (developerId, testerIds = [], projectName, daysLeft) => {
        const developer = await getUserProfile(developerId);
        const subject = `[Alert] Project Deadline Approaching: "${projectName}" ⏰`;
        const html = `
            <h2>Deadline Approaching in ${daysLeft} Days! ⏰</h2>
            <p>This is an automated reminder that the deadline for <strong>"${projectName}"</strong> is approaching soon (in ${daysLeft} days).</p>
            <p>Please make sure all test feedback and reports are submitted and verified on time.</p>
        `;

        const emailsToSend = [];
        if (developer) emailsToSend.push(developer.email);

        if (testerIds.length > 0) {
            const { data: testers } = await supabase
                .from('profiles')
                .select('email')
                .in('id', testerIds);
            if (testers) {
                testers.forEach(t => emailsToSend.push(t.email));
            }
        }

        const uniqueEmails = [...new Set(emailsToSend)].filter(Boolean);
        const results = await Promise.allSettled(
            uniqueEmails.map(email => sendEmail(email, subject, html))
        );

        return { success: true, results };
    },

    /**
     * Send notification when project status changes
     */
    sendProjectStatusChangeEmail: async (developerId, testerIds = [], projectName, oldStatus, newStatus) => {
        const developer = await getUserProfile(developerId);
        const subject = `[Status Update] Project "${projectName}" status is now ${newStatus} 🔄`;
        const html = templates.projectStatusUpdate(projectName, oldStatus, newStatus, 'developer');

        const emailsToSend = [];
        if (developer) emailsToSend.push(developer.email);

        if (testerIds.length > 0) {
            const { data: testers } = await supabase
                .from('profiles')
                .select('email')
                .in('id', testerIds);
            if (testers) {
                testers.forEach(t => emailsToSend.push(t.email));
            }
        }

        const uniqueEmails = [...new Set(emailsToSend)].filter(Boolean);
        const results = await Promise.allSettled(
            uniqueEmails.map(email => sendEmail(email, subject, html))
        );

        return { success: true, results };
    },

    // ============ GENERAL ADMIN EVENTS ============
    
    /**
     * Send email alert to admin when a user reports an issue
     */
    sendUserReportedIssueAlertToAdmin: async (userName, ticketSubject, category) => {
        const adminEmails = await getAdminEmails();
        if (adminEmails.length === 0) return { success: false, error: 'No admin emails found' };

        const subject = `[Admin Alert] User Support Issue: "${ticketSubject}"`;
        const html = `
            <h2>New Support Ticket Submitted 🎟️</h2>
            <p>User <strong>${userName}</strong> has submitted a new support issue.</p>
            <ul>
                <li><strong>Subject:</strong> ${ticketSubject}</li>
                <li><strong>Category:</strong> ${category}</li>
                <li><strong>Submitted At:</strong> ${new Date().toLocaleString()}</li>
            </ul>
            <div style="text-align: center; margin: 32px 0;">
                <a href="https://proeduvate.com/admin/support" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Review Tickets</a>
            </div>
        `;

        const results = await Promise.allSettled(
            adminEmails.map(email => sendEmail(email, subject, html))
        );
        return { success: true, results };
    }
};

export default notificationService;
