import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an educational content analyst. Given the URL and any extracted content, produce three outputs in a single JSON object:

1. "summary": A comprehensive Markdown summary of the content. Use headings (##), bullet points, bold for key terms.

2. "mindmap": Valid Mermaid.js flowchart code (using "graph TD" syntax) that represents the hierarchy and relationships of the key concepts. Keep node labels short (under 30 chars). Use meaningful IDs. Do NOT use special characters in labels except basic punctuation. Wrap labels in square brackets.

3. "quiz": An array of 5-7 multiple-choice questions. Each object has:
   - "question": string
   - "options": string[] (4 options)
   - "correctIndex": number (0-3)
   - "explanation": string (brief explanation of the correct answer)

Return ONLY valid JSON. No markdown code fences. No extra text.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Try to fetch the URL content for context
    let pageContent = "";
    try {
      const pageResp = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LectureBot/1.0)" },
      });
      if (pageResp.ok) {
        const text = await pageResp.text();
        // Strip HTML tags for a rough text extraction, limit to 12k chars
        pageContent = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 12000);
      }
    } catch {
      // If fetching fails, the AI will work from the URL alone
    }

    const userMessage = pageContent
      ? `Analyze this lecture/content from: ${url}\n\nExtracted content:\n${pageContent}`
      : `Analyze this lecture/content from: ${url}\n\nI couldn't fetch the page content directly. Please use your knowledge to analyze what this URL likely contains and generate educational materials based on the URL context.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI processing failed");
    }

    const aiData = await aiResponse.json();
    const raw = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from the AI response (strip potential code fences)
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI output:", raw);
      throw new Error("AI returned invalid format. Please try again.");
    }

    return new Response(
      JSON.stringify({
        summary: parsed.summary || "No summary generated.",
        mindmap: parsed.mindmap || "graph TD\n  A[No Data]",
        quiz: parsed.quiz || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("process-lecture error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
