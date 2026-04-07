import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, GitBranch, HelpCircle, MessageCircleQuestion } from "lucide-react";
import SummaryView from "./SummaryView";
import MindmapView from "./MindmapView";
import QuizView, { QuizQuestion, QuizResults } from "./QuizView";
import DoubtSolver from "./DoubtSolver";

interface ResultsSectionProps {
  summary: string;
  mindmap: string;
  quiz: QuizQuestion[];
  topics?: string[];
  onQuizComplete?: (results: QuizResults) => void;
}

type Tab = "summary" | "mindmap" | "quiz" | "doubt";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "summary", label: "Summary", icon: <FileText className="w-4 h-4" /> },
  { id: "mindmap", label: "Mindmap", icon: <GitBranch className="w-4 h-4" /> },
  { id: "quiz", label: "Quiz", icon: <HelpCircle className="w-4 h-4" /> },
  { id: "doubt", label: "Ask AI", icon: <MessageCircleQuestion className="w-4 h-4" /> },
];

const ResultsSection = ({ summary, mindmap, quiz, topics = [], onQuizComplete }: ResultsSectionProps) => {
  const [active, setActive] = useState<Tab>("summary");

  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-8 w-fit mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${active === tab.id
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-card">
          {active === "summary" && <SummaryView markdown={summary} />}
          {active === "mindmap" && <MindmapView chart={mindmap} />}
          {active === "quiz" && <QuizView questions={quiz} onQuizComplete={onQuizComplete} />}
          {active === "doubt" && <DoubtSolver summary={summary} topics={topics} />}
        </div>
      </motion.div>
    </section>
  );
};

export default ResultsSection;
