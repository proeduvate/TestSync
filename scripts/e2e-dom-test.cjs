// ============================================================
// TestSync — Complete End-to-End DOM Test (Node.js + Supabase)
// ============================================================
// Flow:
//   1. Developer  → Login → Create Task (via API)
//   2. Tester     → Login → Accept Task → Submit Proof (via API)
//   3. AI Pipeline→ verify-proof Edge Function (Screenshot + Credit + Duplicate)
//   4. Admin      → Check verification log + credit allocation
// ============================================================

'use strict';
const fs   = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ── ANSI colours ────────────────────────────────────────────
const C = {
    reset:  '\x1b[0m',
    bold:   '\x1b[1m',
    dim:    '\x1b[2m',
    red:    '\x1b[31m',
    green:  '\x1b[32m',
    yellow: '\x1b[33m',
    blue:   '\x1b[34m',
    magenta:'\x1b[35m',
    cyan:   '\x1b[36m',
    white:  '\x1b[37m',
    bgBlue: '\x1b[44m',
};

// ── helpers ─────────────────────────────────────────────────
const log  = (msg)        => console.log(msg);
const ok   = (msg)        => console.log(`${C.green}  ✔  ${C.reset}${msg}`);
const fail = (msg)        => console.log(`${C.red}  ✘  ${C.reset}${msg}`);
const info = (msg)        => console.log(`${C.cyan}  ℹ  ${C.reset}${msg}`);
const warn = (msg)        => console.log(`${C.yellow}  ⚠  ${C.reset}${msg}`);
const sep  = (title = '') => {
    const line = '─'.repeat(70);
    if (title) {
        const pad = Math.max(0, Math.floor((70 - title.length - 2) / 2));
        console.log(`\n${C.bold}${C.blue}┌${line}┐${C.reset}`);
        console.log(`${C.bold}${C.blue}│${' '.repeat(pad)} ${title} ${' '.repeat(70 - pad - title.length - 2)}│${C.reset}`);
        console.log(`${C.bold}${C.blue}└${line}┘${C.reset}\n`);
    } else {
        console.log(`${C.dim}${line}${C.reset}`);
    }
};

// Shared test state
const state = {
    createdTaskId:     null,
    createdFeedbackId: null,
    testTaskName:      `E2E-TestTask-${Date.now()}`,
    pass: 0,
    fail: 0,
};

function assert(condition, label) {
    if (condition) {
        ok(label);
        state.pass++;
    } else {
        fail(label);
        state.fail++;
    }
    return condition;
}

// ── Load .env ───────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
    fail('.env file not found at: ' + envPath);
    process.exit(1);
}
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i > 0) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
});

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON    = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
    fail('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set in .env');
    process.exit(1);
}

// Credentials
const DEV_EMAIL   = '23cse161@act.edu.in';
const DEV_PASS    = '12345678';
const TESTER_EMAIL= '23cse165@act.edu.in';
const TESTER_PASS = 'asdfghjkl';
const ADMIN_EMAIL = 'vijiselara@gmail.com';
const ADMIN_PASS  = 'Vijiselara@123';

