// deno-lint-ignore-file
// @ts-ignore: Deno URL imports are resolved at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno URL imports are resolved at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Fallback Math-Based Reputation Scoring ──────────────────────────────────
function computeReputationScore(tester: any, taskTypes: string[]): any {
  const history = tester.task_history || {};
  const proofHistory = tester.proof_history || {};
  const duplicates = tester.duplicate_history || {};
  const adminRating = tester.admin_rating || {};

  const totalTasks = history.total_tasks || 0;
  const approvedTasks = history.approved_tasks || 0;
  const rejectedTasks = history.rejected_tasks || 0;
  const completedTasks = history.completed_tasks || 0;
  const onTimeTasks = history.on_time_tasks || 0;

  // New tester check
  if (totalTasks < 2) {
    return {
      reputation_score: Math.min(40, 30 + totalTasks * 5),
      reputation_level: "New Tester",
      approval_rate: totalTasks > 0 ? (approvedTasks / totalTasks) * 100 : 0,
      average_proof_confidence: proofHistory.avg_confidence || 0,
      completion_rate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      on_time_completion_rate: totalTasks > 0 ? (onTimeTasks / totalTasks) * 100 : 0,
      admin_rating_score: (adminRating.score || 0) * 20,
      similar_task_performance: 0,
      penalty_score: 0,
      risk_level: "low",
      strengths: ["New tester — fresh potential"],
      weaknesses: ["Insufficient history for full evaluation"],
      reason: "New tester with limited task history. Eligible for low-to-medium difficulty tasks.",
    };
  }

  const approvalRate = totalTasks > 0 ? (approvedTasks / totalTasks) * 100 : 0;
  const avgProofConf = (proofHistory.avg_confidence || 0.7) * 100;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const onTimeRate = totalTasks > 0 ? (onTimeTasks / totalTasks) * 100 : 0;
  const adminScore = (adminRating.score || 3) * 20; // 0-5 → 0-100

  // Similar task performance
  const testerTaskTypes = history.task_types || [];
  const overlap = testerTaskTypes.filter((t: string) => taskTypes.includes(t)).length;
  const similarTaskPerf = Math.min(100, overlap * 25 + (approvalRate * 0.5));

  // Penalty calculation
  const dupCount = duplicates.count || 0;
  const suspCount = proofHistory.suspicious_count || 0;
  const rejRate = totalTasks > 0 ? (rejectedTasks / totalTasks) * 100 : 0;
  const lateCount = (totalTasks - onTimeTasks);

  const dupPenalty = dupCount * 15;
  const suspPenalty = suspCount * 10;
  const rejPenalty = rejRate > 30 ? (rejRate - 30) * 0.5 : 0;
  const latePenalty = lateCount > 3 ? (lateCount - 3) * 2 : 0;
  const incompletePenalty = totalTasks > 0 ? Math.max(0, (1 - completionRate / 100) * 15) : 0;
  const totalPenalty = Math.min(50, dupPenalty + suspPenalty + rejPenalty + latePenalty + incompletePenalty);

  // Weighted formula
  const rawScore =
    approvalRate * 0.25 +
    avgProofConf * 0.20 +
    completionRate * 0.15 +
    onTimeRate * 0.15 +
    adminScore * 0.15 +
    similarTaskPerf * 0.10 -
    totalPenalty;

  const finalScore = Math.max(0, Math.min(100, rawScore));

  let level = "Low Reputation Tester";
  if (finalScore >= 90) level = "Elite Tester";
  else if (finalScore >= 75) level = "Trusted Tester";
  else if (finalScore >= 60) level = "Normal Tester";
  else if (finalScore >= 40) level = "Risk Tester";

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (approvalRate >= 80) strengths.push("High approval rate");
  if (avgProofConf >= 80) strengths.push("Strong proof quality");
  if (onTimeRate >= 85) strengths.push("Excellent on-time delivery");
  if (adminScore >= 80) strengths.push("Highly rated by admins");
  if (overlap > 0) strengths.push("Experience in similar task types");
  if (dupCount > 0) weaknesses.push(`${dupCount} duplicate submission(s) detected`);
  if (suspCount > 0) weaknesses.push(`${suspCount} suspicious submission(s) flagged`);
  if (rejRate > 30) weaknesses.push("High rejection rate");
  if (onTimeRate < 70) weaknesses.push("Frequent late submissions");
  if (completionRate < 80) weaknesses.push("Incomplete task history");

  return {
    reputation_score: Math.round(finalScore),
    reputation_level: level,
    approval_rate: Math.round(approvalRate),
    average_proof_confidence: Math.round(avgProofConf),
    completion_rate: Math.round(completionRate),
    on_time_completion_rate: Math.round(onTimeRate),
    admin_rating_score: Math.round(adminScore),
    similar_task_performance: Math.round(similarTaskPerf),
    penalty_score: Math.round(totalPenalty),
    risk_level: dupCount > 1 || suspCount > 1 ? "high" : dupCount > 0 || rejRate > 40 ? "medium" : "low",
    strengths: strengths.length > 0 ? strengths : ["Consistent performer"],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["No significant issues detected"],
    reason: `Score derived from ${totalTasks} tasks with ${Math.round(approvalRate)}% approval rate and ${Math.round(completionRate)}% completion rate.`,
  };
}

