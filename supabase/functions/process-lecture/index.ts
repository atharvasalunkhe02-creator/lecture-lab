import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an educational content analyst. Given the content provided, produce outputs in a single JSON object:

1. "title": A short descriptive title for this lecture/content (max 80 chars).

2. "summary": A comprehensive Markdown summary. Use headings (##), bullet points, bold for key terms. Include a "## Key Takeaways" section at the end.

3. "mindmap": Valid Mermaid.js flowchart code (using "graph TD" syntax) representing the hierarchy and relationships of concepts. Keep node labels short (under 30 chars). Use meaningful IDs. Do NOT use special characters in labels except basic punctuation. Wrap labels in square brackets. Use --> for arrows.

4. "topics": An array of 3-8 topic/concept strings extracted from the content.

5. "notes": A structured Markdown document with these sections:
   - "## Key Definitions" - Important terms and their definitions as a bulleted list
   - "## Core Concepts" - Main ideas explained concisely
   - "## Important Formulas/Facts" - Any formulas, dates, statistics, or key facts
   - "## Quick Reference" - A compact reference table or list for revision

6. "quiz": An array of 10-12 questions. Each object has:
   - "question": string
   - "type": "mcq" | "true_false" | "short_answer"
   - "options": string[] (4 options for mcq, ["True", "False"] for true_false, [] for short_answer)
   - "correctIndex": number (0-3 for mcq, 0 or 1 for true_false, -1 for short_answer)
   - "correctAnswer": string (the text of the correct answer)
   - "explanation": string (brief explanation)
   - "topic": string (which topic this question tests)
   - "difficulty": "easy" | "medium" | "hard"

Mix question types: approximately 5 MCQs, 3 True/False, and 2-4 short-answer questions.
Distribute difficulties: 3-4 easy, 4-5 medium, 2-3 hard.

Return ONLY valid JSON. No markdown code fences. No extra text.`;

function isVideoUrl(url: string): boolean {
  const videoPatterns = /\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)(\?.*)?$/i;
  return videoPatterns.test(url);
}

function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isVideo = isVideoUrl(url);
    const isYT = isYouTubeUrl(url);

    // For video files, use Gemini multimodal with the video URL
    if (isVideo) {
      console.log("Processing video URL via multimodal:", url);

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this lecture video thoroughly and generate comprehensive educational materials. Watch/analyze the entire video content.`,
                },
                {
                  type: "image_url",
                  image_url: { url },
                },
              ],
            },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errText = await aiResponse.text();
        console.error("Multimodal AI error:", status, errText);
        
        // Fallback: try text-only with URL context
        console.log("Falling back to text-only analysis...");
        return await processWithText(url, LOVABLE_API_KEY, `This is a video lecture uploaded at: ${url}. The video could not be analyzed directly. Based on the filename and any context from the URL, generate educational materials. If you cannot determine the content, create a general analysis noting this was a video upload and suggest the user try with a text-based source for better results.`);
      }

      return parseAndRespond(aiResponse);
    }

    // For non-video URLs, extract text content
    let pageContent = "";
    try {
      console.log("Fetching page content from:", url);
      const pageResp = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LectureBot/1.0)" },
      });
      if (pageResp.ok) {
        const contentType = pageResp.headers.get("content-type") || "";
        if (contentType.includes("text") || contentType.includes("html") || contentType.includes("json")) {
          const text = await pageResp.text();
          pageContent = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 15000);
          console.log(`Extracted ${pageContent.length} chars of text content`);
        }
      }
    } catch (e) {
      console.log("Could not fetch page content:", e);
    }

    let userMessage: string;
    if (isYT) {
      userMessage = `Analyze this YouTube lecture: ${url}\n\nThis is a YouTube video. Please analyze the video content based on the URL and any metadata available. Generate comprehensive educational materials.`;
      if (pageContent) {
        userMessage += `\n\nPage metadata:\n${pageContent.slice(0, 3000)}`;
      }
    } else if (pageContent) {
      userMessage = `Analyze this lecture/content from: ${url}\n\nExtracted content:\n${pageContent}`;
    } else {
      userMessage = `Analyze this lecture/content from: ${url}\n\nI couldn't fetch the page content. Please analyze based on the URL context and generate educational materials.`;
    }

    return await processWithText(url, LOVABLE_API_KEY, userMessage);
  } catch (e) {
    console.error("process-lecture error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processWithText(url: string, apiKey: string, userMessage: string) {
  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
    const status = aiResponse.status;
    if (status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const errText = await aiResponse.text();
    console.error("AI gateway error:", status, errText);
    throw new Error("AI processing failed");
  }

  return parseAndRespond(aiResponse);
}

async function parseAndRespond(aiResponse: Response) {
  const aiData = await aiResponse.json();
  const raw = aiData.choices?.[0]?.message?.content || "";
  console.log("AI response length:", raw.length);

  let parsed: any;
  try {
    let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonStart = cleaned.search(/\{/);
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON object found");
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      cleaned = cleaned
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/[\x00-\x1F\x7F]/g, " ")
        .replace(/\\\n/g, "\\n")
        .replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, "\\\\");
      parsed = JSON.parse(cleaned);
    }
  } catch (e) {
    console.error("JSON parse error:", e, "Raw start:", raw.substring(0, 300));
    throw new Error("AI returned invalid format. Please try again.");
  }

  return new Response(
    JSON.stringify({
      title: parsed.title || "Untitled Lecture",
      summary: parsed.summary || "No summary generated.",
      mindmap: parsed.mindmap || "graph TD\n  A[No Data]",
      quiz: Array.isArray(parsed.quiz) ? parsed.quiz : [],
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      notes: parsed.notes || "",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
