import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Trophy, Target, BookOpen, Clock, TrendingUp, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface LectureRecord {
  id: string;
  title: string;
  url: string;
  created_at: string;
}

interface QuizSession {
  id: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  difficulty: string;
  duration_seconds: number;
  topic_scores: Record<string, { correct: number; total: number }>;
  created_at: string;
}

interface TopicProgress {
  topic: string;
  mastery_level: number;
  questions_attempted: number;
  questions_correct: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lectures, setLectures] = useState<LectureRecord[]>([]);
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [lectureRes, sessionRes, progressRes] = await Promise.all([
      supabase.from("lectures").select("id, title, url, created_at").order("created_at", { ascending: false }).limit(20),
      supabase.from("quiz_sessions").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("learning_progress").select("*").order("mastery_level", { ascending: false }),
    ]);

    if (lectureRes.data) setLectures(lectureRes.data);
    if (sessionRes.data) setSessions(sessionRes.data as any);
    if (progressRes.data) setProgress(progressRes.data as any);
    setLoading(false);
  };

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + Number(s.score_percentage), 0) / sessions.length)
    : 0;

  const totalQuestions = sessions.reduce((sum, s) => sum + s.total_questions, 0);
  const totalCorrect = sessions.reduce((sum, s) => sum + s.correct_answers, 0);
  const totalTime = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);

  const weakTopics = progress.filter((p) => p.mastery_level < 50);
  const strongTopics = progress.filter((p) => p.mastery_level >= 70);

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center pt-14">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero pt-20 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Learning Dashboard</h1>
            <p className="text-sm text-muted-foreground">Track your progress and master topics</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: BookOpen, label: "Lectures", value: lectures.length, color: "text-primary" },
            { icon: Trophy, label: "Avg Score", value: `${avgScore}%`, color: "text-green-400" },
            { icon: Target, label: "Questions", value: `${totalCorrect}/${totalQuestions}`, color: "text-blue-400" },
            { icon: Clock, label: "Study Time", value: `${Math.round(totalTime / 60)}m`, color: "text-purple-400" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-xl border border-border bg-card"
            >
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Topic Mastery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl border border-border bg-card"
          >
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              Topic Mastery
            </h3>
            {progress.length === 0 ? (
              <p className="text-sm text-muted-foreground">Complete quizzes to see topic mastery.</p>
            ) : (
              <div className="space-y-3">
                {progress.slice(0, 8).map((p) => {
                  const level = Number(p.mastery_level);
                  return (
                    <div key={p.topic}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate mr-2">{p.topic}</span>
                        <span className={`font-bold ${level >= 70 ? "text-green-400" : level >= 40 ? "text-primary" : "text-destructive"}`}>
                          {level}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${level >= 70 ? "bg-green-500" : level >= 40 ? "bg-primary" : "bg-destructive"}`}
                          style={{ width: `${level}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-xl border border-border bg-card"
          >
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              Recent Quiz Scores
            </h3>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Take a quiz to see your performance.</p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 8).map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <span className="text-sm font-medium">{s.correct_answers}/{s.total_questions} correct</span>
                      <span className="text-xs text-muted-foreground ml-2">{s.difficulty}</span>
                    </div>
                    <span className={`text-sm font-bold ${Number(s.score_percentage) >= 70 ? "text-green-400" : Number(s.score_percentage) >= 40 ? "text-primary" : "text-destructive"}`}>
                      {Number(s.score_percentage)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Weak Areas */}
          {weakTopics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 md:col-span-2"
            >
              <h3 className="font-semibold flex items-center gap-2 mb-3 text-destructive">
                <Target className="w-4 h-4" />
                Areas Needing Improvement
              </h3>
              <div className="flex flex-wrap gap-2">
                {weakTopics.map((t) => (
                  <span key={t.topic} className="text-xs px-3 py-1.5 rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
                    {t.topic} ({Number(t.mastery_level)}%)
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Lecture History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-xl border border-border bg-card md:col-span-2"
          >
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-primary" />
              Lecture History
            </h3>
            {lectures.length === 0 ? (
              <p className="text-sm text-muted-foreground">Process a lecture to see your history.</p>
            ) : (
              <div className="space-y-2">
                {lectures.map((l) => (
                  <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="truncate mr-4">
                      <span className="text-sm font-medium">{l.title || "Untitled"}</span>
                      <span className="text-xs text-muted-foreground block truncate">{l.url}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(l.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
