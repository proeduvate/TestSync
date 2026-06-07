// Script to check DB tables
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env');
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
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    try {
        console.log('--- Checking proof_hashes ---');
        const { data: hashes, error: err1 } = await supabase.from('proof_hashes').select('*');
        console.log('Error:', err1 ? err1.message : 'None');
        console.log('Count:', hashes ? hashes.length : 0);

        console.log('\n--- Checking proof_embeddings ---');
        const { data: embeddings, error: err2 } = await supabase.from('proof_embeddings').select('*');
        console.log('Error:', err2 ? err2.message : 'None');
        console.log('Count:', embeddings ? embeddings.length : 0);

        console.log('\n--- Checking ai_verification_log ---');
        const { data: logs, error: err3 } = await supabase.from('ai_verification_log').select('*');
        console.log('Error:', err3 ? err3.message : 'None');
        console.log('Count:', logs ? logs.length : 0);
        if (logs && logs.length > 0) {
            console.log(JSON.stringify(logs, null, 2));
        }

        console.log('\n--- Checking specific feedback record ---');
        const { data: fb, error: err4 } = await supabase
            .from('feedback')
            .select('id, task_id, observations, ai_verification, status, credit_score')
            .eq('id', 'a452e946-f7c5-468c-aee8-0721ec877f7e')
            .single();
        console.log('Error:', err4 ? err4.message : 'None');
        console.log('Feedback:', fb);
    } catch (e) {
        console.error(e);
    }
}

run();
