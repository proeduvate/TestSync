/**
 * Email Service - Direct client wrapper for Supabase Edge Function "send-email"
 */

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const FUNCTION_URL = import.meta.env.VITE_FUNCTION_URL || "https://wbadwltxlmwhocukphxa.supabase.co/functions/v1/send-email";

/**
 * Sends an email using the Supabase Edge Function
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} message - HTML or text body of the email
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const sendEmail = async (email, subject, message) => {
    // 1. Basic validation
    if (!email || !subject || !message) {
        const missing = [];
        if (!email) missing.push('email');
        if (!subject) missing.push('subject');
        if (!message) missing.push('message');
        console.error(`[EmailService] Missing required parameters: ${missing.join(', ')}`);
        return { success: false, error: `Missing required parameters: ${missing.join(', ')}` };
    }

    try {
        console.log(`[EmailService] Attempting to send email to "${email}" with subject "${subject}"...`);

        // 2. Fetch call to Supabase Edge Function with authorization headers
        const response = await fetch(FUNCTION_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "apiKey": SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                email,
                subject,
                message,
            }),
        });

        // 3. Handle non-2xx HTTP responses
        if (!response.ok) {
            let errorText = '';
            try {
                const errData = await response.json();
                errorText = errData.error || errData.message || JSON.stringify(errData);
            } catch {
                errorText = await response.text();
            }
            
            const errMsg = `HTTP Error ${response.status}: ${errorText || response.statusText}`;
            console.error(`[EmailService] Delivery failed to "${email}". Error:`, errMsg);
            return { success: false, error: errMsg };
        }

        // 4. Handle success response
        const data = await response.json();
        console.log(`[EmailService] Email successfully dispatched to "${email}". Response:`, data);
        return { success: true, data };

    } catch (error) {
        // 5. Handle network or parsing exceptions
        const errMsg = error.message || 'Unknown network error';
        console.error(`[EmailService] Exception during email delivery to "${email}". Exception details:`, error);
        return { success: false, error: errMsg };
    }
};

export default {
    sendEmail
};