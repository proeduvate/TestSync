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

    const { testerId, taskId, proofText, feedbackText } = await req.json()

    if (!testerId || !taskId) {
      throw new Error('testerId and taskId are required')
    }

    // Call Groq API
    const groqKey = Deno.env.get('GROQ_API_KEY')
    if (!groqKey) {
      throw new Error('GROQ_API_KEY is not set')
    }

    const systemPrompt = `
      You are an expert QA Manager. A tester has submitted proof and feedback for a development task.
      Your job is to evaluate their work on a scale of 1 to 5 stars, where 5 is excellent and 1 is very poor.
      Return ONLY a JSON object strictly in this format without markdown formatting:
      {
        "rating": <integer between 1 and 5>,
        "feedback": "<a short 1-2 sentence explanation of why you gave this rating>"
      }
    `

    const userPrompt = `
      Criteria for evaluation:
      - How clearly is the feedback given to the developer?
      - How well does the proof fulfill the specific requirements of the developer's task?
      
      Tester's Feedback: "${feedbackText}"
      Tester's Proof details: "${proofText}"
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
        max_tokens: 200,
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Groq API error: ${errText}`)
    }

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content || "{}"
    
    // Parse the JSON block from the LLM response
    const cleaned = rawContent.replace(/```json\n?|\n?```/g, "").trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Groq response')
    }
    
    const evaluation = JSON.parse(jsonMatch[0])
    const rating = Math.max(1, Math.min(5, evaluation.rating)) // Ensure between 1 and 5
    
    // Insert into tester_evaluations
    const { error: insertError } = await supabaseClient
      .from('tester_evaluations')
      .insert({
        tester_id: testerId,
        task_id: taskId,
        ai_rating: rating,
        ai_feedback: evaluation.feedback
      })

    if (insertError) throw insertError

    // Update the average_rating in profiles table
    // Fetch all evaluations for this tester to calculate the new average
    const { data: evaluations, error: fetchError } = await supabaseClient
      .from('tester_evaluations')
      .select('ai_rating')
      .eq('tester_id', testerId)

    if (fetchError) throw fetchError

    const totalEvaluations = evaluations.length
    const averageRating = evaluations.reduce((sum, ev) => sum + ev.ai_rating, 0) / totalEvaluations

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        average_rating: averageRating,
        total_evaluations: totalEvaluations
      })
      .eq('id', testerId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true, rating, feedback: evaluation.feedback }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
