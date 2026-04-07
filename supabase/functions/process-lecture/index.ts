import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an educational content analyst. Given the URL and any extracted content, produce outputs in a single JSON object:

1. "title": A short descriptive title for this lecture/content (max 80 chars).

2. "summary": A comprehensive Markdown summary of the content. Use headings (##), bullet points, bold for key terms. Include key takeaways section at the end.

3. "mindmap": Valid Mermaid.js flowchart code (using "graph TD" syntax) that represents the hierarchy and relationships of the key concepts. Keep node labels short (under 30 chars). Use meaningful IDs. Do NOT use special characters in labels except basic punctuation. Wrap labels in square brackets.

4. "topics": An array of 3-8 topic/concept strings extracted from the content (e.g. ["Machine Learning", "Neural Networks", "Gradient Descent"]).

5. "quiz": An array of 8-12 questions. Each object has:
   - "question": string
   - "type": "mcq" | "true_false" | "short_answer"
   - "options": string[] (4 options for mcq, ["True", "False"] for true_false, [] for short_answer)
   - "correctIndex": number (0-3 for mcq, 0 or 1 for true_false, -1 for short_answer)
   - "correctAnswer": string (the text of the correct answer, used for short_answer grading)
   - "explanation": string (brief explanation of the correct answer)
   - "topic": string (which topic this question tests)
   - "difficulty": "easy" | "medium" | "hard"

Mix question types: approximately 5 MCQs, 3 True/False, and 2-4 short-answer questions.
Distribute difficulties: 3-4 easy, 4-5 medium, 2-3 hard.

Return ONLY valid JSON. No markdown code fences. No extra text.`;

function isVideoUrl(url: string): boolean {
  const videoExts = /\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)(\?.*)?$/i;
  return videoExts.test(url);
}

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

    let pageContent = "";
    const isVideo = isVideoUrl(url);

    if (!isVideo) {
      try {
        const pageResp = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; LectureBot/1.0)" },
        });
        if (pageResp.ok) {
          const contentType = pageResp.headers.get("content-type") || "";
          if (contentType.includes("text") || contentType.includes("html") || contentType.includes("json")) {
            const text = await pageResp.text();
            pageContent = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 12000);
          }
        }
      } catch {
        // If fetching fails, the AI will work from the URL alone
      }
    }

    let userMessage: string;
    if (isVideo) {
      userMessage = `Analyze this video lecture from: ${url}\n\nThis is a video file URL. Since I cannot extract the audio/transcript directly, please analyze based on the URL context (filename, platform, etc.) and generate comprehensive educational materials. If the URL contains identifiable lecture information, use that. Otherwise, create a general educational analysis noting that this was a video upload.`;
    } else if (pageContent) {
      userMessage = `Analyze this lecture/content from: ${url}\n\nExtracted content:\n${pageContent}`;
    } else {
      userMessage = `Analyze this lecture/content from: ${url}\n\nI couldn't fetch the page content directly. Please use your knowledge to analyze what this URL likely contains and generate educational materials based on the URL context.`;
    }

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

    let parsed: any;
    try {
      let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const jsonStart = cleaned.search(/[\{\[]/);
      const jsonEnd = cleaned.lastIndexOf(jsonStart !== -1 && cleaned[jsonStart] === '[' ? ']' : '}');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        cleaned = cleaned
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]")
          .replace(/[\x00-\x1F\x7F]/g, " ");
        parsed = JSON.parse(cleaned);
      }
    } catch (e) {
      console.error("Failed to parse AI output:", raw.substring(0, 500));
      throw new Error("AI returned invalid format. Please try again.");
    }

    return new Response(
      JSON.stringify({
        title: parsed.title || "Untitled Lecture",
        summary: parsed.summary || "No summary generated.",
        mindmap: parsed.mindmap || "graph TD\n  A[No Data]",
        quiz: parsed.quiz || [],
        topics: parsed.topics || [],
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
