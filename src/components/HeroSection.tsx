import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { LinkIcon, Sparkles, ArrowRight, Upload, X, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HeroSectionProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

const HeroSection = ({ onSubmit, isLoading }: HeroSectionProps) => {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selected.size > maxSize) {
      toast({ title: "File too large", description: "Maximum file size is 50MB.", variant: "destructive" });
      return;
    }

    setFile(selected);
    setUrl("");
  };

  const handleFileSubmit = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("lecture-uploads")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("lecture-uploads")
        .getPublicUrl(path);

      onSubmit(urlData.publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: "Upload failed", description: err.message || "Could not upload file.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const busy = isLoading || uploading;

  return (
    <section className="gradient-hero min-h-[85vh] flex items-center justify-center px-4 relative overflow-hidden">
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
          Paste a link or upload a local video. Get a summary, visual mindmap, and interactive quiz in seconds.
        </p>

        {/* URL input */}
        {!file && (
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
              disabled={busy || !url.trim()}
              className="h-14 px-8 text-base font-semibold gradient-warm rounded-xl shadow-warm hover:opacity-90 transition-opacity gap-2"
            >
              {busy ? (
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
        )}

        {/* File selected state */}
        {file && (
          <div className="max-w-xl mx-auto">
            <div
              className="flex items-center gap-3 p-4 rounded-xl border border-primary/20"
              style={{ backgroundColor: "hsl(220 22% 12%)" }}
            >
              <FileVideo className="w-6 h-6 text-primary flex-shrink-0" />
              <span className="text-sm truncate flex-1 text-left" style={{ color: "hsl(220 15% 90%)" }}>
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </span>
              <button onClick={clearFile} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <Button
              onClick={handleFileSubmit}
              disabled={busy}
              className="mt-3 h-14 px-8 text-base font-semibold gradient-warm rounded-xl shadow-warm hover:opacity-90 transition-opacity gap-2 w-full sm:w-auto"
            >
              {busy ? (
                <>
                  <Sparkles className="w-5 h-5 animate-pulse-warm" />
                  {uploading ? "Uploading..." : "Processing..."}
                </>
              ) : (
                <>
                  Generate
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Divider + upload */}
        {!file && (
          <div className="flex items-center gap-4 max-w-xl mx-auto mt-5">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>
        )}

        {!file && (
          <div className="mt-5">
            <input
              ref={fileRef}
              type="file"
              accept="video/*,.mp4,.mov,.avi,.mkv,.webm"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary"
            >
              <Upload className="w-4 h-4" />
              Upload a local video
            </Button>
          </div>
        )}

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
          <span className="text-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary/60" /> Local Video
          </span>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