function computeRecommendationScore(
  tester: any,
  repScore: any,
  taskRequirements: any,
  availability: any
): any {
  const requiredSkills: string[] = taskRequirements.required_skills || [];
  const requiredPlatform: string = taskRequirements.required_platform || "";
  const difficulty: string = taskRequirements.difficulty_level || "medium";

  const testerSkills: string[] = tester.skills || [];
  const testerPlatforms: string[] = tester.platforms || [];

  // Skill match
  const matchedSkills = requiredSkills.filter((s: string) =>
    testerSkills.some((ts: string) => ts.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ts.toLowerCase()))
  );
  const missingSkills = requiredSkills.filter((s: string) =>
    !testerSkills.some((ts: string) => ts.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ts.toLowerCase()))
  );
  const skillMatchScore = requiredSkills.length > 0
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : 60;

  // Platform match
  const platformMatch = !requiredPlatform || testerPlatforms.some((p: string) =>
    p.toLowerCase().includes(requiredPlatform.toLowerCase()) ||
    requiredPlatform.toLowerCase().includes(p.toLowerCase())
  );
  const platformMatchScore = platformMatch ? 100 : 30;

  // Availability
  const isAvailable = availability?.is_available !== false;
  const currentWorkload = availability?.current_tasks || 0;
  const availabilityScore = isAvailable ? 100 : 20;
  const workloadScore = currentWorkload >= 5 ? 30 : currentWorkload >= 3 ? 60 : 100;

  // Deadline suitability
  const deadlineUrgency = taskRequirements.deadline_urgency || "normal";
  const deadlineScore = deadlineUrgency === "urgent"
    ? (isAvailable ? 90 : 30)
    : 80;

  // Exclude low-rep testers from high difficulty tasks
  const repNum = repScore.reputation_score || 0;
  const diffPenalty = difficulty === "high" || difficulty === "expert"
    ? (repNum < 60 ? 25 : 0)
    : difficulty === "medium"
    ? (repNum < 40 ? 15 : 0)
    : 0;

  const dupPenalty = (tester.duplicate_history?.count || 0) > 0 ? 20 : 0;
  const riskPenalty = repScore.risk_level === "high" ? 20 : repScore.risk_level === "medium" ? 10 : 0;
  const totalRiskPenalty = Math.min(40, diffPenalty + dupPenalty + riskPenalty);

  const rawRec =
    skillMatchScore * 0.30 +
    (repNum) * 0.20 +
    (repScore.similar_task_performance || 0) * 0.20 +
    platformMatchScore * 0.10 +
    availabilityScore * 0.10 +
    deadlineScore * 0.05 +
    workloadScore * 0.05 -
    totalRiskPenalty;

  const recScore = Math.max(0, Math.min(100, Math.round(rawRec)));

  let status = "not_recommended";
  if (!isAvailable && recScore < 50) status = "not_recommended";
  else if (recScore >= 75) status = "highly_recommended";
  else if (recScore >= 55) status = "recommended";
  else if (recScore >= 35) status = "backup";

  const risks: string[] = [];
  if (!isAvailable) risks.push("Tester is currently unavailable");
  if (currentWorkload >= 4) risks.push("High current workload");
  if ((tester.duplicate_history?.count || 0) > 0) risks.push("History of duplicate submissions");
  if (repScore.risk_level === "high") risks.push("High risk profile");
  if (missingSkills.length > 0) risks.push(`Missing skills: ${missingSkills.slice(0, 2).join(", ")}`);

  return {
    recommendation_score: recScore,
    recommendation_status: status,
    skill_match_score: skillMatchScore,
    platform_match_score: platformMatchScore,
    similar_task_performance_score: repScore.similar_task_performance || 0,
    availability_score: availabilityScore,
    deadline_suitability_score: deadlineScore,
    workload_balance_score: workloadScore,
    risk_penalty: totalRiskPenalty,
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    reason: `${recScore >= 75 ? "Strong" : recScore >= 55 ? "Good" : recScore >= 35 ? "Moderate" : "Poor"} match. Skill overlap: ${matchedSkills.length}/${requiredSkills.length}.`,
    risks,
  };
}

