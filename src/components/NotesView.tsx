import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { Download, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotesViewProps {
  notes: string;
  title?: string;
}

const NotesView = ({ notes, title }: NotesViewProps) => {
  const content = typeof notes === "string" ? notes : typeof notes === "object" && notes ? JSON.stringify(notes, null, 2) : "";
  const handleExport = () => {
    const blob = new Blob([`# ${title || "Lecture Notes"}\n\n${content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "notes").replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!content) {
    return (
      <div className="text-center py-12">
        <BookMarked className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground text-sm">No structured notes available for this lecture.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" />
          Export Notes
        </Button>
      </div>
      <div
        className="prose prose-sm sm:prose-base max-w-none dark:prose-invert
          prose-headings:font-semibold prose-headings:tracking-tight
          prose-h2:text-xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:mb-4
          prose-h3:text-lg
          prose-p:leading-relaxed prose-p:text-muted-foreground
          prose-strong:text-foreground
          prose-code:font-mono prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-ul:text-muted-foreground prose-ol:text-muted-foreground
          prose-li:marker:text-primary
          prose-table:border prose-table:border-border
          prose-th:bg-muted prose-th:p-2 prose-th:text-left
          prose-td:p-2 prose-td:border-t prose-td:border-border"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </motion.div>
  );
};

export default NotesView;
