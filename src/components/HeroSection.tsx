import { useState } from "react";
import { motion } from "framer-motion";
import { LinkIcon, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeroSectionProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

const HeroSection = ({ onSubmit, isLoading }: HeroSectionProps) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  return (
    <section className="gradient-hero min-h-[85vh] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-2xl w-full text-center relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-8"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">AI-Powered Learning</span>
        </motion.div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground mb-4 leading-[1.1]">
          Turn any lecture into
          <br />
          <span className="text-primary">instant knowledge</span>
        </h1>

        <p className="text-muted-foreground text-lg sm:text-xl mb-10 max-w-lg mx-auto leading-relaxed" style={{ color: "hsl(220 15% 65%)" }}>
          Paste a YouTube link, PDF, or article URL. Get a summary, visual mindmap, and interactive quiz in seconds.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a YouTube, PDF, or article link..."
              className="pl-12 h-14 text-base bg-card/10 border-primary/10 text-primary-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 rounded-xl"
              style={{ backgroundColor: "hsl(220 22% 12%)", color: "hsl(220 15% 90%)" }}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="h-14 px-8 text-base font-semibold gradient-warm rounded-xl shadow-warm hover:opacity-90 transition-opacity gap-2"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-5 h-5 animate-pulse-warm" />
                Processing...
              </>
            ) : (
              <>
                Generate
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-6 mt-8" style={{ color: "hsl(220 10% 50%)" }}>
          <span className="text-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary/60" /> YouTube
          </span>
          <span className="text-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary/60" /> PDFs
          </span>
          <span className="text-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary/60" /> Articles
          </span>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
