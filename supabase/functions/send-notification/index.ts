import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const RESEND_API_KEY = "re_MeqRTT3U_KLQ8T8LTxpbkvNZDHQPkJphe"

serve(async (req) => {
  try {
    const payload = await req.json()
    const { record } = payload
    
    console.log(`Sending email for notification: ${record.id} to user: ${record.user_id}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fetch user email from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', record.user_id)
      .single()

    if (profileError || !profile?.email) {
      console.error('Error fetching user email:', profileError)
      return new Response(JSON.stringify({ error: 'User email not found' }), { status: 400 })
    }

    // 2. Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ProEduvate <onboarding@resend.dev>', // Using Resend's default sender for sandbox/new accounts
        to: profile.email,
        subject: `New Notification: ${record.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #3b82f6;">Hello ${profile.name},</h2>
            <p style="font-size: 16px; color: #333;">You have a new update on ProEduvate:</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${record.title}</h3>
              <p>${record.message}</p>
            </div>
            <p style="font-size: 14px; color: #666;">
              Log in to your dashboard to see more details.
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              &copy; 2026 ProEduvate Software Test Platform
            </p>
          </div>
        `,
      }),
    })

    const data = await res.json()
    console.log('Resend Response status:', res.status)
    console.log('Resend Response body:', data)

    if (!res.ok) {
      throw new Error(`Resend Error: ${JSON.stringify(data)}`)
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Edge Function Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
