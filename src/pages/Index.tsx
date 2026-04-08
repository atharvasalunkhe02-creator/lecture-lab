import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import HeroSection from "@/components/HeroSection";
import ResultsSection from "@/components/ResultsSection";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import { QuizQuestion, QuizResults } from "@/components/QuizView";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [lectureId, setLectureId] = useState<string | null>(null);
  const [results, setResults] = useState<{
    title: string;
    summary: string;
    mindmap: string;
    quiz: QuizQuestion[];
    topics: string[];
    notes: string;
    url: string;
  } | null>(null);

  const handleSubmit = async (url: string) => {
    setIsLoading(true);
    setResults(null);
    setLectureId(null);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-lecture`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ url }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${resp.status})`);
      }

      const data = await resp.json();
      setResults({
        title: data.title || "Untitled Lecture",
        summary: data.summary,
        mindmap: data.mindmap,
        quiz: data.quiz,
        topics: data.topics || [],
        notes: data.notes || "",
        url,
      });

      if (user) {
        const { data: lectureData } = await supabase
          .from("lectures")
          .insert({
            user_id: user.id,
            url,
            title: data.title || "Untitled Lecture",
            summary: data.summary,
            mindmap: data.mindmap,
            quiz: data.quiz,
          })
          .select("id")
          .single();
        if (lectureData) setLectureId(lectureData.id);
      }
    } catch (err: any) {
      console.error("Processing error:", err);
      toast({
        title: "Processing failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = async (quizResults: QuizResults) => {
    if (!user) return;

    try {
      const { data: sessionData } = await supabase
        .from("quiz_sessions")
        .insert({
          user_id: user.id,
          lecture_id: lectureId,
          total_questions: quizResults.totalQuestions,
          correct_answers: quizResults.correctAnswers,
          score_percentage: quizResults.scorePercentage,
          duration_seconds: quizResults.durationSeconds,
          topic_scores: quizResults.topicScores,
        })
        .select("id")
        .single();

      if (sessionData) {
        const answerRows = quizResults.answers.map((a) => ({
          session_id: sessionData.id,
          question_index: a.questionIndex,
          question_text: a.questionText,
          selected_option: a.selectedOption,
          correct_option: a.correctOption,
          is_correct: a.isCorrect,
          topic: a.topic,
          difficulty: a.difficulty,
        }));
        await supabase.from("quiz_answers").insert(answerRows);

        for (const [topic, scores] of Object.entries(quizResults.topicScores)) {
          const { data: existing } = await supabase
            .from("learning_progress")
            .select("*")
            .eq("user_id", user.id)
            .eq("topic", topic)
            .maybeSingle();

          if (existing) {
            const newAttempted = (existing as any).questions_attempted + scores.total;
            const newCorrect = (existing as any).questions_correct + scores.correct;
            const mastery = Math.round((newCorrect / newAttempted) * 100);
            await supabase
              .from("learning_progress")
              .update({
                questions_attempted: newAttempted,
                questions_correct: newCorrect,
                mastery_level: mastery,
                last_practiced: new Date().toISOString(),
              })
              .eq("id", (existing as any).id);
          } else {
            const mastery = Math.round((scores.correct / scores.total) * 100);
            await supabase.from("learning_progress").insert({
              user_id: user.id,
              topic,
              questions_attempted: scores.total,
              questions_correct: scores.correct,
              mastery_level: mastery,
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to save quiz results:", err);
    }
  };

  return (
    <main className="min-h-screen bg-background pt-14">
      <HeroSection onSubmit={handleSubmit} isLoading={isLoading} />
      <ProcessingIndicator isLoading={isLoading} />
      {results && (
        <ResultsSection
          summary={results.summary}
          mindmap={results.mindmap}
          quiz={results.quiz}
          topics={results.topics}
          notes={results.notes}
          title={results.title}
          onQuizComplete={handleQuizComplete}
        />
      )}
    </main>
  );
};

export default Index;
