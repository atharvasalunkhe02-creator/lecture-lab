import { motion } from "framer-motion";
import { Loader2, CheckCircle2, FileSearch, Brain, HelpCircle, BookOpen } from "lucide-react";

const steps = [
  { icon: FileSearch, label: "Fetching content" },
  { icon: Brain, label: "Analyzing with AI" },
  { icon: BookOpen, label: "Generating summary & notes" },
  { icon: HelpCircle, label: "Creating quiz questions" },
];

interface ProcessingIndicatorProps {
  isLoading: boolean;
}

const ProcessingIndicator = ({ isLoading }: ProcessingIndicatorProps) => {
  if (!isLoading) return null;

  return (
    <section className="max-w-lg mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-8 shadow-card"
      >
        <div className="flex items-center gap-3 mb-6">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <h3 className="text-lg font-semibold">Processing your lecture...</h3>
        </div>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 2, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 2, duration: 0.3 }}
              >
                <step.icon className="w-5 h-5 text-primary" />
              </motion.div>
              <span className="text-sm text-muted-foreground">{step.label}</span>
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-6">This may take 15-30 seconds depending on content length.</p>
      </motion.div>
    </section>
  );
};

export default ProcessingIndicator;
