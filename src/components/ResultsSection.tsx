import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, GitBranch, HelpCircle, MessageCircleQuestion, BookMarked } from "lucide-react";
import SummaryView from "./SummaryView";
import MindmapView from "./MindmapView";
import QuizView, { QuizQuestion, QuizResults } from "./QuizView";
import DoubtSolver from "./DoubtSolver";
import NotesView from "./NotesView";

interface ResultsSectionProps {
  summary: string;
  mindmap: string;
  quiz: QuizQuestion[];
  topics?: string[];
  notes?: string;
  title?: string;
  onQuizComplete?: (results: QuizResults) => void;
}

type Tab = "summary" | "notes" | "mindmap" | "quiz" | "doubt";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "summary", label: "Summary", icon: <FileText className="w-4 h-4" /> },
  { id: "notes", label: "Notes", icon: <BookMarked className="w-4 h-4" /> },
  { id: "mindmap", label: "Mindmap", icon: <GitBranch className="w-4 h-4" /> },
  { id: "quiz", label: "Quiz", icon: <HelpCircle className="w-4 h-4" /> },
  { id: "doubt", label: "Ask AI", icon: <MessageCircleQuestion className="w-4 h-4" /> },
];

const ResultsSection = ({ summary, mindmap, quiz, topics = [], notes = "", title, onQuizComplete }: ResultsSectionProps) => {
  const [active, setActive] = useState<Tab>("summary");

  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-8 w-fit mx-auto flex-wrap justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${active === tab.id
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-card">
          {active === "summary" && <SummaryView markdown={summary} />}
          {active === "notes" && <NotesView notes={notes} title={title} />}
          {active === "mindmap" && <MindmapView chart={mindmap} />}
          {active === "quiz" && <QuizView questions={quiz} onQuizComplete={onQuizComplete} />}
          {active === "doubt" && <DoubtSolver summary={summary} topics={topics} />}
        </div>
      </motion.div>
    </section>
  );
};

export default ResultsSection;
