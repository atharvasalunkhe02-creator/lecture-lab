import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import HeroSection from "@/components/HeroSection";
import ResultsSection from "@/components/ResultsSection";
import { QuizQuestion } from "@/components/QuizView";

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    summary: string;
    mindmap: string;
    quiz: QuizQuestion[];
  } | null>(null);

  const handleSubmit = async (url: string) => {
    setIsLoading(true);
    setResults(null);

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
        summary: data.summary,
        mindmap: data.mindmap,
        quiz: data.quiz,
      });
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

  return (
    <main className="min-h-screen bg-background">
      <HeroSection onSubmit={handleSubmit} isLoading={isLoading} />
      {results && (
        <ResultsSection
          summary={results.summary}
          mindmap={results.mindmap}
          quiz={results.quiz}
        />
      )}
    </main>
  );
};

export default Index;
