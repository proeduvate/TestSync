// Script to test the AI verification pipeline (verify-proof Edge Function)
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load environment variables from .env
console.log('Loading environment variables from .env...');
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found at ' + envPath);
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim();
        process.env[key] = value;
    }
});

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
    let testTask = null;
    let testDeveloper = null;
    let testTester = null;
    let testFeedback = null;
    let createdRecords = false;

    // Parse command line arguments
    const argImage = process.argv[2];
    const argObs = process.argv[3];
    let finalProofUrl = null;

    try {
        if (argImage) {
            if (argImage.startsWith('http://') || argImage.startsWith('https://')) {
                console.log(`Using custom proof URL: ${argImage}`);
                finalProofUrl = argImage;
            } else {
                console.log(`Checking local file path: ${argImage}`);
                if (!fs.existsSync(argImage)) {
                    console.error(`Error: Local file not found: ${argImage}`);
                    process.exit(1);
                }
                console.log('Uploading local file to temporary public hosting (tmpfiles.org)...');
                try {
                    const fileBuffer = fs.readFileSync(argImage);
                    const fileBlob = new Blob([fileBuffer]);
                    const formData = new FormData();
                    formData.append('file', fileBlob, path.basename(argImage));

                    const uploadRes = await fetch('https://tmpfiles.org/api/v1/upload', {
                        method: 'POST',
                        body: formData
                    });
                    const uploadJson = await uploadRes.json();
                    if (uploadJson && uploadJson.data && uploadJson.data.url) {
                        finalProofUrl = uploadJson.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
                        console.log(`Uploaded successfully! Public URL: ${finalProofUrl}`);
                    } else {
                        throw new Error('Invalid response structure from hosting API');
                    }
                } catch (uploadErr) {
                    console.error('Failed to upload local file:', uploadErr.message);
                    process.exit(1);
                }
            }
        }

        console.log('\n--- Checking for existing feedback records to use for test ---');
        // Find existing feedback
        const { data: existingFeedbacks, error: fbError } = await supabase
            .from('feedback')
            .select('*, tasks(*), profiles:tester_id(name)')
            .limit(1);

        if (fbError) {
            console.error('Error fetching feedback:', fbError.message);
        }

        let feedbackData = null;

        if (existingFeedbacks && existingFeedbacks.length > 0) {
            const fb = existingFeedbacks[0];
            console.log(`Found existing feedback record (ID: ${fb.id}) for task "${fb.task_name || (fb.tasks && fb.tasks.app_name)}"`);
            feedbackData = {
                feedback_id: fb.id,
                tester_id: fb.tester_id,
                task_id: fb.task_id,
                proof_url: finalProofUrl || fb.proof_url || 'https://raw.githubusercontent.com/supabase/supabase/master/packages/supabase-js/supabase-logo.png',
                proof_type: fb.proof_type || 'screenshot',
                observations: argObs || fb.observations || 'This is a test submission observations. Verified user registration and login successfully.',
                task_description: (fb.tasks && fb.tasks.description) || 'Test description for software testing task',
                max_credits: (fb.tasks && fb.tasks.credits) || 100,
            };
        } else {
            console.log('No existing feedback found. Creating temporary test records...');
            createdRecords = true;

            // Generate random UUIDs for temp records
            const devId = '00000000-0000-0000-0000-000000000001';
            const testerId = '00000000-0000-0000-0000-000000000002';
            const taskId = '00000000-0000-0000-0000-000000000003';
            const feedbackId = '00000000-0000-0000-0000-000000000004';


            // Insert developer profile
            console.log('Inserting temp developer profile...');
            const { error: devError } = await supabase.from('profiles').upsert({
                id: devId,
                name: 'Temp Developer',
                email: 'temp-dev@example.com',
                role: 'developer',
            });
            if (devError) throw devError;
            testDeveloper = devId;

            // Insert tester profile
            console.log('Inserting temp tester profile...');
            const { error: testerError } = await supabase.from('profiles').upsert({
                id: testerId,
                name: 'Temp Tester',
                email: 'temp-tester@example.com',
                role: 'tester',
                wallet_balance: 0,
            });
            if (testerError) throw testerError;
            testTester = testerId;

            // Insert task
            console.log('Inserting temp task...');
            const { error: taskError } = await supabase.from('tasks').upsert({
                id: taskId,
                developer_id: devId,
                app_name: 'TestSync App',
                app_url: 'https://example.com/test-app',
                description: 'Verify the login screen works, input random credentials and verify error messages appear correctly.',
                testing_level: 'basic',
                budget: 50,
                credits: 50,
                required_testers: 1,
            });
            if (taskError) throw taskError;
            testTask = taskId;

            // Insert feedback
            console.log('Inserting temp feedback...');
            const { error: feedbackInsertError } = await supabase.from('feedback').upsert({
                id: feedbackId,
                task_id: taskId,
                task_name: 'TestSync App',
                tester_id: testerId,
                observations: argObs || 'Verified that typing invalid credentials produces "Invalid password" warning. Button remains disabled until both inputs are populated.',
                steps_to_reproduce: '1. Go to URL\n2. Enter invalid credentials\n3. Click Login',
                proof_type: 'screenshot',
                proof_url: finalProofUrl || 'https://raw.githubusercontent.com/supabase/supabase/master/packages/supabase-js/supabase-logo.png',
                tester_name: 'Temp Tester',
                status: 'pending',
                ai_verification: 'pending',
            });
            if (feedbackInsertError) throw feedbackInsertError;
            testFeedback = feedbackId;

            feedbackData = {
                feedback_id: feedbackId,
                tester_id: testerId,
                task_id: taskId,
                proof_url: finalProofUrl || 'https://raw.githubusercontent.com/supabase/supabase/master/packages/supabase-js/supabase-logo.png',
                proof_type: 'screenshot',
                observations: argObs || 'Verified that typing invalid credentials produces "Invalid password" warning. Button remains disabled until both inputs are populated.',
                task_description: 'Verify the login screen works, input random credentials and verify error messages appear correctly.',
                max_credits: 50,
            };
        }

        console.log('\n--- Invoking verify-proof Edge Function ---');
        console.log('Payload:', JSON.stringify(feedbackData, null, 2));

        const { data, error: functionError } = await supabase.functions.invoke('verify-proof', {
            body: feedbackData
        });

        if (functionError) {
            console.error('Edge Function returned error status:', functionError);
        } else {
            console.log('\n========================================================================');
            console.log('                 🔍 AI VERIFICATION PIPELINE RESULTS 🔍');
            console.log('========================================================================\n');

            const p = data.pipeline;

            console.log('------------------------------------------------------------------------');
            console.log(' 1. SCREENSHOT VERIFICATION');
            console.log('------------------------------------------------------------------------');
            console.log(` Status:      ${p.vision.is_valid ? '✅ VALID' : '❌ INVALID'}`);
            console.log(` Confidence:  ${Math.round(p.vision.confidence * 100)}%`);
            console.log(` Proof Type:  ${p.vision.proof_type}`);
            console.log(` Text Found:  ${p.vision.detected_text ? `"${p.vision.detected_text.trim()}"` : 'None'}`);
            console.log(` Reason:      ${p.vision.reason}`);
            console.log();

            console.log('------------------------------------------------------------------------');
            console.log(' 2. CREDIT ALLOCATION');
            console.log('------------------------------------------------------------------------');
            console.log(` Status:      ${p.credit_allocation.status.toUpperCase()}`);
            console.log(` Credits:     ${p.credit_allocation.recommended_credits}`);
            console.log(` Reason:      ${p.credit_allocation.reason}`);
            console.log();

            console.log('------------------------------------------------------------------------');
            console.log(' 3. DUPLICATE VERIFICATION IN PROOF SUBMISSION');
            console.log('------------------------------------------------------------------------');
            console.log(` Image Dup:   ${p.image_duplicate.duplicate ? '🚨 DUPLICATE DETECTED!' : '✅ UNIQUE (No matches)'}`);
            if (p.image_duplicate.duplicate) {
                console.log(`   - Similarity Score: ${Math.round(p.image_duplicate.similarity_score * 100)}%`);
                console.log(`   - Matched Proof ID: ${p.image_duplicate.matched_proof_id}`);
            }
            console.log(` Text Dup:    ${p.text_duplicate.duplicate ? '🚨 DUPLICATE DETECTED!' : '✅ UNIQUE (No matches)'}`);
            if (p.text_duplicate.duplicate) {
                console.log(`   - Similarity Score: ${Math.round(p.text_duplicate.similarity_score * 100)}%`);
                console.log(`   - Matched Feedback ID: ${p.text_duplicate.matched_feedback_id}`);
            }
            console.log('========================================================================\n');

            // Verify if logs were recorded in database
            console.log('--- Querying DB AI Verification Logs ---');
            const { data: auditLogs, error: logFetchError } = await supabase
                .from('ai_verification_log')
                .select('*')
                .eq('feedback_id', feedbackData.feedback_id);

            if (logFetchError) {
                console.error('Failed to query ai_verification_log:', logFetchError.message);
            } else {
                console.log(`DB Log Found: ${auditLogs.length} record(s).`);
            }
        }

    } catch (err) {
        console.error('\n❌ Unexpected test execution failure:', err);
    } finally {
        if (createdRecords) {
            console.log('\n--- Cleaning up temporary test records ---');
            if (testFeedback) {
                console.log('Deleting temp feedback...');
                await supabase.from('feedback').delete().eq('id', testFeedback);
            }
            if (testTask) {
                console.log('Deleting temp task...');
                await supabase.from('tasks').delete().eq('id', testTask);
            }
            if (testTester) {
                console.log('Deleting temp tester profile...');
                await supabase.from('profiles').delete().eq('id', testTester);
            }
            if (testDeveloper) {
                console.log('Deleting temp developer profile...');
                await supabase.from('profiles').delete().eq('id', testDeveloper);
            }
            console.log('Cleanup completed.');
        }
    }
}

runTest();
