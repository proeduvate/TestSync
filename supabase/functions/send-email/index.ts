import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from "npm:nodemailer"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // 2. Parse request payload
    const { email, subject, message } = await req.json()

    if (!email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: email, subject, and message are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 3. Retrieve SMTP configurations from Env secrets
    const host = Deno.env.get("SMTP_HOST") || "smtp.gmail.com"
    const portVal = Deno.env.get("SMTP_PORT") || "465"
    const port = parseInt(portVal)
    const username = Deno.env.get("SMTP_USER")
    const password = Deno.env.get("SMTP_PASS")

    if (!username || !password) {
      console.error("[send-email] SMTP credentials (SMTP_USER/SMTP_PASS) are not set in Supabase Secrets.")
      return new Response(
        JSON.stringify({ error: "SMTP credentials are not configured in Supabase secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log(`[send-email] Initializing Nodemailer for <${email}> via SMTP ${host}:${port}...`)

    // 4. Create Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465, // Use SSL for port 465
      auth: {
        user: username,
        pass: password,
      },
    })

    // 5. Dispatch email
    const info = await transporter.sendMail({
      from: `"ProEduvate" <${username}>`,
      to: email,
      subject: subject,
      html: message,
    })

    console.log(`[send-email] Email dispatched successfully: ${info.messageId}`)

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("[send-email] Error encountered during nodemailer dispatch:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Failed to dispatch email via Nodemailer" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