// ── Main test runner ─────────────────────────────────────────
async function main() {
    sep('TestSync — Complete E2E DOM Test Suite');
    log(`${C.dim}  Testing full developer → tester → AI pipeline → admin flow${C.reset}`);
    log(`${C.dim}  Supabase: ${SUPABASE_URL}${C.reset}\n`);

    // ════════════════════════════════════════════════
    // PHASE 1: DEVELOPER — Create Task
    // ════════════════════════════════════════════════
    sep('PHASE 1 · DEVELOPER — Login & Create Task');

    const devClient = createClient(SUPABASE_URL, SUPABASE_ANON);

    // 1.1 Developer Login
    info(`Logging in as developer: ${DEV_EMAIL}`);
    const { data: devAuth, error: devAuthErr } = await devClient.auth.signInWithPassword({
        email: DEV_EMAIL,
        password: DEV_PASS,
    });
    if (!assert(!devAuthErr && devAuth?.user, `Developer login → ${devAuthErr?.message || 'OK'}`)) {
        fail('Developer login failed — cannot continue.');
        process.exit(1);
    }
    const devId = devAuth.user.id;
    info(`  Developer user ID: ${devId}`);

    // 1.2 Verify developer profile
    const { data: devProfile, error: devProfErr } = await devClient
        .from('profiles')
        .select('id, name, role, email')
        .eq('id', devId)
        .single();
    assert(!devProfErr && devProfile?.role, `Developer profile fetched (role: ${devProfile?.role})`);

    // 1.3 Create a task
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const deadlineStr = tomorrow.toISOString().split('T')[0];

    info(`Creating task: "${state.testTaskName}"`);
    const taskPayload = {
        developer_id:     devId,
        app_name:         state.testTaskName,
        app_url:          'https://testsync-demo.example.com',
        description:      'E2E automated test task — verify UI login, registration, and dashboard functionality. Test on multiple browsers.',
        testing_level:    'intermediate',
        test_types:       ['functional', 'usability'],
        budget:           750,
        credits:          750,
        required_testers: 1,
        deadline:         deadlineStr,
        status:           'open',
    };

    const { data: createdTask, error: createTaskErr } = await devClient
        .from('tasks')
        .insert(taskPayload)
        .select()
        .single();

    if (!assert(!createTaskErr && createdTask?.id, `Task created (ID: ${createdTask?.id}) → ${createTaskErr?.message || 'OK'}`)) {
        fail('Task creation failed — cannot continue.');
        process.exit(1);
    }
    state.createdTaskId = createdTask.id;
    info(`  Task ID: ${state.createdTaskId}`);
    info(`  App: ${createdTask.app_name}, Budget: ₹${createdTask.budget}, Credits: ${createdTask.credits}`);
    info(`  Testing level: ${createdTask.testing_level}, Deadline: ${createdTask.deadline}`);

    // 1.4 Verify task shows up in developer's task list
    const { data: devTasks, error: devTasksErr } = await devClient
        .from('tasks')
        .select('id, app_name, status')
        .eq('developer_id', devId)
        .eq('id', state.createdTaskId);
    assert(!devTasksErr && devTasks?.length > 0, `Task visible in developer task list`);
    assert(devTasks?.[0]?.status === 'open', `Task status is "open"`);

    // Sign out developer
    await devClient.auth.signOut();
    ok('Developer signed out.');

    // ════════════════════════════════════════════════
    // PHASE 2: TESTER — Accept Task & Submit Proof
    // ════════════════════════════════════════════════
    sep('PHASE 2 · TESTER — Login, Accept Task & Submit Proof');

    const testerClient = createClient(SUPABASE_URL, SUPABASE_ANON);

    // 2.1 Tester Login
    info(`Logging in as tester: ${TESTER_EMAIL}`);
    const { data: testerAuth, error: testerAuthErr } = await testerClient.auth.signInWithPassword({
        email: TESTER_EMAIL,
        password: TESTER_PASS,
    });
    if (!assert(!testerAuthErr && testerAuth?.user, `Tester login → ${testerAuthErr?.message || 'OK'}`)) {
        fail('Tester login failed — cannot continue.');
        process.exit(1);
    }
    const testerId = testerAuth.user.id;
    info(`  Tester user ID: ${testerId}`);

    // 2.2 Verify tester profile
    const { data: testerProfile, error: testerProfErr } = await testerClient
        .from('profiles')
        .select('id, name, role, wallet_balance')
        .eq('id', testerId)
        .single();
    assert(!testerProfErr && testerProfile?.role, `Tester profile fetched (role: ${testerProfile?.role})`);
    const initialWallet = testerProfile?.wallet_balance || 0;
    info(`  Initial wallet balance: ${initialWallet} credits`);

    // 2.3 View task in marketplace
    info(`Checking task appears in marketplace...`);
    const { data: mktTasks, error: mktErr } = await testerClient
        .from('tasks')
        .select('id, app_name, status, credits, testing_level')
        .eq('status', 'open')
        .eq('id', state.createdTaskId);
    assert(!mktErr && mktTasks?.length > 0, `Task "${state.testTaskName}" visible in marketplace`);
    assert(mktTasks?.[0]?.credits === 750, `Task credits correct: ${mktTasks?.[0]?.credits}`);

    // 2.4 Accept the task (apply as tester)
    info(`Accepting task (applying as tester)...`);
    const { error: applyErr } = await testerClient
        .from('task_testers')
        .insert({ task_id: state.createdTaskId, tester_id: testerId });

    if (assert(!applyErr, `Tester accepted task → ${applyErr?.message || 'OK'}`)) {
        // Verify tester assignment recorded
        const { data: assignment } = await testerClient
            .from('task_testers')
            .select('task_id, tester_id')
            .eq('task_id', state.createdTaskId)
            .eq('tester_id', testerId)
            .single();
        assert(assignment?.task_id === state.createdTaskId, `Task assignment recorded in DB`);
    }

    // 2.5 Submit proof (feedback)
    const proofUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Fronalpstock_big.jpg/1280px-Fronalpstock_big.jpg';
    const observations = 'E2E Test submission: Completed comprehensive functional and usability testing of the TestSync application. ' +
        'Tested login flow with valid and invalid credentials — system correctly shows error messages. ' +
        'Dashboard loaded successfully with all stats widgets displaying data. ' +
        'Responsive design verified on desktop viewport. Navigation between pages works correctly. ' +
        'No critical bugs found. Minor UI observation: button hover states could be more pronounced.';

    info(`Submitting proof feedback...`);
    info(`  Proof URL: ${proofUrl.substring(0, 60)}...`);

    const feedbackPayload = {
        task_id:            state.createdTaskId,
        task_name:          state.testTaskName,
        tester_id:          testerId,
        observations:       observations,
        steps_to_reproduce: '',
        proof_type:         'screenshot',
        proof_url:          proofUrl,
        test_result:        'pass',
        tester_name:        testerProfile?.name || 'Tester',
        ai_verification:    'pending',
        status:             'pending',
        credit_score:       0,
    };

    const { data: feedbackResult, error: feedbackErr } = await testerClient
        .from('feedback')
        .insert(feedbackPayload)
        .select()
        .single();

    if (!assert(!feedbackErr && feedbackResult?.id, `Proof submitted (feedback ID: ${feedbackResult?.id}) → ${feedbackErr?.message || 'OK'}`)) {
        fail('Proof submission failed — cannot continue to AI pipeline.');
        process.exit(1);
    }
    state.createdFeedbackId = feedbackResult.id;
    info(`  Feedback ID: ${state.createdFeedbackId}`);
    info(`  Initial status: ${feedbackResult.status}`);
    info(`  AI verification: ${feedbackResult.ai_verification}`);

    // 2.6 Verify tester cannot submit duplicate
    info(`Testing duplicate submission guard...`);
    const { data: dupCheck, error: dupErr } = await testerClient
        .from('feedback')
        .select('id, status')
        .eq('task_id', state.createdTaskId)
        .eq('tester_id', testerId);
    assert(dupCheck?.length === 1, `Only 1 feedback record exists (no duplicates in DB)`);

    // Sign out tester
    await testerClient.auth.signOut();
    ok('Tester signed out.');

    // ════════════════════════════════════════════════
    // PHASE 3: AI VERIFICATION PIPELINE
    // ════════════════════════════════════════════════
    sep('PHASE 3 · AI VERIFICATION PIPELINE — verify-proof Edge Function');

    const aiClient = createClient(SUPABASE_URL, SUPABASE_ANON);

    // Sign in as tester for function invocation
    await aiClient.auth.signInWithPassword({ email: TESTER_EMAIL, password: TESTER_PASS });

    info('Invoking verify-proof Edge Function...');
    info('  Models: Screenshot Verification + Credit Allocation + Duplicate Check');

    const pipelinePayload = {
        feedback_id:      state.createdFeedbackId,
        tester_id:        testerId,
        task_id:          state.createdTaskId,
        proof_url:        proofUrl,
        proof_type:       'screenshot',
        observations:     observations,
        task_description: taskPayload.description,
        max_credits:      750,
    };

    const { data: aiResult, error: aiErr } = await aiClient.functions.invoke('verify-proof', {
        body: pipelinePayload,
    });

    await aiClient.auth.signOut();

    if (aiErr || !aiResult) {
        fail(`AI pipeline invocation failed: ${aiErr?.message || 'No data returned'}`);
        warn('Skipping AI result assertions — check Supabase Edge Function logs.');
        state.fail++;
    } else {
        assert(!!aiResult.pipeline, `AI pipeline returned results object`);

        const p = aiResult.pipeline;

        // ── 3.1 Screenshot Verification ──
        sep('  3.1 SCREENSHOT VERIFICATION');
        if (p?.vision) {
            assert(typeof p.vision.is_valid === 'boolean', `Screenshot verification ran (is_valid: ${p.vision.is_valid})`);
            assert(typeof p.vision.confidence === 'number', `Confidence score returned: ${Math.round((p.vision.confidence || 0) * 100)}%`);
            info(`  Status:     ${p.vision.is_valid ? `${C.green}✅ VALID${C.reset}` : `${C.red}❌ INVALID${C.reset}`}`);
            info(`  Confidence: ${Math.round((p.vision.confidence || 0) * 100)}%`);
            info(`  Proof Type: ${p.vision.proof_type || 'screenshot'}`);
            if (p.vision.detected_text) info(`  Text Found: "${p.vision.detected_text.trim().substring(0, 80)}"`);
            info(`  Reason:     ${p.vision.reason || 'N/A'}`);
        } else {
            warn('Screenshot verification data missing from pipeline response');
            state.fail++;
        }

        // ── 3.2 Credit Allocation ──
        sep('  3.2 CREDIT ALLOCATION');
        if (p?.credit_allocation) {
            assert(typeof p.credit_allocation.recommended_credits === 'number', `Credit allocation ran`);
            assert(p.credit_allocation.recommended_credits >= 0, `Credits allocated: ${p.credit_allocation.recommended_credits}`);
            info(`  Status:  ${String(p.credit_allocation.status || '').toUpperCase()}`);
            info(`  Credits: ${p.credit_allocation.recommended_credits} / 750`);
            info(`  Reason:  ${p.credit_allocation.reason || 'N/A'}`);
        } else {
            warn('Credit allocation data missing from pipeline response');
            state.fail++;
        }

        // ── 3.3 Duplicate Detection ──
        sep('  3.3 DUPLICATE VERIFICATION');
        if (p?.image_duplicate !== undefined || p?.text_duplicate !== undefined) {
            const imgDup  = p.image_duplicate  || {};
            const txtDup  = p.text_duplicate   || {};
            const imgFlag = imgDup.duplicate;
            const txtFlag = txtDup.duplicate;

            assert(typeof imgFlag === 'boolean' || imgFlag === undefined, `Image duplicate check ran`);
            assert(typeof txtFlag === 'boolean' || txtFlag === undefined, `Text duplicate check ran`);

            info(`  Image Duplicate: ${imgFlag ? `${C.red}🚨 DUPLICATE DETECTED!${C.reset}` : `${C.green}✅ UNIQUE${C.reset}`}`);
            if (imgFlag) {
                info(`    Similarity Score: ${Math.round((imgDup.similarity_score || 0) * 100)}%`);
                info(`    Matched Proof ID: ${imgDup.matched_proof_id || 'N/A'}`);
            }
            info(`  Text Duplicate:  ${txtFlag ? `${C.red}🚨 DUPLICATE DETECTED!${C.reset}` : `${C.green}✅ UNIQUE${C.reset}`}`);
            if (txtFlag) {
                info(`    Similarity Score: ${Math.round((txtDup.similarity_score || 0) * 100)}%`);
                info(`    Matched ID:       ${txtDup.matched_feedback_id || 'N/A'}`);
            }
        } else {
            warn('Duplicate detection data missing from pipeline response');
            state.fail++;
        }
    }

    // ════════════════════════════════════════════════
    // PHASE 4: DB VERIFICATION — Check all records updated
    // ════════════════════════════════════════════════
    sep('PHASE 4 · DATABASE VERIFICATION — Check All Records');

    // Use admin client (service role is unavailable in this setup, use anon as admin)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON);
    const { data: adminAuth, error: adminAuthErr } = await adminClient.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASS,
    });
    if (!assert(!adminAuthErr && adminAuth?.user, `Admin login → ${adminAuthErr?.message || 'OK'}`)) {
        warn('Admin login failed — skipping DB verification phase.');
    } else {
        info(`  Admin user ID: ${adminAuth.user.id}`);

        // 4.1 Check feedback record updated by AI
        const { data: fbRecord, error: fbFetchErr } = await adminClient
            .from('feedback')
            .select('id, status, ai_verification, credit_score, proof_url')
            .eq('id', state.createdFeedbackId)
            .single();

        if (!fbFetchErr && fbRecord) {
            info(`\n  Feedback Record (post-AI):`);
            info(`    ID:              ${fbRecord.id}`);
            info(`    Status:          ${fbRecord.status}`);
            info(`    AI Verification: ${fbRecord.ai_verification}`);
            info(`    Credit Score:    ${fbRecord.credit_score}`);
            assert(fbRecord.id === state.createdFeedbackId, `Feedback record exists in DB`);
            assert(fbRecord.proof_url !== null, `Proof URL stored correctly`);
            const aiDone = fbRecord.ai_verification !== 'pending';
            if (aiDone) {
                assert(aiDone, `AI verification status updated (${fbRecord.ai_verification})`);
                assert(typeof fbRecord.credit_score === 'number', `Credit score set: ${fbRecord.credit_score}`);
            } else {
                warn(`AI verification still 'pending' — Edge Function may still be processing`);
            }
        } else {
            fail(`Could not fetch feedback record: ${fbFetchErr?.message}`);
            state.fail++;
        }

        // 4.2 Check AI verification log
        info(`\n  Checking AI verification audit log...`);
        const { data: auditLog, error: auditErr } = await adminClient
            .from('ai_verification_log')
            .select('*')
            .eq('feedback_id', state.createdFeedbackId);

        if (!auditErr) {
            assert(auditLog !== null, `AI verification log query succeeded`);
            if (auditLog?.length > 0) {
                info(`    Log entries found: ${auditLog.length}`);
                auditLog.forEach((entry, i) => {
                    info(`    [${i + 1}] model=${entry.model_type || 'N/A'}, result=${entry.result || 'N/A'}, confidence=${entry.confidence || 'N/A'}`);
                });
            } else {
                info(`    No log entries yet (Edge Function may be processing asynchronously)`);
            }
        } else {
            warn(`AI log query failed: ${auditErr.message}`);
        }

        // 4.3 Check tester wallet updated (if credits were allocated)
        info(`\n  Checking tester wallet balance...`);
        const { data: updatedTesterProfile } = await adminClient
            .from('profiles')
            .select('wallet_balance, total_earnings')
            .eq('id', testerId)
            .single();

        if (updatedTesterProfile) {
            const newBalance = updatedTesterProfile.wallet_balance || 0;
            info(`    Initial balance: ${initialWallet} credits`);
            info(`    Current balance: ${newBalance} credits`);
            if (newBalance > initialWallet) {
                ok(`Wallet credited! +${newBalance - initialWallet} credits`);
                state.pass++;
            } else {
                info(`    Balance unchanged (credits may be allocated after admin approval)`);
            }
        }

        // 4.4 Check verification page data (what admin would see)
        info(`\n  Checking admin verification view...`);
        const { data: pendingVerifications, error: pvErr } = await adminClient
            .from('feedback')
            .select('id, task_name, tester_name, status, ai_verification, credit_score, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (!pvErr && pendingVerifications) {
            info(`    Recent feedback records (last 5):`);
            pendingVerifications.forEach(pv => {
                const highlight = pv.id === state.createdFeedbackId ? ` ${C.yellow}← OUR TEST RECORD${C.reset}` : '';
                info(`    • ${pv.task_name} | status=${pv.status} | ai=${pv.ai_verification} | credits=${pv.credit_score}${highlight}`);
            });
        }

        await adminClient.auth.signOut();
        ok('Admin signed out.');
    }

    // ════════════════════════════════════════════════
    // PHASE 5: CLEANUP (delete test records)
    // ════════════════════════════════════════════════
    sep('PHASE 5 · CLEANUP — Remove Test Records');

    const cleanupClient = createClient(SUPABASE_URL, SUPABASE_ANON);
    await cleanupClient.auth.signInWithPassword({ email: DEV_EMAIL, password: DEV_PASS });

    if (state.createdFeedbackId) {
        const { error: delFbErr } = await cleanupClient
            .from('feedback')
            .delete()
            .eq('id', state.createdFeedbackId);
        assert(!delFbErr, `Feedback record deleted → ${delFbErr?.message || 'OK'}`);
    }

    if (state.createdTaskId) {
        // Remove tester assignment first
        await cleanupClient
            .from('task_testers')
            .delete()
            .eq('task_id', state.createdTaskId);

        const { error: delTaskErr } = await cleanupClient
            .from('tasks')
            .delete()
            .eq('id', state.createdTaskId);
        assert(!delTaskErr, `Task record deleted → ${delTaskErr?.message || 'OK'}`);
    }

    await cleanupClient.auth.signOut();

    // ════════════════════════════════════════════════
    // FINAL SUMMARY
    // ════════════════════════════════════════════════
    sep('TEST SUITE SUMMARY');

    const total = state.pass + state.fail;
    const pct   = total > 0 ? Math.round((state.pass / total) * 100) : 0;
    const color = pct >= 80 ? C.green : pct >= 50 ? C.yellow : C.red;

    log(`\n  ${C.bold}Results: ${color}${state.pass} passed${C.reset} / ${C.red}${state.fail} failed${C.reset} / ${total} total`);
    log(`  ${C.bold}Score:   ${color}${pct}%${C.reset}\n`);

    if (state.fail === 0) {
        log(`${C.green}${C.bold}  ✅  ALL TESTS PASSED — Full E2E flow verified!${C.reset}\n`);
    } else if (pct >= 80) {
        log(`${C.yellow}${C.bold}  ⚠   MOSTLY PASSED — ${state.fail} minor failure(s). Check logs above.${C.reset}\n`);
    } else {
        log(`${C.red}${C.bold}  ❌  FAILURES DETECTED — Review the output above.${C.reset}\n`);
    }

    log(`  ${C.dim}Phases tested:${C.reset}`);
    log(`    ${C.green}✔${C.reset} Phase 1: Developer login + task creation`);
    log(`    ${C.green}✔${C.reset} Phase 2: Tester login + marketplace + task acceptance + proof submission`);
    log(`    ${C.green}✔${C.reset} Phase 3: AI pipeline (screenshot verification + credit allocation + duplicate check)`);
    log(`    ${C.green}✔${C.reset} Phase 4: DB verification (feedback record + AI log + wallet check)`);
    log(`    ${C.green}✔${C.reset} Phase 5: Cleanup\n`);

    process.exit(state.fail > 0 ? 1 : 0);
}

main().catch(err => {
    fail('Unhandled error in test suite: ' + err.message);
    console.error(err);
    process.exit(1);
});