// ─── Groq LLM Orchestration ──────────────────────────────────────────────────
async function runGroqReputation(groqKey: string, payload: any): Promise<any> {
  const systemPrompt = `You are an AI-powered Tester Reputation Scoring and Task Recommendation Engine.
Your role is to evaluate testers based on their reliability, proof quality, task history, duplicate behavior, completion consistency, skills, platforms, and admin feedback. You must also recommend the best testers for a specific task based on skill match, reputation, past performance, availability, and task requirements.
You must behave like a fair but strict evaluation system.
Return ONLY valid JSON. Do not include markdown. Do not write explanations outside JSON. All scores must be numbers between 0 and 100.`;

  const userPrompt = `Analyze the following data and return the result in the exact JSON format specified.

Current Task:
${JSON.stringify(payload.current_task, null, 2)}

Task Requirements:
${JSON.stringify(payload.task_requirements, null, 2)}

Maximum Testers Required:
${payload.max_testers_required}

Tester Profiles:
${JSON.stringify(payload.tester_profiles, null, 2)}

Tester Task History:
${JSON.stringify(payload.tester_task_history, null, 2)}

Proof Verification History:
${JSON.stringify(payload.proof_verification_history, null, 2)}

Duplicate Submission History:
${JSON.stringify(payload.duplicate_submission_history, null, 2)}

Admin Ratings and Feedback:
${JSON.stringify(payload.admin_ratings_feedback, null, 2)}

Tester Availability:
${JSON.stringify(payload.tester_availability, null, 2)}

Return JSON exactly in this schema:
{
  "task_analysis": {
    "task_id": "",
    "task_type": "",
    "required_skills": [],
    "required_platform": "",
    "difficulty_level": "",
    "deadline_urgency": "",
    "risk_level": "",
    "expected_tester_experience": "",
    "number_of_testers_required": 0
  },
  "reputation_scoring": [
    {
      "tester_id": "",
      "tester_name": "",
      "reputation_score": 0,
      "reputation_level": "",
      "approval_rate": 0,
      "average_proof_confidence": 0,
      "completion_rate": 0,
      "on_time_completion_rate": 0,
      "admin_rating_score": 0,
      "similar_task_performance": 0,
      "penalty_score": 0,
      "risk_level": "",
      "strengths": [],
      "weaknesses": [],
      "reason": ""
    }
  ],
  "task_recommendations": [
    {
      "rank": 1,
      "tester_id": "",
      "tester_name": "",
      "recommendation_score": 0,
      "recommendation_status": "highly_recommended",
      "skill_match_score": 0,
      "platform_match_score": 0,
      "similar_task_performance_score": 0,
      "availability_score": 0,
      "deadline_suitability_score": 0,
      "workload_balance_score": 0,
      "risk_penalty": 0,
      "matched_skills": [],
      "missing_skills": [],
      "reason": "",
      "risks": []
    }
  ],
  "final_recommended_testers": [
    {
      "rank": 1,
      "tester_id": "",
      "tester_name": "",
      "final_score": 0,
      "reason": ""
    }
  ],
  "summary": {
    "total_testers_analyzed": 0,
    "total_testers_recommended": 0,
    "best_match_tester_id": "",
    "recommendation_quality": "",
    "notes": []
  }
}`;

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
      max_tokens: 4000,
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || "{}";
  const cleaned = rawContent.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned);
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    const {
      current_task,
      task_requirements,
      max_testers_required = 3,
      tester_profiles = [],
      tester_task_history = {},
      proof_verification_history = {},
      duplicate_submission_history = {},
      admin_ratings_feedback = {},
      tester_availability = {},
    } = payload;

    const groqKey = Deno.env.get("GROQ_API_KEY") ?? "";

    // Try Groq first
    if (groqKey && tester_profiles.length > 0) {
      try {
        const llmResult = await runGroqReputation(groqKey, payload);
        if (llmResult?.reputation_scoring && llmResult?.task_recommendations) {
          return jsonResponse({ success: true, source: "groq", ...llmResult });
        }
      } catch (groqErr: any) {
        console.error("Groq failed, falling back to math engine:", groqErr.message);
      }
    }

    // ── Fallback Math Engine ──────────────────────────────────────────────────
    const taskTypes: string[] = (task_requirements?.required_skills || []).concat(
      current_task?.test_types || []
    );

    // Task analysis
    const taskAnalysis = {
      task_id: current_task?.id || "",
      task_type: (current_task?.test_types || []).join(", ") || "Software Testing",
      required_skills: task_requirements?.required_skills || current_task?.test_types || [],
      required_platform: task_requirements?.platform || "Web",
      difficulty_level: current_task?.testing_level || "intermediate",
      deadline_urgency: task_requirements?.deadline_urgency || "normal",
      risk_level: current_task?.testing_level === "expert" ? "high" : "medium",
      expected_tester_experience: current_task?.testing_level || "intermediate",
      number_of_testers_required: max_testers_required,
    };

    // Merge per-tester data
    const reputationScoring: any[] = [];
    for (const tester of tester_profiles) {
      const tid = tester.id;
      const mergedTester = {
        ...tester,
        task_history: tester_task_history[tid] || {},
        proof_history: proof_verification_history[tid] || {},
        duplicate_history: duplicate_submission_history[tid] || {},
        admin_rating: admin_ratings_feedback[tid] || {},
      };
      const repData = computeReputationScore(mergedTester, taskTypes);
      reputationScoring.push({
        tester_id: tid,
        tester_name: tester.name || "Unknown",
        ...repData,
      });
    }

    // Recommendation scoring
    const taskRecommendations: any[] = [];
    for (const repEntry of reputationScoring) {
      const tester = tester_profiles.find((t: any) => t.id === repEntry.tester_id);
      const avail = tester_availability[repEntry.tester_id] || {};
      const recData = computeRecommendationScore(tester, repEntry, taskAnalysis, avail);
      taskRecommendations.push({
        tester_id: repEntry.tester_id,
        tester_name: repEntry.tester_name,
        ...recData,
      });
    }

    // Sort by recommendation score descending, assign ranks
    taskRecommendations.sort((a, b) => b.recommendation_score - a.recommendation_score);
    taskRecommendations.forEach((r, i) => { r.rank = i + 1; });

    // Final recommended testers (top N by max_testers_required, only recommended/highly_recommended)
    const eligible = taskRecommendations
      .filter(r => ["highly_recommended", "recommended"].includes(r.recommendation_status))
      .slice(0, max_testers_required);

    const finalRecommended = eligible.map((r, i) => ({
      rank: i + 1,
      tester_id: r.tester_id,
      tester_name: r.tester_name,
      final_score: r.recommendation_score,
      reason: r.reason,
    }));

    const recommendedCount = finalRecommended.length;
    const bestMatch = taskRecommendations[0]?.tester_id || "";
    const quality =
      recommendedCount >= max_testers_required
        ? "Excellent — enough qualified testers found"
        : recommendedCount > 0
        ? "Good — some qualified testers available"
        : "Poor — insufficient qualified testers";

    const notes: string[] = [];
    const newTesters = reputationScoring.filter(r => r.reputation_level === "New Tester").length;
    const highRisk = reputationScoring.filter(r => r.risk_level === "high").length;
    if (newTesters > 0) notes.push(`${newTesters} new tester(s) evaluated — suitable for low/medium tasks only`);
    if (highRisk > 0) notes.push(`${highRisk} tester(s) flagged as high risk — not recommended for critical tasks`);
    if (recommendedCount < max_testers_required) notes.push("Fewer qualified testers than required — consider expanding the tester pool");

    return jsonResponse({
      success: true,
      source: "math_engine",
      task_analysis: taskAnalysis,
      reputation_scoring: reputationScoring,
      task_recommendations: taskRecommendations,
      final_recommended_testers: finalRecommended,
      summary: {
        total_testers_analyzed: tester_profiles.length,
        total_testers_recommended: recommendedCount,
        best_match_tester_id: bestMatch,
        recommendation_quality: quality,
        notes,
      },
    });
  } catch (error: any) {
    console.error("tester-reputation Edge Function Error:", error.message);
    return jsonResponse({ error: error.message }, 500);
  }
});
