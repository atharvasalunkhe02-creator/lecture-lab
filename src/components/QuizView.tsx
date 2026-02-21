import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizViewProps {
  questions: QuizQuestion[];
}

const QuizView = ({ questions }: QuizViewProps) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[currentQ];
  const isCorrect = selected === q?.correctIndex;

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === q.correctIndex) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentQ((c) => c + 1);
      setSelected(null);
    }
  };

  const handleReset = () => {
    setCurrentQ(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="text-6xl font-bold text-primary mb-2">{pct}%</div>
        <p className="text-lg text-muted-foreground mb-1">
          {score} of {questions.length} correct
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          {pct >= 80 ? "Excellent work! 🎉" : pct >= 50 ? "Good effort! Keep studying. 📚" : "Keep learning, you'll get there! 💪"}
        </p>
        <Button onClick={handleReset} variant="outline" className="gap-2">
          <RotateCcw className="w-4 h-4" /> Try Again
        </Button>
      </motion.div>
    );
  }

  if (!q) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-muted-foreground">
          Question {currentQ + 1} of {questions.length}
        </span>
        <span className="text-sm font-medium text-primary">
          Score: {score}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full gradient-warm rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <h3 className="text-lg font-semibold mb-6 leading-relaxed">{q.question}</h3>

      <div className="space-y-3">
        {q.options.map((opt, idx) => {
          let variant = "border-border bg-card hover:border-primary/30 hover:bg-primary/5";
          if (selected !== null) {
            if (idx === q.correctIndex) variant = "border-green-500/50 bg-green-500/10";
            else if (idx === selected) variant = "border-destructive/50 bg-destructive/10";
            else variant = "border-border bg-card opacity-50";
          }

          return (
            <motion.button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${variant}`}
              whileHover={selected === null ? { scale: 1.01 } : {}}
              whileTap={selected === null ? { scale: 0.99 } : {}}
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm leading-relaxed pt-0.5">{opt}</span>
                {selected !== null && idx === q.correctIndex && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto flex-shrink-0 mt-0.5" />
                )}
                {selected === idx && idx !== q.correctIndex && (
                  <XCircle className="w-5 h-5 text-destructive ml-auto flex-shrink-0 mt-0.5" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <div className={`p-4 rounded-xl text-sm leading-relaxed ${isCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-destructive/10 border border-destructive/20"}`}>
              <span className="font-semibold">{isCorrect ? "Correct! " : "Incorrect. "}</span>
              {q.explanation}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleNext} className="gap-2 gradient-warm shadow-warm">
                {currentQ + 1 >= questions.length ? "See Results" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuizView;
