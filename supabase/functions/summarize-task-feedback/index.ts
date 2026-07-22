import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { taskId } = await req.json()

    if (!taskId) {
      throw new Error('taskId is required')
    }

    const groqKey = Deno.env.get('GROQ_API_KEY')
    if (!groqKey) {
      throw new Error('GROQ_API_KEY is not set')
    }

    // Fetch task details
    const { data: task, error: taskError } = await supabaseClient
      .from('tasks')
      .select('app_name, description')
      .eq('id', taskId)
      .single()

    if (taskError) throw taskError

    // Fetch all feedback for this task
    const { data: feedbacks, error: feedbackError } = await supabaseClient
      .from('feedback')
      .select('observations, steps_to_reproduce, test_result')
      .eq('task_id', taskId)

    if (feedbackError) throw feedbackError

    if (!feedbacks || feedbacks.length === 0) {
      throw new Error('No feedback found for this task yet.')
    }

    // Prepare the text to send to the AI
    let allFeedbackText = ''
    feedbacks.forEach((fb, index) => {
      allFeedbackText += `--- Tester ${index + 1} ---\n`
      allFeedbackText += `Result: ${fb.test_result}\n`
      allFeedbackText += `Observations: ${fb.observations}\n`
      if (fb.steps_to_reproduce) {
        allFeedbackText += `Steps to Reproduce: ${fb.steps_to_reproduce}\n`
      }
      allFeedbackText += `\n`
    })

    const systemPrompt = `
      You are a QA Lead and Technical Project Manager. 
      Your job is to read the individual testing reports submitted by multiple QA testers for a specific software task, and generate a single, concise executive summary for the developer.
      
      Requirements for the summary:
      1. Keep it under 200 words.
      2. Highlight the most common or critical bugs found.
      3. Summarize the overall consensus (e.g., "Most testers found the app stable, but 2 testers experienced login crashes").
      4. Do not list out tester numbers (e.g., "Tester 1 said... Tester 2 said..."), synthesize the information instead.
      5. Output ONLY the summary text, without any conversational fluff.
    `

    const userPrompt = `
      Task Name: ${task.app_name}
      Task Description: ${task.description || 'N/A'}
      
      Here is the feedback from all testers:
      ${allFeedbackText}
    `

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 400,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Groq API error: ${errText}`)
    }

    const data = await response.json()
    const summaryText = data.choices?.[0]?.message?.content?.trim() || "Failed to generate summary."

    // Save summary to the tasks table
    const { error: updateError } = await supabaseClient
      .from('tasks')
      .update({ ai_summary: summaryText })
      .eq('id', taskId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true, summary: summaryText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
