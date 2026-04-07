import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, Target, BookOpen, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface QuizQuestion {
  question: string;
  type?: "mcq" | "true_false" | "short_answer";
  options: string[];
  correctIndex: number;
  correctAnswer?: string;
  explanation: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
}

interface QuizViewProps {
  questions: QuizQuestion[];
  onQuizComplete?: (results: QuizResults) => void;
}

export interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  answers: AnswerRecord[];
  topicScores: Record<string, { correct: number; total: number }>;
  durationSeconds: number;
}

interface AnswerRecord {
  questionIndex: number;
  questionText: string;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  topic: string;
  difficulty: string;
  shortAnswerText?: string;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-500/10 text-green-400 border-green-500/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  hard: "bg-destructive/10 text-destructive border-destructive/20",
};

const QuizView = ({ questions, onQuizComplete }: QuizViewProps) => {
  const [filteredDifficulty, setFilteredDifficulty] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [shortAnswer, setShortAnswer] = useState("");
  const [shortAnswerChecked, setShortAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const startTime = useRef(Date.now());
  const questionStartTime = useRef(Date.now());

  const activeQuestions = filteredDifficulty
    ? questions.filter((q) => q.difficulty === filteredDifficulty)
    : questions;

  const q = activeQuestions[currentQ];

  const isShortAnswer = q?.type === "short_answer";
  const isCorrect = isShortAnswer
    ? shortAnswerChecked && q.correctAnswer?.toLowerCase().trim() === shortAnswer.toLowerCase().trim()
    : selected === q?.correctIndex;

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === q.correctIndex;
    if (correct) setScore((s) => s + 1);
    recordAnswer(idx, correct);
  };

  const handleShortAnswerSubmit = () => {
    if (shortAnswerChecked || !shortAnswer.trim()) return;
    setShortAnswerChecked(true);
    const correct = q.correctAnswer?.toLowerCase().trim() === shortAnswer.toLowerCase().trim();
    if (correct) setScore((s) => s + 1);
    recordAnswer(-1, !!correct);
  };

  const recordAnswer = (selectedIdx: number, correct: boolean) => {
    setAnswers((prev) => [
      ...prev,
      {
        questionIndex: currentQ,
        questionText: q.question,
        selectedOption: selectedIdx,
        correctOption: q.correctIndex,
        isCorrect: correct,
        topic: q.topic || "General",
        difficulty: q.difficulty || "medium",
        shortAnswerText: isShortAnswer ? shortAnswer : undefined,
      },
    ]);
  };

  const handleNext = () => {
    if (currentQ + 1 >= activeQuestions.length) {
      setFinished(true);
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      const topicScores: Record<string, { correct: number; total: number }> = {};
      const finalAnswers = [...answers];
      finalAnswers.forEach((a) => {
        if (!topicScores[a.topic]) topicScores[a.topic] = { correct: 0, total: 0 };
        topicScores[a.topic].total++;
        if (a.isCorrect) topicScores[a.topic].correct++;
      });
      onQuizComplete?.({
        totalQuestions: activeQuestions.length,
        correctAnswers: score,
        scorePercentage: Math.round((score / activeQuestions.length) * 100),
        answers: finalAnswers,
        topicScores,
        durationSeconds: duration,
      });
    } else {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setShortAnswer("");
      setShortAnswerChecked(false);
      questionStartTime.current = Date.now();
    }
  };

  const handleReset = () => {
    setCurrentQ(0);
    setSelected(null);
    setShortAnswer("");
    setShortAnswerChecked(false);
    setScore(0);
    setFinished(false);
    setShowAnalysis(false);
    setAnswers([]);
    startTime.current = Date.now();
  };

  if (finished) {
    const pct = Math.round((score / activeQuestions.length) * 100);
    const topicScores: Record<string, { correct: number; total: number }> = {};
    answers.forEach((a) => {
      if (!topicScores[a.topic]) topicScores[a.topic] = { correct: 0, total: 0 };
      topicScores[a.topic].total++;
      if (a.isCorrect) topicScores[a.topic].correct++;
    });
    const weakTopics = Object.entries(topicScores)
      .filter(([, v]) => v.correct / v.total < 0.5)
      .map(([k]) => k);
    const duration = Math.round((Date.now() - startTime.current) / 1000);

    if (showAnalysis) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Detailed Analysis</h3>
            <Button variant="outline" size="sm" onClick={() => setShowAnalysis(false)} className="gap-1">
              Back to Results
            </Button>
          </div>

          {/* Topic breakdown */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Topic Performance</h4>
            {Object.entries(topicScores).map(([topic, { correct, total }]) => {
              const topicPct = Math.round((correct / total) * 100);
              return (
                <div key={topic} className="p-4 rounded-xl border border-border bg-card/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{topic}</span>
                    <span className={`text-sm font-bold ${topicPct >= 70 ? "text-green-400" : topicPct >= 40 ? "text-primary" : "text-destructive"}`}>
                      {topicPct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${topicPct >= 70 ? "bg-green-500" : topicPct >= 40 ? "bg-primary" : "bg-destructive"}`}
                      style={{ width: `${topicPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{correct}/{total} correct</p>
                </div>
              );
            })}
          </div>

          {/* Question-by-question */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Question Review</h4>
            {answers.map((a, i) => (
              <div key={i} className={`p-4 rounded-xl border ${a.isCorrect ? "border-green-500/20 bg-green-500/5" : "border-destructive/20 bg-destructive/5"}`}>
                <div className="flex items-start gap-2">
                  {a.isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />}
                  <div>
                    <p className="text-sm font-medium">{a.questionText}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[a.difficulty] || difficultyColors.medium}`}>
                        {a.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground">{a.topic}</span>
                    </div>
                    {!a.isCorrect && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Correct answer: {activeQuestions[a.questionIndex]?.correctAnswer || activeQuestions[a.questionIndex]?.options[a.correctOption]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button onClick={handleReset} className="gap-2 gradient-warm shadow-warm">
              <RotateCcw className="w-4 h-4" /> Retry Quiz
            </Button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
        <div className="text-6xl font-bold text-primary mb-2">{pct}%</div>
        <p className="text-lg text-muted-foreground mb-1">
          {score} of {activeQuestions.length} correct
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          {pct >= 80 ? "Excellent work! 🎉" : pct >= 50 ? "Good effort! Keep studying. 📚" : "Keep learning, you'll get there! 💪"}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
          <div className="p-3 rounded-xl bg-card border border-border text-center">
            <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm font-bold">{Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}</div>
            <div className="text-xs text-muted-foreground">Time</div>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border text-center">
            <Target className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm font-bold">{Object.keys(topicScores).length}</div>
            <div className="text-xs text-muted-foreground">Topics</div>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border text-center">
            <Trophy className="w-4 h-4 mx-auto mb-1 text-primary" />
            <div className="text-sm font-bold">{pct >= 80 ? "A" : pct >= 60 ? "B" : pct >= 40 ? "C" : "D"}</div>
            <div className="text-xs text-muted-foreground">Grade</div>
          </div>
        </div>

        {weakTopics.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-left max-w-sm mx-auto">
            <p className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Weak Areas - Review These Topics
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {weakTopics.map((t) => (
                <li key={t} className="flex items-center gap-1">• {t}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={handleReset} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" /> Retry
          </Button>
          <Button onClick={() => setShowAnalysis(true)} className="gap-2 gradient-warm shadow-warm">
            View Analysis
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  if (!q) return null;

  const answered = isShortAnswer ? shortAnswerChecked : selected !== null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Difficulty filter (only before starting) */}
      {currentQ === 0 && selected === null && !shortAnswerChecked && (
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Filter:</span>
          {[null, "easy", "medium", "hard"].map((d) => (
            <button
              key={d || "all"}
              onClick={() => { setFilteredDifficulty(d); setCurrentQ(0); }}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                filteredDifficulty === d
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {d ? d.charAt(0).toUpperCase() + d.slice(1) : "All"}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            Q{currentQ + 1}/{activeQuestions.length}
          </span>
          {q.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[q.difficulty] || difficultyColors.medium}`}>
              {q.difficulty}
            </span>
          )}
          {q.type && q.type !== "mcq" && (
            <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">
              {q.type === "true_false" ? "True/False" : "Short Answer"}
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-primary">Score: {score}</span>
      </div>

      <div className="w-full h-1.5 bg-muted rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full gradient-warm rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentQ + 1) / activeQuestions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {q.topic && <p className="text-xs text-muted-foreground mb-2">Topic: {q.topic}</p>}
      <h3 className="text-lg font-semibold mb-6 leading-relaxed">{q.question}</h3>

      {isShortAnswer ? (
        <div className="space-y-3">
          <input
            type="text"
            value={shortAnswer}
            onChange={(e) => setShortAnswer(e.target.value)}
            disabled={shortAnswerChecked}
            placeholder="Type your answer..."
            className="w-full p-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={(e) => e.key === "Enter" && handleShortAnswerSubmit()}
          />
          {!shortAnswerChecked && (
            <Button onClick={handleShortAnswerSubmit} disabled={!shortAnswer.trim()} className="gap-2 gradient-warm shadow-warm">
              Submit Answer <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
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
      )}

      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <div className={`p-4 rounded-xl text-sm leading-relaxed ${isCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-destructive/10 border border-destructive/20"}`}>
              <span className="font-semibold">{isCorrect ? "Correct! " : "Incorrect. "}</span>
              {q.explanation}
              {isShortAnswer && !isCorrect && (
                <p className="mt-2 text-xs">Correct answer: <strong>{q.correctAnswer}</strong></p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleNext} className="gap-2 gradient-warm shadow-warm">
                {currentQ + 1 >= activeQuestions.length ? "See Results" : "Next"}
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
