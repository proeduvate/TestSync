// API Service Layer — Supabase client for backend communication
import supabase from '../lib/supabase';
import { notificationService } from './notificationService';

// ============ Auth API ============
// Auth is handled directly via supabase.auth in AuthContext
// These are kept as thin wrappers for any component that imports authAPI directly
export const authAPI = {
    register: async (userData) => {
        const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    name: userData.name,
                    role: userData.role || 'developer',
                    company: userData.company || '',
                },
            },
        });
        if (error) throw new Error(error.message);
        return { user: data.user, session: data.session };
    },

    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw new Error(error.message);
        return { user: data.user, session: data.session };
    },

    getMe: async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw new Error(error.message);
        if (!user) throw new Error('Not authenticated');

        // Get profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        if (profileError) throw new Error(profileError.message);
        return { user: profile };
    },

    updatePassword: async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw new Error(error.message);
        return { success: true };
    },
};

// ============ Tasks API ============
export const tasksAPI = {
    list: async (params = {}) => {
        let query = supabase.from('tasks').select('*, profiles!tasks_developer_id_fkey(name, email, company)');

        if (params.status && params.status !== 'all') {
            query = query.eq('status', params.status);
        }
        if (params.search) {
            query = query.ilike('app_name', `%${params.search}%`);
        }

        // Automatically filter by developer_id for developers to enforce privacy
        const { data: { user } } = await supabase.auth.getUser();
        let userRole = '';
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            userRole = (profile?.role || '').toLowerCase();
            if (userRole === 'developer') {
                query = query.eq('developer_id', user.id);
            }
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw new Error(error.message);

        // Get assigned testers for each task
        const taskIds = data.map(t => t.id);
        let testerData = [];
        if (taskIds.length > 0) {
            const { data: td } = await supabase
                .from('task_testers')
                .select('task_id, tester_id, profiles(name, email)')
                .in('task_id', taskIds);
            testerData = td || [];
        }

        // Map testers to tasks and format
        const tasks = data.map(task => {
            const dev = task.profiles || {};
            const assignedTesters = (testerData || []).filter(tt => tt.task_id === task.id).map(tt => {
                if (userRole === 'developer') {
                    return { ...tt.profiles, id: tt.tester_id, name: `Tester-${tt.tester_id.substring(0, 8)}`, email: 'Hidden' };
                }
                return { ...tt.profiles, id: tt.tester_id };
            });
            return {
                _id: task.id,
                id: task.id,
                appName: task.app_name,
                appUrl: task.app_url,
                description: task.description,
                testingLevel: task.testing_level,
                testTypes: task.test_types || [],
                budget: task.budget,
                credits: task.credits,
                deadline: task.deadline,
                status: task.status,
                progress: task.progress,
                developer: { name: dev.name, email: dev.email, company: dev.company },
                developerName: task.developer_name,
                developerCompany: task.developer_company,
                assignedTesters: assignedTesters,
                testersAssigned: assignedTesters.length,
                requiredTesters: task.required_testers,
                appliedTesters: task.applied_testers,
                openSlots: Math.max(0, task.required_testers - assignedTesters.length),
                estimatedTime: task.estimated_time,
                createdAt: task.created_at,
                updatedAt: task.updated_at,
            };
        });

        return { tasks };
    },

    getStats: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        const userRole = (profile?.role || '').toLowerCase();

        if (userRole === 'developer') {
            const { data: myTasks } = await supabase
                .from('tasks')
                .select('id, status, budget')
                .eq('developer_id', user.id);

            const tasks = myTasks || [];
            const active = tasks.filter(t => ['open', 'in-progress'].includes(t.status)).length;
            const completed = tasks.filter(t => t.status === 'completed').length;
            const totalBudget = tasks.reduce((sum, t) => sum + (t.budget || 0), 0);

            let feedbackCount = 0;
            if (tasks.length > 0) {
                const { count } = await supabase
                    .from('feedback')
                    .select('*', { count: 'exact', head: true })
                    .in('task_id', tasks.map(t => t.id));
                feedbackCount = count || 0;
            }

            return {
                activeProjects: active,
                completedProjects: completed,
                totalBudgetSpent: totalBudget,
                feedbackReceived: feedbackCount,
                activeProjectsChange: 8.5,
                completedProjectsChange: 12.3,
            };
        } else if (userRole === 'tester') {
            const { count: activeTests } = await supabase
                .from('task_testers')
                .select('*', { count: 'exact', head: true })
                .eq('tester_id', user.id);

            return {
                walletBalance: profile.wallet_balance || 0,
                availableCredits: profile.wallet_balance || 0,
                pendingCredits: profile.pending_credits || 0,
                completedTests: profile.completed_tests || 0,
                completedTasks: profile.completed_tests || 0,
                activeTests: activeTests || 0,
                rating: profile.average_rating || 0,
                reviewCount: profile.total_evaluations || 0,
                totalEarnings: profile.total_earnings || 0,
            };
        } else {
            // Admin stats
            const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: totalDevelopers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'developer');
            const { count: totalTesters } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'tester');
            const { count: activeTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).in('status', ['open', 'in-progress']);
            const { count: completedTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed');
            const { count: pendingVerifications } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending-review');

            // Total budget across all tasks
            const { data: budgetData } = await supabase.from('tasks').select('budget');
            const totalBudget = (budgetData || []).reduce((sum, t) => sum + (t.budget || 0), 0);

            return {
                totalUsers: totalUsers || 0,
                totalDevelopers: totalDevelopers || 0,
                totalTesters: totalTesters || 0,
                activeTasks: activeTasks || 0,
                completedTasks: completedTasks || 0,
                totalCreditsDistributed: totalBudget || 0,
                platformRevenue: (totalBudget || 0) * 0.1,
                pendingVerifications: pendingVerifications || 0,
                disputesPending: 0,
                usersChange: totalUsers > 0 ? 12.5 : 0,
                revenueChange: totalBudget > 0 ? 15.2 : 0,
            };
        }
    },
    
    getDashboardAnalytics: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Fetch my tasks for trend analysis
        const { data: myTasks } = await supabase
            .from('tasks')
            .select('id, created_at, status, budget')
            .eq('developer_id', user.id)
            .order('created_at', { ascending: true });

        const trends = aggregateByMonth(myTasks || [], 'created_at', 'budget');
        const completedTrends = aggregateByMonth((myTasks || []).filter(t => t.status === 'completed'), 'created_at');

        return {
            tasksOverTime: {
                labels: trends.labels,
                datasets: [
                    { 
                        label: 'Tasks Created', 
                        data: trends.counts, 
                        borderColor: '#6366f1', 
                        backgroundColor: 'rgba(99, 102, 241, 0.1)' 
                    },
                    { 
                        label: 'Tasks Completed', 
                        data: completedTrends.counts, 
                        borderColor: '#14b8a6', 
                        backgroundColor: 'rgba(20, 184, 166, 0.1)' 
                    },
                ],
            },
            budgetSpent: {
                labels: trends.labels,
                data: trends.totals
            }
        };
    },

    get: async (id) => {
        const { data: { user } } = await supabase.auth.getUser();
        let query = supabase
            .from('tasks')
            .select('*, profiles!tasks_developer_id_fkey(name, email, company)')
            .eq('id', id);

        let userRole = '';
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            userRole = (profile?.role || '').toLowerCase();
            if (userRole === 'developer') {
                query = query.eq('developer_id', user.id);
            }
        }

        const { data, error } = await query.single();

        if (error) throw new Error(error.message);

        const { data: testerData } = await supabase
            .from('task_testers')
            .select('tester_id, profiles(name, email, average_rating)')
            .eq('task_id', id);

        const dev = data.profiles || {};
        const assignedTesters = (testerData || []).map(tt => {
            if (userRole === 'developer') {
                return { ...tt.profiles, id: tt.tester_id, name: `Tester-${tt.tester_id.substring(0, 8)}`, email: 'Hidden' };
            }
            return { ...tt.profiles, id: tt.tester_id };
        });

        return {
            task: {
                _id: data.id,
                id: data.id,
                appName: data.app_name,
                appUrl: data.app_url,
                description: data.description,
                testingLevel: data.testing_level,
                testTypes: data.test_types || [],
                budget: data.budget,
                credits: data.credits,
                deadline: data.deadline,
                status: data.status,
                progress: data.progress,
                developer: { name: dev.name, email: dev.email, company: dev.company },
                developerName: data.developer_name,
                developerCompany: data.developer_company,
                company: data.developer_company || dev.company || '',
                companyName: data.developer_company || dev.company || '',
                level: data.testing_level ? data.testing_level.charAt(0).toUpperCase() + data.testing_level.slice(1) : '',
                assignedTesters: assignedTesters,
                testersAssigned: assignedTesters.length,
                requiredTesters: data.required_testers,
                appliedTesters: data.applied_testers,
                openSlots: Math.max(0, data.required_testers - assignedTesters.length),
                estimatedTime: data.estimated_time,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                aiSummary: data.ai_summary,
            },
        };
    },

    create: async (taskData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                app_name: taskData.appName,
                app_url: taskData.appUrl,
                description: taskData.description || '',
                testing_level: taskData.testingLevel,
                test_types: taskData.testTypes || [],
                budget: taskData.budget || 0,
                credits: taskData.credits || taskData.budget || 0,
                deadline: taskData.deadline,
                developer_id: user.id,
                required_testers: taskData.requiredTesters || 1,
            })
            .select()
            .maybeSingle();

        if (error) throw new Error(error.message);
        if (!data) throw new Error('Task creation failed: Failed to verify record creation.');

        // Send email notifications (fail-safe and non-blocking)
        try {
            const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
            const devName = profile?.name || user.email;
            
            // 1. Send alert to Admin
            notificationService.sendNewProjectCreatedAlertToAdmin(devName, taskData.appName);
            
            // 2. Send confirmation to Developer
            notificationService.sendDeveloperAddedToProjectEmail(user.id, taskData.appName);
        } catch (emailErr) {
            console.error('[api.js] Project creation notification error:', emailErr);
        }

        return { task: data };
    },

    update: async (id, updates) => {
        // Fetch current state for notification comparison (fail-safe)
        let oldTask = null;
        try {
            const { data: ot } = await supabase.from('tasks').select('status, developer_id, app_name').eq('id', id).maybeSingle();
            oldTask = ot;
        } catch (fetchErr) {
            console.warn('[api.js] Failed to fetch pre-update task state:', fetchErr);
        }

        const updateData = {};
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.progress !== undefined) updateData.progress = updates.progress;
        if (updates.appName !== undefined) updateData.app_name = updates.appName;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.deadline !== undefined) updateData.deadline = updates.deadline;

        const { data, error } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw new Error(error.message);
        if (!data) throw new Error('Update failed: Task not found or permission denied.');

        // Trigger notifications after successful database update
        if (oldTask) {
            try {
                // Fetch assigned testers
                const { data: testers } = await supabase.from('task_testers').select('tester_id').eq('task_id', id);
                const testerIds = (testers || []).map(t => t.tester_id);

                // 1. Status change alert
                if (updates.status !== undefined && oldTask.status !== updates.status) {
                    notificationService.sendTaskStatusChangeEmail(oldTask.developer_id, oldTask.app_name, oldTask.status, updates.status);
                    notificationService.sendProjectStatusChangeEmail(oldTask.developer_id, testerIds, oldTask.app_name, oldTask.status, updates.status);
                }

                // 2. Detail update alert
                if (updates.appName !== undefined || updates.description !== undefined || updates.deadline !== undefined) {
                    notificationService.sendTaskDetailsUpdatedEmail(oldTask.app_name, oldTask.developer_id, testerIds);
                }
            } catch (notifyErr) {
                console.error('[api.js] Failed to trigger update notifications:', notifyErr);
            }
        }
        
        return { task: data };
    },

    delete: async (id) => {
        // 1. Fetch task details for notification context
        const { data: task } = await supabase.from('tasks').select('app_name').eq('id', id).maybeSingle();
        
        if (task) {
            // 2. Fetch all assigned testers
            const { data: assignments } = await supabase
                .from('task_testers')
                .select('tester_id')
                .eq('task_id', id);

            if (assignments && assignments.length > 0) {
                // 3. Notify each tester (Wrapped in fail-safe)
                const notificationPromises = assignments.map(async (a) => {
                    try {
                        return await notificationsAPI.create({
                            userId: a.tester_id,
                            title: 'Task Cancelled',
                            message: `The task "${task.app_name}" has been cancelled by an administrator.`,
                            type: 'system'
                        });
                    } catch (err) {
                        console.warn('Task cancellation notification failed (non-blocking):', err.message);
                    }
                });
                await Promise.allSettled(notificationPromises);
            }
        }

        // 4. Perform the actual deletion
        const { data, error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
            throw new Error('Deletion failed: Task not found or permission denied.');
        }
        
        return { success: true };
    },

    generateSummary: async (taskId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase.functions.invoke('summarize-task-feedback', {
            body: { taskId }
        });

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.error);
        return data;
    },

    marketplace: async (params = {}) => {
        // Get current user to exclude their already-accepted tasks
        const { data: { user } } = await supabase.auth.getUser();
        let myAcceptedTaskIds = [];
        if (user) {
            const { data: myTasks } = await supabase
                .from('task_testers')
                .select('task_id')
                .eq('tester_id', user.id);
            myAcceptedTaskIds = (myTasks || []).map(t => t.task_id);
        }

        let query = supabase
            .from('tasks')
            .select('*, profiles!tasks_developer_id_fkey(name, company)')
            .eq('status', 'open')
            .gte('deadline', new Date().toISOString().split('T')[0]);

        if (params.level && params.level !== 'all') {
            query = query.eq('testing_level', params.level);
        }
        if (params.type && params.type !== 'all') {
            query = query.contains('test_types', [params.type]);
        }
        if (params.search) {
            query = query.ilike('app_name', `%${params.search}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw new Error(error.message);

        // Filter out tasks current tester has already accepted
        const availableData = data.filter(t => !myAcceptedTaskIds.includes(t.id));

        // Get tester counts
        const taskIds = availableData.map(t => t.id);
        let testerCounts = [];
        if (taskIds.length > 0) {
            const { data: tc } = await supabase
                .from('task_testers')
                .select('task_id')
                .in('task_id', taskIds);
            testerCounts = tc || [];
        }

        const tasks = availableData.map(task => {
            const dev = task.profiles || {};
            const appliedCount = (testerCounts || []).filter(tc => tc.task_id === task.id).length;
            return {
                _id: task.id,
                id: task.id,
                appName: task.app_name,
                appUrl: task.app_url,
                description: task.description,
                testingLevel: task.testing_level,
                level: task.testing_level ? task.testing_level.charAt(0).toUpperCase() + task.testing_level.slice(1) : '',
                testTypes: task.test_types || [],
                credits: task.credits || task.budget,
                budget: task.budget,
                deadline: task.deadline,
                status: task.status,
                company: task.developer_company || dev.company || '',
                companyName: task.developer_company || dev.company || '',
                requiredTesters: task.required_testers,
                appliedTesters: appliedCount,
                openSlots: Math.max(0, task.required_testers - appliedCount),
                estimatedTime: task.estimated_time,
                postedAt: task.created_at,
                createdAt: task.created_at,
            };
        });

        return { tasks };
    },

    myTasks: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: assignments, error } = await supabase
            .from('task_testers')
            .select(`
                task_id, 
                created_at, 
                tasks(
                    *, 
                    profiles!tasks_developer_id_fkey(name, company),
                    feedback(status, tester_id)
                )
            `)
            .eq('tester_id', user.id);

        if (error) throw new Error(error.message);

        const tasks = (assignments || []).map(a => {
            const task = a.tasks;
            if (!task) return null;
            const dev = task.profiles || {};
            
            // Find feedback submitted by THIS tester for THIS task
            const userFeedback = (task.feedback || []).find(f => f.tester_id === user.id);
            const submissionStatus = userFeedback?.status || null;
            
            // A task is considered "submitted" if feedback exists and is not pending revision/rejected
            // which would mean the tester still needs to act on it.
            const hasSubmitted = !!(submissionStatus && 
                                submissionStatus !== 'needs-revision' && 
                                submissionStatus !== 'rejected');

            return {
                _id: task.id,
                id: task.id,
                taskId: task.id,
                appName: task.app_name,
                appUrl: task.app_url,
                description: task.description,
                testingLevel: task.testing_level,
                testTypes: task.test_types || [],
                credits: task.credits || task.budget,
                budget: task.budget,
                deadline: task.deadline,
                status: task.status,
                progress: task.progress,
                company: task.developer_company || dev.company || '',
                acceptedAt: a.created_at,
                createdAt: task.created_at,
                hasSubmitted,
                submissionStatus
            };
        }).filter(Boolean);


        return { tasks };
    },

    apply: async (id) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Insert into task_testers
        const { error } = await supabase
            .from('task_testers')
            .insert({ task_id: id, tester_id: user.id });

        if (error) {
            if (error.code === '23505') throw new Error('Already applied to this task');
            throw new Error(error.message);
        }

        // Check if task is now full and update status
        const { data: task } = await supabase.from('tasks').select('required_testers, developer_id, app_name, deadline, budget').eq('id', id).single();
        const { count } = await supabase.from('task_testers').select('*', { count: 'exact', head: true }).eq('task_id', id);

        const updates = { applied_testers: count };
        if (count >= (task?.required_testers || 1)) {
            updates.status = 'in-progress';
        }

        await supabase.from('tasks').update(updates).eq('id', id);

        // Notify developer and tester (Wrapped in try/catch to be non-blocking)
        try {
            const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
            if (task?.developer_id) {
                await notificationsAPI.create({
                    userId: task.developer_id,
                    title: 'New Applicant',
                    message: `${profile?.name || 'A tester'} has applied to your task "${task.app_name}"`,
                    type: 'task_assigned',
                    link: `/developer/tasks`
                });

                // Send email notification to Developer, Tester and Admins
                await notificationService.sendTaskAssignedEmail(task.developer_id, user.id, task.app_name, task.deadline, task.budget);
            }
        } catch (notifyError) {
            console.warn('Notification failed (non-blocking):', notifyError.message);
        }

        return { message: 'Successfully applied to task' };
    },
};

// ============ Feedback API ============
export const feedbackAPI = {
    list: async (params = {}) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        let query = supabase.from('feedback').select('*, profiles(average_rating)');

        const userRole = (profile?.role || '').toLowerCase();

        if (userRole === 'developer') {
            // Get tasks owned by developer
            const { data: tasks } = await supabase
                .from('tasks')
                .select('id')
                .eq('developer_id', user.id);
            const taskIds = (tasks || []).map(t => t.id);
            if (taskIds.length > 0) {
                query = query.in('task_id', taskIds);
            } else {
                return { feedback: [] };
            }
        } else if (userRole === 'tester') {
            query = query.eq('tester_id', user.id);
        }

        if (params.status && params.status !== 'all') {
            query = query.eq('status', params.status);
        }
        if (params.taskId) {
            query = query.eq('task_id', params.taskId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw new Error(error.message);

        const feedback = (data || []).map(fb => ({
            _id: fb.id,
            id: fb.id,
            task: fb.task_id,
            taskId: fb.task_id,
            taskName: fb.task_name || 'Unlabeled Task',
            tester: fb.tester_id,
            testerName: userRole === 'developer' ? `Tester-${fb.tester_id.substring(0, 8)}` : (fb.tester_name || 'Anonymous Tester'),
            testerRating: fb.profiles?.average_rating || 0,
            proofType: fb.proof_type,
            proofUrl: fb.proof_url,
            observations: fb.observations,
            testResult: fb.test_result,
            stepsToReproduce: fb.steps_to_reproduce,
            status: fb.status || 'pending',
            aiVerification: fb.ai_verification || 'pending',
            creditScore: fb.credit_score || 0,
            submittedAt: fb.created_at,
            createdAt: fb.created_at,
        }));

        return { feedback };
    },

    getByTask: async (taskId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('feedback')
            .select('*')
            .eq('task_id', taskId)
            .eq('tester_id', user.id)
            .maybeSingle();

        if (error) throw new Error(error.message);
        
        if (!data) return { feedback: null };

        return {
            feedback: {
                id: data.id,
                taskId: data.task_id,
                taskName: data.task_name,
                testerId: data.tester_id,
                status: data.status,
                observations: data.observations,
                stepsToReproduce: data.steps_to_reproduce,
                proofUrl: data.proof_url,
                testResult: data.test_result,
                submittedAt: data.created_at,
            }
        };
    },

    submit: async (feedbackData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const taskId = feedbackData.taskId || feedbackData.task;

        // 1. Check for existing feedback
        const { data: existing } = await supabase
            .from('feedback')
            .select('id, status')
            .eq('task_id', taskId)
            .eq('tester_id', user.id)
            .maybeSingle();

        if (existing) {
            // Only allow resubmission if it's in 'needs-revision' status
            if (existing.status !== 'needs-revision' && existing.status !== 'rejected') {
                throw new Error('You have already submitted feedback for this task. Please wait for the developer to review it.');
            }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .single();

        const { data: task } = await supabase
            .from('tasks')
            .select('app_name, developer_id')
            .eq('id', taskId)
            .single();

        const feedbackRecord = {
            task_id: taskId,
            task_name: task?.app_name || 'Assigned Task',
            tester_id: user.id,
            observations: feedbackData.observations,
            steps_to_reproduce: feedbackData.stepsToReproduce || '',
            proof_type: feedbackData.proofType || 'screenshot',
            proof_url: feedbackData.proofUrl || '',
            test_result: feedbackData.testResult || 'pass',
            tester_name: profile?.name || 'A tester',
            ai_verification: 'pending', // Will be updated by Edge Function
            status: 'pending',
            credit_score: 0, // Will be set by AI pipeline
        };

        let result;
        if (existing) {
            // UPDATE existing feedback
            const { data, error } = await supabase
                .from('feedback')
                .update(feedbackRecord)
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw new Error(error.message);
            result = data;
        } else {
            // INSERT new feedback
            const { data, error } = await supabase
                .from('feedback')
                .insert(feedbackRecord)
                .select()
                .single();
            if (error) throw new Error(error.message);
            result = data;
        }

        // Notify developer (Wrapped in try/catch to be non-blocking)
        try {
            if (task?.developer_id) {
                await notificationsAPI.create({
                    userId: task.developer_id,
                    title: existing ? 'Feedback Updated' : 'New Feedback Submitted',
                    message: `${profile?.name || 'A tester'} ${existing ? 'updated' : 'submitted'} feedback for "${task.app_name}"`,
                    type: 'feedback_received',
                    link: `/developer/feedback`
                });

                // 1. Send submission email alert to Developer & Admin
                await notificationService.sendTaskSubmittedEmail(
                    task.developer_id,
                    profile?.name || 'A tester',
                    task.app_name,
                    new Date().toLocaleString()
                );
                
                // 2. Send submission confirmation to Tester
                await notificationService.sendTaskSubmissionConfirmation(
                    user.email,
                    profile?.name || 'A tester',
                    task.app_name,
                    new Date().toLocaleString()
                );
            }
        } catch (notifyError) {
            console.warn('Notification failed (non-blocking):', notifyError.message);
        }

        // ── Trigger AI Verification Pipeline (non-blocking) ──────────────────
        // Fetch task details for credit amount
        const { data: taskForCredits } = await supabase
            .from('tasks')
            .select('credits, budget, description')
            .eq('id', taskId)
            .single();

        // Fire-and-forget: call the verify-proof edge function
        aiVerificationAPI.triggerPipeline({
            feedbackId:      result.id,
            testerId:        user.id,
            taskId:          taskId,
            proofUrl:        feedbackData.proofUrl || '',
            proofType:       feedbackData.proofType || 'screenshot',
            observations:    feedbackData.observations || '',
            taskDescription: taskForCredits?.description || task?.app_name || 'Software testing task',
            maxCredits:      taskForCredits?.credits || taskForCredits?.budget || 100,
        }).catch(err => console.warn('AI pipeline trigger failed (non-blocking):', err.message));

        return { feedback: result };
    },

    update: async (id, updates) => {
        const updateData = {};
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.aiVerification !== undefined) updateData.ai_verification = updates.aiVerification;

        const { data, error } = await supabase
            .from('feedback')
            .update(updateData)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw new Error(error.message);
        if (!data) throw new Error('Feedback update failed: Record not found.');

        // If approved, credit the tester
        if (updates.status === 'approved') {
            const { data: fb } = await supabase.from('feedback').select('tester_id, credit_score, task_id, task_name').eq('id', id).single();
            if (fb) {
                const creditAmount = updates.customCredits !== undefined ? updates.customCredits : (fb.credit_score || 0) * 3;
                const { data: tester } = await supabase.from('profiles').select('wallet_balance, total_earnings, completed_tests, name').eq('id', fb.tester_id).single();
                if (tester) {
                    await supabase.from('profiles').update({
                        wallet_balance: (tester.wallet_balance || 0) + creditAmount,
                        total_earnings: (tester.total_earnings || 0) + creditAmount,
                        completed_tests: (tester.completed_tests || 0) + 1,
                    }).eq('id', fb.tester_id);

                    // Record the credit transfer transaction for the tester
                    await transactionsAPI.record({
                        userId: fb.tester_id,
                        userName: tester.name,
                        userType: 'tester',
                        type: 'credit',
                        amount: creditAmount,
                        description: `Earnings for feedback approval`,
                        taskName: updates.taskName || fb.task_name || 'Task Feedback',
                        status: 'completed'
                    });

                    // Notify tester (Wrapped in try/catch to be non-blocking)
                    try {
                        await notificationsAPI.create({
                            userId: fb.tester_id,
                            title: 'Feedback Approved!',
                            message: `Your feedback for "${fb.task_name}" was approved. You earned ${creditAmount} credits.`,
                            type: 'payment_processed',
                            link: `/tester/wallet`
                        });
                    } catch (notifyError) {
                        console.warn('Feedback approval notification failed (non-blocking):', notifyError.message);
                    }
                }

                // Check if all feedback approved → mark task completed
                const { data: allFb } = await supabase.from('feedback').select('status').eq('task_id', fb.task_id);
                if (allFb && allFb.every(f => f.status === 'approved')) {
                    await supabase.from('tasks').update({ status: 'completed' }).eq('id', fb.task_id);

                    // Trigger completion emails to developer, tester, and admins
                    try {
                        const { data: task } = await supabase.from('tasks').select('developer_id, budget').eq('id', fb.task_id).single();
                        if (task) {
                            await notificationService.sendTaskCompletedEmail(task.developer_id, fb.tester_id, fb.task_name, task.budget || creditAmount);
                        }
                    } catch (emailErr) {
                        console.error('[api.js] Failed to send task completion emails:', emailErr);
                    }
                }
            }
        } else if (updates.status === 'needs-revision') {
            // Revert task status to in-progress if it was under review
            const { data: fb } = await supabase.from('feedback').select('task_id, task_name, tester_id').eq('id', id).single();
            if (fb) {
                await supabase.from('tasks').update({ status: 'in-progress' }).eq('id', fb.task_id);
                // Notify tester (Wrapped in try/catch to be non-blocking)
                try {
                    await notificationsAPI.create({
                        userId: fb.tester_id,
                        title: 'Revision Requested 📝',
                        message: `Your feedback for "${fb.task_name}" needs revision. Please check developer comments.`,
                        type: 'warning',
                        link: `/tester/status`
                    });

                    // Send email notification to Developer, Tester and Admins
                    const { data: task } = await supabase.from('tasks').select('developer_id').eq('id', fb.task_id).single();
                    if (task) {
                        await notificationService.sendTaskReworkRejectedEmail(
                            task.developer_id,
                            fb.tester_id,
                            fb.task_name,
                            updates.comment || 'Revision required by developer.'
                        );
                    }
                } catch (notifyError) {
                    console.warn('Revision request notification failed (non-blocking):', notifyError.message);
                }
            }
        } else if (updates.status === 'dev-approved') {
            const { data: fb } = await supabase.from('feedback').select('task_name, tester_id').eq('id', id).single();
            if (fb) {
                try {
                    await notificationsAPI.create({
                        userId: fb.tester_id,
                        title: 'Proof Verified! ✅',
                        message: `The developer has verified your proof for "${fb.task_name}". It is now in the queue for final credit release.`,
                        type: 'info',
                        link: `/tester/status`
                    });

                    // Notify all admins about pending verification
                    await notificationsAPI.notifyAdmins({
                        title: 'Pending Verification ⚖️',
                        message: `A developer has verified proof for "${fb.task_name}". Final credit release requires admin approval.`,
                        type: 'warning',
                        link: '/admin/verification'
                    });
                } catch (nError) {
                    console.error('Failed to notify tester or admins of dev-approval:', nError);
                }
            }
        } else if (updates.status === 'rejected') {
            const { data: fb } = await supabase.from('feedback').select('task_name, tester_id').eq('id', id).single();
            if (fb) {
                try {
                    await notificationsAPI.create({
                        userId: fb.tester_id,
                        title: 'Submission Rejected ❌',
                        message: `Unfortunately, your submission for "${fb.task_name}" was rejected during final verification.`,
                        type: 'error',
                        link: `/tester/status`
                    });
                } catch (nError) {
                    console.error('Failed to notify tester of rejection:', nError);
                }
            }
        }

        return { feedback: data };
    },
};

// ============ AI Verification API ============
export const aiVerificationAPI = {
    /**
     * Triggers the full AI verification pipeline via Supabase Edge Function.
     * Stages: Vision LLM → Image Duplicate (pHash proxy) → Text Duplicate (Embeddings) → Credit Rule Engine
     * This is designed to be called fire-and-forget — it updates the feedback record directly in DB.
     */
    triggerPipeline: async ({
        feedbackId,
        testerId,
        taskId,
        proofUrl,
        proofType,
        observations,
        taskDescription,
        maxCredits,
    }) => {
        const { data, error } = await supabase.functions.invoke('verify-proof', {
            body: {
                feedback_id:      feedbackId,
                tester_id:        testerId,
                task_id:          taskId,
                proof_url:        proofUrl,
                proof_type:       proofType,
                observations:     observations,
                task_description: taskDescription,
                max_credits:      maxCredits,
            },
        });

        if (error) throw new Error(error.message || 'AI pipeline invocation failed');
        return data;
    },

    /**
     * Fetches the full AI audit log for a specific feedback submission.
     * Used by the admin Verification page and tester Status page.
     */
    getLog: async (feedbackId) => {
        const { data, error } = await supabase
            .from('ai_verification_log')
            .select('*')
            .eq('feedback_id', feedbackId)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return { log: data };
    },

    /**
     * Lists all AI verification logs. Admin only.
     */
    listLogs: async (params = {}) => {
        let query = supabase
            .from('ai_verification_log')
            .select('*')
            .order('pipeline_ran_at', { ascending: false });

        if (params.status) query = query.eq('final_status', params.status);
        if (params.limit)  query = query.limit(params.limit);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return {
            logs: (data || []).map(log => ({
                id:                  log.id,
                feedbackId:          log.feedback_id,
                testerId:            log.tester_id,
                taskId:              log.task_id,
                // Vision
                isValid:             log.vision_is_valid,
                confidence:          log.vision_confidence,
                detectedText:        log.vision_detected_text,
                visionReason:        log.vision_reason,
                // Duplicates
                imageDuplicate:      log.image_duplicate,
                imageSimilarity:     log.image_similarity_score,
                textDuplicate:       log.text_duplicate,
                textSimilarity:      log.text_similarity_score,
                // Credits
                recommendedCredits:  log.recommended_credits,
                creditStatus:        log.credit_status,
                creditReason:        log.credit_reason,
                // Final
                finalStatus:         log.final_status,
                pipelineRanAt:       log.pipeline_ran_at,
            })),
        };
    },

    /**
     * Manually re-triggers the AI pipeline for a given feedback item.
     * Useful if the initial run failed or the tester resubmitted proof.
     */
    retrigger: async (feedbackId) => {
        const { data: fb, error } = await supabase
            .from('feedback')
            .select('id, tester_id, task_id, proof_url, proof_type, observations, task_name')
            .eq('id', feedbackId)
            .single();

        if (error) throw new Error(error.message);
        if (!fb) throw new Error('Feedback not found');

        const { data: task } = await supabase
            .from('tasks')
            .select('credits, budget, description')
            .eq('id', fb.task_id)
            .single();

        return aiVerificationAPI.triggerPipeline({
            feedbackId:      fb.id,
            testerId:        fb.tester_id,
            taskId:          fb.task_id,
            proofUrl:        fb.proof_url || '',
            proofType:       fb.proof_type || 'screenshot',
            observations:    fb.observations || '',
            taskDescription: task?.description || fb.task_name || 'Software testing task',
            maxCredits:      task?.credits || task?.budget || 100,
        });
    },
};

// ============ Users API ============
export const usersAPI = {
    list: async (params = {}) => {
        let query = supabase.from('profiles').select('*');

        if (params.role && params.role !== 'all') {
            query = query.eq('role', params.role);
        }
        if (params.status && params.status !== 'all') {
            query = query.eq('status', params.status);
        }
        if (params.search) {
            query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw new Error(error.message);

        const users = (data || []).map(u => ({
            _id: u.id,
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
            company: u.company,
            completedTasks: u.role === 'tester' ? (u.completed_tests || 0) : (u.tasks_created || 0),
            credits: u.role === 'tester' ? (u.total_earnings || 0) : (u.total_spent || 0),
            joinedAt: u.created_at,
            createdAt: u.created_at,
            bio: u.bio,
            experience: u.experience,
            skills: u.skills,
            avatar_url: u.avatar_url,
        }));

        return { users };
    },

    get: async (id) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw new Error(error.message);
        return { user: data };
    },

    update: async (id, updates) => {
        const updateData = {};
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.email !== undefined) updateData.email = updates.email;
        if (updates.role !== undefined) updateData.role = updates.role;
        if (updates.company !== undefined) updateData.company = updates.company;
        if (updates.bio !== undefined) updateData.bio = updates.bio;
        if (updates.skills !== undefined) updateData.skills = updates.skills;
        if (updates.experience !== undefined) updateData.experience = updates.experience;

        const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw new Error(error.message);
        if (!data) throw new Error('Update failed: User not found or permission denied.');
        
        return { user: data };
    },

    delete: async (id) => {
        // Try deleting via RPC to remove both Auth and Profile records, fallback if not defined
        try {
            const { error: rpcError } = await supabase.rpc('delete_user_completely', { user_id: id });
            if (!rpcError) return { success: true };
            console.warn('RPC delete_user_completely failed, falling back to profiles table delete:', rpcError.message);
        } catch (rpcErr) {
            console.warn('RPC delete_user_completely not available, falling back to profiles table delete:', rpcErr);
        }

        const { data, error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
            throw new Error('Deletion failed: User not found or permission denied.');
        }
        
        return { success: true };
    },

    stats: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (error) throw new Error(error.message);
        return { user: data };
    },
};

// ============ Profiles API ============
export const profilesAPI = {
    update: async (updates) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return { user: data };
    },

    uploadAvatar: async (file) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw new Error(uploadError.message);

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // Update profile with new avatar URL
        await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id);

        return { publicUrl };
    }
};

// ============ Transactions API ============
export const transactionsAPI = {
    list: async (params = {}) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

        let query = supabase.from('transactions').select('*');

        // Non-admin only see own
        if (profile?.role !== 'admin') {
            query = query.eq('user_id', user.id);
        }

        if (params.type && params.type !== 'all') query = query.eq('type', params.type);
        if (params.status && params.status !== 'all') query = query.eq('status', params.status);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw new Error(error.message);

        const transactions = (data || []).map(t => ({
            _id: t.id,
            id: t.id,
            type: t.type,
            user: t.user_name || 'Unknown',
            userName: t.user_name || 'Unknown',
            userType: t.user_type || 'tester',
            amount: t.amount,
            description: t.description,
            taskName: t.task_name,
            timestamp: t.created_at,
            status: t.status,
        }));

        return { transactions };
    },

    wallet: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Wallet profile fetch error:', profileError);
            throw new Error(profileError.message);
        }

        const { data: txData, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (txError) {
            console.error('Wallet transactions fetch error:', txError);
        }


        const transactions = (txData || []).map(t => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            description: t.description,
            taskName: t.task_name,
            timestamp: t.created_at,
            status: t.status,
        }));

        return {
            walletBalance: profile?.wallet_balance || 0,
            availableCredits: profile?.wallet_balance || 0,
            pendingCredits: profile?.pending_credits || 0,
            totalEarnings: profile?.total_earnings || 0,
            recentTransactions: transactions,
        };

    },

    getTesterAnalytics: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // 1. Fetch transactions for earnings trends
        const { data: myTransactions } = await supabase
            .from('transactions')
            .select('amount, created_at, type')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: true });

        const earningsTrend = aggregateByMonth(myTransactions || [], 'created_at', 'amount');

        // 2. Fetch feedback for submission quality
        const { data: myFeedback } = await supabase
            .from('feedback')
            .select('id, status, created_at')
            .eq('tester_id', user.id);

        const submissionCounts = {
            approved: (myFeedback || []).filter(f => f.status === 'approved').length,
            rejected: (myFeedback || []).filter(f => f.status === 'rejected').length,
            revision: (myFeedback || []).filter(f => f.status === 'needs-revision').length,
            pending: (myFeedback || []).filter(f => f.status === 'pending').length
        };

        return {
            earningsOverTime: {
                labels: earningsTrend.labels,
                data: earningsTrend.totals
            },
            submissionQuality: {
                labels: ['Approved', 'Rejected', 'Needs Revision', 'Pending'],
                data: [submissionCounts.approved, submissionCounts.rejected, submissionCounts.revision, submissionCounts.pending]
            }
        };
    },

    record: async (txData) => {
        // Use provided userId or fall back to current authenticated user
        let targetUserId = txData.userId;
        let targetUserName = txData.userName;
        let targetUserType = txData.userType;

        if (!targetUserId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            targetUserId = user.id;

            const { data: profile } = await supabase
                .from('profiles')
                .select('name, role')
                .eq('id', targetUserId)
                .single();
            
            targetUserName = profile?.name;
            targetUserType = profile?.role;
        }

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id: targetUserId,
                user_name: targetUserName || 'Unknown',
                user_type: targetUserType || 'tester',
                type: txData.type || 'payment',
                amount: txData.amount,
                description: txData.description,
                task_name: txData.taskName,
                status: txData.status || 'completed',
            })
            .select()
            .single();

        if (error) throw new Error(error.message);

        // Create notification for the user
        try {
            await notificationsAPI.create({
                userId: targetUserId,
                title: txData.type === 'payment' ? 'Payment Received 💰' : 'Account Update',
                message: txData.description || `A transaction of ${txData.amount} credits has been recorded.`,
                type: 'success',
                link: targetUserType === 'tester' ? '/tester/wallet' : targetUserType === 'developer' ? '/developer/payments' : '/admin/dashboard'
            });

            // Handle transaction email notifications (fail-safe)
            const isPayment = txData.type === 'payment';
            const status = txData.status || 'completed';
            const txIdShort = data.id ? data.id.substring(0, 8) : 'TXN-' + Math.floor(Math.random() * 90000 + 10000);
            
            if (isPayment) {
                if (status === 'completed') {
                    // 1. Send payment success email to User
                    await notificationService.sendPaymentSuccessEmail(targetUserId, txData.amount, txIdShort, txData.taskName || 'Platform Service');
                    // 2. Send invoice receipt email to User
                    await notificationService.sendInvoiceReceiptEmail(targetUserId, txData.amount, txIdShort, txData.taskName || 'Platform Service');
                    // 3. Send payment received notification to Admin
                    await notificationService.sendPaymentReceivedNotificationToAdmin(targetUserName || 'Developer', txData.amount, txData.taskName || 'Platform Service');
                } else if (status === 'failed') {
                    // 4. Send payment failure email to User
                    await notificationService.sendPaymentFailureEmail(targetUserId, txData.amount, txData.errorMsg || 'Payment processor declined the transaction.');
                }
            }
        } catch (nError) {
            console.error('Failed to handle transaction notifications:', nError);
        }

        return { transaction: data };
    },
};

// ============ Analytics API ============
// Helper to group data by month for the last 6 months
const aggregateByMonth = (items, dateField, valueField = null) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push({
            name: months[d.getMonth()],
            month: d.getMonth(),
            year: d.getFullYear(),
            count: 0,
            total: 0
        });
    }

    items.forEach(item => {
        const itemDate = new Date(item[dateField]);
        const m = itemDate.getMonth();
        const y = itemDate.getFullYear();
        
        const monthBucket = last6Months.find(b => b.month === m && b.year === y);
        if (monthBucket) {
            monthBucket.count += 1;
            if (valueField && item[valueField]) {
                monthBucket.total += parseFloat(item[valueField]);
            }
        }
    });

    return {
        labels: last6Months.map(m => m.name),
        counts: last6Months.map(m => m.count),
        totals: last6Months.map(m => m.total)
    };
};

export const analyticsAPI = {
    overview: async () => {
        // Fetch base stats
        const stats = await tasksAPI.getStats();

        // 1. Fetch Real Task Data for Trends
        const { data: allTasks } = await supabase
            .from('tasks')
            .select('id, created_at, status, test_types')
            .order('created_at', { ascending: true });
        
        const taskTrends = aggregateByMonth(allTasks || [], 'created_at');
        const completedTasksTrend = aggregateByMonth((allTasks || []).filter(t => t.status === 'completed'), 'created_at');

        // 2. Fetch Transaction Data for Revenue/Distribution
        const { data: allTransactions } = await supabase
            .from('transactions')
            .select('amount, created_at, type')
            .eq('status', 'completed');

        const creditTrends = aggregateByMonth(allTransactions || [], 'created_at', 'amount');

        // 3. Aggregate Task Types
        const typeCounts = {};
        (allTasks || []).forEach(t => {
            (t.test_types || []).forEach(type => {
                const formatted = type.charAt(0).toUpperCase() + type.slice(1);
                typeCounts[formatted] = (typeCounts[formatted] || 0) + 1;
            });
        });

        const sortedTypes = Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        return {
            stats,
            tasksOverTime: {
                labels: taskTrends.labels,
                datasets: [
                    { 
                        label: 'Tasks Created', 
                        data: taskTrends.counts, 
                        borderColor: '#6366f1', 
                        backgroundColor: 'rgba(99, 102, 241, 0.1)' 
                    },
                    { 
                        label: 'Tasks Completed', 
                        data: completedTasksTrend.counts, 
                        borderColor: '#14b8a6', 
                        backgroundColor: 'rgba(20, 184, 166, 0.1)' 
                    },
                ],
            },
            creditsDistribution: {
                labels: creditTrends.labels,
                data: creditTrends.totals,
            },
            tasksByType: {
                labels: sortedTypes.map(t => t[0]),
                data: sortedTypes.map(t => t[1]),
            },
            platformRevenue: {
                labels: creditTrends.labels,
                data: creditTrends.totals.map(total => total * 0.1), // Assumes 10% platform fee
            },
        };
    },
};

// ============ Notifications API ============
export const notificationsAPI = {
    list: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        return { 
            notifications: (data || []).map(n => ({
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type,
                unread: !n.is_read,
                time: n.created_at,
                link: n.link
            }))
        };
    },

    markAsRead: async (id) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (error) throw new Error(error.message);
        return { success: true };
    },

    markAllAsRead: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) throw new Error(error.message);
        return { success: true };
    },

    create: async ({ userId, title, message, type, link }) => {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                title,
                message,
                type,
                link
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return { notification: data };
    },

    notifyAdmins: async ({ title, message, type, link }) => {
        try {
            const { data: admins, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'admin');
            
            if (error) throw error;
            if (!admins || admins.length === 0) return { success: false, message: 'No admins found' };

            const notifications = admins.map(admin => ({
                user_id: admin.id,
                title,
                message,
                type: type || 'system',
                link: link || '/admin/dashboard'
            }));

            const { error: insertError } = await supabase
                .from('notifications')
                .insert(notifications);

            if (insertError) throw insertError;
            return { success: true };
        } catch (err) {
            console.error('Error in notifyAdmins:', err.message);
            return { success: false, error: err.message };
        }
    }
};

// ============ Support API ============
export const supportAPI = {
    createTicket: async (ticketData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('support_tickets')
            .insert({
                user_id: user.id,
                subject: ticketData.subject,
                message: ticketData.message,
                category: ticketData.category || 'general',
                status: 'open'
            })
            .select()
            .single();

        if (error) throw new Error(error.message);

        // Notify all admins about new support ticket
        try {
            const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
            await notificationsAPI.notifyAdmins({
                title: 'New Support Ticket 🎟️',
                message: `${profile?.name || 'A user'} has submitted a new support ticket: "${ticketData.subject}"`,
                type: 'info',
                link: '/admin/support'
            });
        } catch (nError) {
            console.error('Failed to notify admins of new support ticket:', nError);
        }

        return { ticket: data };
    },

    listUserTickets: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { tickets: data };
    },

    adminListTickets: async (status = 'all') => {
        let query = supabase
            .from('support_tickets')
            .select('*, profiles(name, email)');
        
        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw new Error(error.message);

        return { tickets: data };
    },

    updateTicket: async (id, updates) => {
        const { data, error } = await supabase
            .from('support_tickets')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return { ticket: data };
    }
};

// ============ Reputation & Recommendation API ============
export const reputationAPI = {
    /**
     * Fetches all tester data for a given task and assembles the full payload
     * needed by the tester-reputation Edge Function.
     */
    getTesterDataForTask: async (taskId) => {
        // 1. Get task details
        const { data: task, error: taskErr } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();
        if (taskErr) throw new Error(taskErr.message);

        // 2. Get ALL active testers (profiles with role=tester, excluding pending/suspended)
        const { data: allTesters } = await supabase
            .from('profiles')
            .select('id, name, email, skills, experience, rating, completed_tests, total_earnings')
            .eq('role', 'tester')
            .not('status', 'in', '(pending,suspended)');

        const testers = allTesters || [];
        const testerIds = testers.map(t => t.id);

        // 3. Get feedback records for all testers
        const { data: allFeedback } = testerIds.length > 0
            ? await supabase.from('feedback').select('*').in('tester_id', testerIds)
            : { data: [] };

        // 4. Get AI verification logs
        const { data: allVerifLogs } = testerIds.length > 0
            ? await supabase.from('ai_verification_log').select('*').in('tester_id', testerIds)
            : { data: [] };

        // 5. Get proof hashes (duplicate detection)
        const { data: allProofHashes } = testerIds.length > 0
            ? await supabase.from('proof_hashes').select('*').in('tester_id', testerIds)
            : { data: [] };

        // 6. Get task_testers for workload check
        const { data: taskAssignments } = testerIds.length > 0
            ? await supabase.from('task_testers').select('tester_id, task_id').in('tester_id', testerIds)
            : { data: [] };

        // 7. Build per-tester maps
        const testerTaskHistory = {};
        const proofVerificationHistory = {};
        const duplicateSubmissionHistory = {};
        const adminRatingsFeedback = {};
        const testerAvailability = {};

        const feedbacks = allFeedback || [];
        const verifLogs = allVerifLogs || [];
        const proofHashes = allProofHashes || [];
        const assignments = taskAssignments || [];

        for (const tester of testers) {
            const tid = tester.id;
            const tFeedback = feedbacks.filter(f => f.tester_id === tid);
            const tLogs = verifLogs.filter(l => l.tester_id === tid);
            const tHashes = proofHashes.filter(h => h.tester_id === tid);
            const tAssignments = assignments.filter(a => a.tester_id === tid);

            // Task history
            const total = tFeedback.length;
            const approved = tFeedback.filter(f => f.status === 'approved').length;
            const rejected = tFeedback.filter(f => f.status === 'rejected').length;
            const completed = tFeedback.filter(f => ['approved', 'dev-approved'].includes(f.status)).length;

            testerTaskHistory[tid] = {
                total_tasks: total,
                approved_tasks: approved,
                rejected_tasks: rejected,
                completed_tasks: completed,
                on_time_tasks: Math.round(approved * 0.85), // approximated
                task_types: Array.isArray(tester.skills) ? tester.skills : [],
            };

            // Proof history
            const avgConf = tLogs.length > 0
                ? tLogs.reduce((s, l) => s + (l.vision_confidence || 0.7), 0) / tLogs.length
                : 0.7;
            const suspCount = tLogs.filter(l => l.final_status === 'manual_review').length;

            proofVerificationHistory[tid] = {
                avg_confidence: avgConf,
                suspicious_count: suspCount,
                total_verifications: tLogs.length,
            };

            // Duplicate history
            const dupCount = tHashes.length > 1 ? Math.max(0, tHashes.length - total) : 0;
            const imageDups = tLogs.filter(l => l.image_duplicate).length;
            const textDups = tLogs.filter(l => l.text_duplicate).length;

            duplicateSubmissionHistory[tid] = {
                count: dupCount + imageDups + textDups,
                image_duplicates: imageDups,
                text_duplicates: textDups,
            };

            // Admin rating
            adminRatingsFeedback[tid] = {
                score: tester.rating || 3,
                review_count: tester.completed_tests || 0,
            };

            // Availability (testers with < 5 active tasks are available)
            const activeTaskCount = tAssignments.length;
            testerAvailability[tid] = {
                is_available: activeTaskCount < 5,
                current_tasks: activeTaskCount,
            };
        }

        // 8. Build tester profiles for the engine (include skills/platforms)
        const testerProfiles = testers.map(t => ({
            id: t.id,
            name: t.name,
            email: t.email,
            skills: Array.isArray(t.skills) ? t.skills : (typeof t.skills === 'string' ? t.skills.split(',').map(s => s.trim()) : []),
            experience: t.experience || 'intermediate',
            platforms: ['Web', 'Mobile'], // default; can be extended from profile
            rating: t.rating || 3,
            completed_tests: t.completed_tests || 0,
        }));

        return {
            current_task: {
                id: task.id,
                app_name: task.app_name,
                description: task.description,
                testing_level: task.testing_level,
                test_types: task.test_types || [],
                budget: task.budget,
                credits: task.credits,
                deadline: task.deadline,
                required_testers: task.required_testers,
            },
            task_requirements: {
                required_skills: task.test_types || [],
                platform: 'Web',
                difficulty_level: task.testing_level || 'intermediate',
                deadline_urgency: (() => {
                    if (!task.deadline) return 'normal';
                    const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                    return daysLeft <= 3 ? 'urgent' : daysLeft <= 7 ? 'high' : 'normal';
                })(),
            },
            max_testers_required: task.required_testers || 3,
            tester_profiles: testerProfiles,
            tester_task_history: testerTaskHistory,
            proof_verification_history: proofVerificationHistory,
            duplicate_submission_history: duplicateSubmissionHistory,
            admin_ratings_feedback: adminRatingsFeedback,
            tester_availability: testerAvailability,
        };
    },

    /**
     * Runs the full AI reputation analysis for a task.
     * Tries the Supabase Edge Function first; falls back to the
     * client-side math engine if the edge function is unavailable.
     */
    runAnalysis: async (payload) => {
        // ── Try Edge Function ─────────────────────────────────────
        try {
            const { data, error } = await supabase.functions.invoke('tester-reputation', {
                body: payload,
            });
            if (!error && data && data.reputation_scoring) return data;
        } catch (_) {
            // Edge function not deployed — fall through to local engine
        }

        // ── Client-Side Math Engine (full fallback) ───────────────
        const {
            current_task = {},
            task_requirements = {},
            max_testers_required = 3,
            tester_profiles = [],
            tester_task_history = {},
            proof_verification_history = {},
            duplicate_submission_history = {},
            admin_ratings_feedback = {},
            tester_availability = {},
        } = payload;

        const taskTypes = (task_requirements.required_skills || [])
            .concat(current_task.test_types || []);

        // ── Task Analysis ─────────────────────────────────────────
        const deadlineUrgency = task_requirements.deadline_urgency || (() => {
            if (!current_task.deadline) return 'normal';
            const d = Math.ceil((new Date(current_task.deadline) - new Date()) / 86400000);
            return d <= 3 ? 'urgent' : d <= 7 ? 'high' : 'normal';
        })();

        const taskAnalysis = {
            task_id: current_task.id || '',
            task_type: (current_task.test_types || []).join(', ') || 'Software Testing',
            required_skills: task_requirements.required_skills || current_task.test_types || [],
            required_platform: task_requirements.platform || 'Web',
            difficulty_level: current_task.testing_level || task_requirements.difficulty_level || 'intermediate',
            deadline_urgency: deadlineUrgency,
            risk_level: ['expert', 'advanced'].includes(current_task.testing_level) ? 'high' : 'medium',
            expected_tester_experience: current_task.testing_level || 'intermediate',
            number_of_testers_required: max_testers_required,
        };

        // ── Reputation Scoring ────────────────────────────────────
        const computeRep = (tester) => {
            const tid = tester.id;
            const hist = tester_task_history[tid] || {};
            const proof = proof_verification_history[tid] || {};
            const dups = duplicate_submission_history[tid] || {};
            const adminR = admin_ratings_feedback[tid] || {};

            const total = hist.total_tasks || 0;
            const approved = hist.approved_tasks || 0;
            const rejected = hist.rejected_tasks || 0;
            const completed = hist.completed_tasks || 0;
            const onTime = hist.on_time_tasks || 0;

            if (total < 2) {
                return {
                    reputation_score: Math.min(40, 30 + total * 5),
                    reputation_level: 'New Tester',
                    approval_rate: total > 0 ? Math.round((approved / total) * 100) : 0,
                    average_proof_confidence: Math.round((proof.avg_confidence || 0) * 100),
                    completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
                    on_time_completion_rate: total > 0 ? Math.round((onTime / total) * 100) : 0,
                    admin_rating_score: (adminR.score || 3) * 20,
                    similar_task_performance: 0,
                    penalty_score: 0,
                    risk_level: 'low',
                    strengths: ['New tester — fresh potential'],
                    weaknesses: ['Insufficient history for full evaluation'],
                    reason: 'New tester with limited task history.',
                };
            }

            const approvalRate = Math.round((approved / total) * 100);
            const avgConfPct = Math.round((proof.avg_confidence || 0.7) * 100);
            const completionRate = Math.round((completed / total) * 100);
            const onTimeRate = Math.round((onTime / total) * 100);
            const adminScore = (adminR.score || 3) * 20;
            const rejRate = Math.round((rejected / total) * 100);

            const tSkills = Array.isArray(tester.skills) ? tester.skills : [];
            const overlap = tSkills.filter(s => taskTypes.some(t =>
                t.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(t.toLowerCase())
            )).length;
            const similarPerf = Math.min(100, overlap * 25 + approvalRate * 0.5);

            const dupCount = dups.count || 0;
            const suspCount = proof.suspicious_count || 0;
            const latePenalty = Math.max(0, (total - onTime - 3)) * 2;
            const totalPenalty = Math.min(50,
                dupCount * 15 + suspCount * 10 +
                (rejRate > 30 ? (rejRate - 30) * 0.5 : 0) +
                latePenalty +
                Math.max(0, (1 - completionRate / 100) * 15)
            );

            const raw = approvalRate * 0.25 + avgConfPct * 0.20 +
                completionRate * 0.15 + onTimeRate * 0.15 +
                adminScore * 0.15 + similarPerf * 0.10 - totalPenalty;
            const score = Math.max(0, Math.min(100, Math.round(raw)));

            let level = 'Low Reputation';
            if (score >= 90) level = 'Elite Tester';
            else if (score >= 75) level = 'Trusted Tester';
            else if (score >= 60) level = 'Normal Tester';
            else if (score >= 40) level = 'Risk Tester';

            const strengths = [];
            const weaknesses = [];
            if (approvalRate >= 80) strengths.push('High approval rate');
            if (avgConfPct >= 80) strengths.push('Strong proof quality');
            if (onTimeRate >= 85) strengths.push('Excellent on-time delivery');
            if (adminScore >= 80) strengths.push('Highly rated by admins');
            if (overlap > 0) strengths.push('Experience in similar task types');
            if (dupCount > 0) weaknesses.push(`${dupCount} duplicate submission(s)`);
            if (suspCount > 0) weaknesses.push(`${suspCount} suspicious submission(s) flagged`);
            if (rejRate > 30) weaknesses.push('High rejection rate');
            if (onTimeRate < 70) weaknesses.push('Frequent late submissions');
            if (completionRate < 80) weaknesses.push('Incomplete task history');

            return {
                reputation_score: score,
                reputation_level: level,
                approval_rate: approvalRate,
                average_proof_confidence: avgConfPct,
                completion_rate: completionRate,
                on_time_completion_rate: onTimeRate,
                admin_rating_score: Math.round(adminScore),
                similar_task_performance: Math.round(similarPerf),
                penalty_score: Math.round(totalPenalty),
                risk_level: dupCount > 1 || suspCount > 1 ? 'high' : dupCount > 0 || rejRate > 40 ? 'medium' : 'low',
                strengths: strengths.length > 0 ? strengths : ['Consistent performer'],
                weaknesses: weaknesses.length > 0 ? weaknesses : ['No significant issues detected'],
                reason: `Score from ${total} tasks — ${approvalRate}% approval, ${completionRate}% completion.`,
            };
        };

        const reputationScoring = tester_profiles.map(tester => ({
            tester_id: tester.id,
            tester_name: tester.name || 'Unknown',
            ...computeRep(tester),
        }));

        // ── Recommendation Scoring ────────────────────────────────
        const requiredSkills = taskAnalysis.required_skills;
        const difficulty = taskAnalysis.difficulty_level;

        const taskRecommendations = tester_profiles.map(tester => {
            const tid = tester.id;
            const rep = reputationScoring.find(r => r.tester_id === tid) || {};
            const avail = tester_availability[tid] || {};
            const tSkills = Array.isArray(tester.skills) ? tester.skills : [];

            const matched = requiredSkills.filter(s => tSkills.some(ts =>
                ts.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ts.toLowerCase())
            ));
            const missing = requiredSkills.filter(s => !tSkills.some(ts =>
                ts.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ts.toLowerCase())
            ));
            const skillScore = requiredSkills.length > 0
                ? Math.round((matched.length / requiredSkills.length) * 100) : 60;

            const isAvail = avail.is_available !== false;
            const workload = avail.current_tasks || 0;
            const availScore = isAvail ? 100 : 20;
            const workloadScore = workload >= 5 ? 30 : workload >= 3 ? 60 : 100;
            const deadlineScore = deadlineUrgency === 'urgent' ? (isAvail ? 90 : 30) : 80;

            const repNum = rep.reputation_score || 0;
            const diffPenalty = ['expert', 'advanced'].includes(difficulty) && repNum < 60 ? 25
                : difficulty === 'intermediate' && repNum < 40 ? 15 : 0;
            const dupP = (duplicate_submission_history[tid]?.count || 0) > 0 ? 20 : 0;
            const riskP = rep.risk_level === 'high' ? 20 : rep.risk_level === 'medium' ? 10 : 0;
            const totalRiskP = Math.min(40, diffPenalty + dupP + riskP);

            const raw = skillScore * 0.30 + repNum * 0.20 +
                (rep.similar_task_performance || 0) * 0.20 +
                100 * 0.10 + availScore * 0.10 +
                deadlineScore * 0.05 + workloadScore * 0.05 - totalRiskP;
            const recScore = Math.max(0, Math.min(100, Math.round(raw)));

            let status = 'not_recommended';
            if (recScore >= 75) status = 'highly_recommended';
            else if (recScore >= 55) status = 'recommended';
            else if (recScore >= 35) status = 'backup';

            const risks = [];
            if (!isAvail) risks.push('Tester currently unavailable');
            if (workload >= 4) risks.push('High current workload');
            if ((duplicate_submission_history[tid]?.count || 0) > 0) risks.push('Duplicate submission history');
            if (rep.risk_level === 'high') risks.push('High risk profile');
            if (missing.length > 0) risks.push(`Missing skills: ${missing.slice(0, 2).join(', ')}`);

            return {
                tester_id: tid,
                tester_name: tester.name || 'Unknown',
                recommendation_score: recScore,
                recommendation_status: status,
                skill_match_score: skillScore,
                platform_match_score: 100,
                similar_task_performance_score: rep.similar_task_performance || 0,
                availability_score: availScore,
                deadline_suitability_score: deadlineScore,
                workload_balance_score: workloadScore,
                risk_penalty: totalRiskP,
                matched_skills: matched,
                missing_skills: missing,
                reason: `${recScore >= 75 ? 'Strong' : recScore >= 55 ? 'Good' : recScore >= 35 ? 'Moderate' : 'Poor'} match. Skill overlap: ${matched.length}/${requiredSkills.length}.`,
                risks,
            };
        });

        taskRecommendations.sort((a, b) => b.recommendation_score - a.recommendation_score);
        taskRecommendations.forEach((r, i) => { r.rank = i + 1; });

        const eligible = taskRecommendations
            .filter(r => ['highly_recommended', 'recommended'].includes(r.recommendation_status))
            .slice(0, max_testers_required);

        const finalRecommended = eligible.map((r, i) => ({
            rank: i + 1,
            tester_id: r.tester_id,
            tester_name: r.tester_name,
            final_score: r.recommendation_score,
            reason: r.reason,
        }));

        const quality = finalRecommended.length >= max_testers_required
            ? 'Excellent — enough qualified testers found'
            : finalRecommended.length > 0
            ? 'Good — some qualified testers available'
            : 'Poor — insufficient qualified testers';

        const notes = [];
        const newTesters = reputationScoring.filter(r => r.reputation_level === 'New Tester').length;
        const highRisk = reputationScoring.filter(r => r.risk_level === 'high').length;
        if (newTesters > 0) notes.push(`${newTesters} new tester(s) — suitable for low/medium tasks only`);
        if (highRisk > 0) notes.push(`${highRisk} tester(s) flagged as high risk`);
        if (finalRecommended.length < max_testers_required)
            notes.push('Fewer qualified testers than required — consider expanding the pool');

        return {
            success: true,
            source: 'client_math_engine',
            task_analysis: taskAnalysis,
            reputation_scoring: reputationScoring,
            task_recommendations: taskRecommendations,
            final_recommended_testers: finalRecommended,
            summary: {
                total_testers_analyzed: tester_profiles.length,
                total_testers_recommended: finalRecommended.length,
                best_match_tester_id: taskRecommendations[0]?.tester_id || '',
                recommendation_quality: quality,
                notes,
            },
        };
    },

    /**
     * Get reputation scoreboard for all testers (admin view).
     * Returns testers ranked by computed reputation score.
     */
    getScoreboard: async () => {
        // Fetch all active testers (exclude pending/suspended)
        const { data: testers } = await supabase
            .from('profiles')
            .select('id, name, email, skills, experience, rating, completed_tests, total_earnings, wallet_balance')
            .eq('role', 'tester')
            .not('status', 'in', '(pending,suspended)');

        if (!testers || testers.length === 0) return { scoreboard: [] };

        const testerIds = testers.map(t => t.id);

        const [
            { data: allFeedback },
            { data: allVerifLogs },
            { data: taskAssignments },
        ] = await Promise.all([
            testerIds.length > 0
                ? supabase.from('feedback').select('tester_id, status, credit_score, created_at').in('tester_id', testerIds)
                : Promise.resolve({ data: [] }),
            testerIds.length > 0
                ? supabase.from('ai_verification_log').select('tester_id, vision_confidence, final_status, image_duplicate, text_duplicate').in('tester_id', testerIds)
                : Promise.resolve({ data: [] }),
            testerIds.length > 0
                ? supabase.from('task_testers').select('tester_id').in('tester_id', testerIds)
                : Promise.resolve({ data: [] }),
        ]);

        const scoreboard = testers.map(tester => {
            const tid = tester.id;
            const tFeedback = (allFeedback || []).filter(f => f.tester_id === tid);
            const tLogs = (allVerifLogs || []).filter(l => l.tester_id === tid);
            const activeTaskCount = (taskAssignments || []).filter(a => a.tester_id === tid).length;

            const total = tFeedback.length;
            const approved = tFeedback.filter(f => f.status === 'approved').length;
            const rejected = tFeedback.filter(f => f.status === 'rejected').length;
            const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
            const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;

            const avgConf = tLogs.length > 0
                ? tLogs.reduce((s, l) => s + (l.vision_confidence || 0.7), 0) / tLogs.length
                : 0;
            const dupCount = tLogs.filter(l => l.image_duplicate || l.text_duplicate).length;
            const suspCount = tLogs.filter(l => l.final_status === 'manual_review').length;

            // Compute score
            const adminScore = (tester.rating || 3) * 20;
            const rawScore =
                approvalRate * 0.25 +
                avgConf * 100 * 0.20 +
                (total > 0 ? (approved / total) * 100 : 0) * 0.15 +
                85 * 0.15 + // on-time approximation
                adminScore * 0.15 +
                50 * 0.10 - // similar task performance placeholder
                dupCount * 15 -
                suspCount * 10 -
                (rejectionRate > 30 ? (rejectionRate - 30) * 0.5 : 0);

            const score = total < 2
                ? Math.min(40, 30 + total * 5)
                : Math.max(0, Math.min(100, Math.round(rawScore)));

            let level = 'Low Reputation';
            if (total < 2) level = 'New Tester';
            else if (score >= 90) level = 'Elite Tester';
            else if (score >= 75) level = 'Trusted Tester';
            else if (score >= 60) level = 'Normal Tester';
            else if (score >= 40) level = 'Risk Tester';

            return {
                id: tester.id,
                name: tester.name,
                email: tester.email,
                skills: Array.isArray(tester.skills) ? tester.skills : [],
                experience: tester.experience,
                reputation_score: score,
                reputation_level: level,
                approval_rate: approvalRate,
                rejection_rate: rejectionRate,
                total_tasks: total,
                approved_tasks: approved,
                duplicate_count: dupCount,
                suspicious_count: suspCount,
                avg_proof_confidence: Math.round(avgConf * 100),
                admin_rating: tester.rating || 0,
                completed_tests: tester.completed_tests || 0,
                total_earnings: tester.total_earnings || 0,
                active_tasks: activeTaskCount,
            };
        });

        scoreboard.sort((a, b) => b.reputation_score - a.reputation_score);
        return { scoreboard };
    },

    /**
     * Get reputation score for a single tester (used by marketplace).
     */
    getTesterScore: async (testerId) => {
        const { data: tester } = await supabase
            .from('profiles')
            .select('id, rating, completed_tests, skills')
            .eq('id', testerId)
            .single();

        if (!tester) return { score: 0, level: 'New Tester' };

        const { data: feedback } = await supabase
            .from('feedback')
            .select('status')
            .eq('tester_id', testerId);

        const total = (feedback || []).length;
        const approved = (feedback || []).filter(f => f.status === 'approved').length;
        const approvalRate = total > 0 ? (approved / total) * 100 : 0;
        const adminScore = (tester.rating || 3) * 20;

        const rawScore = approvalRate * 0.40 + adminScore * 0.30 + Math.min(total * 5, 30) * 0.30;
        const score = total < 2 ? Math.min(40, 30 + total * 5) : Math.max(0, Math.min(100, Math.round(rawScore)));

        let level = 'Low Reputation';
        if (total < 2) level = 'New Tester';
        else if (score >= 90) level = 'Elite Tester';
        else if (score >= 75) level = 'Trusted Tester';
        else if (score >= 60) level = 'Normal Tester';
        else if (score >= 40) level = 'Risk Tester';

        return { score, level, skills: tester.skills || [] };
    },
};

export default {
    auth: authAPI,
    tasks: tasksAPI,
    feedback: feedbackAPI,
    users: usersAPI,
    transactions: transactionsAPI,
    analytics: analyticsAPI,
    notifications: notificationsAPI,
    support: supportAPI,
    profiles: profilesAPI,
    aiVerification: aiVerificationAPI,
    reputation: reputationAPI,
};
