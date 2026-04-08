import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";

interface SummaryViewProps {
  markdown: string;
}

const SummaryView = ({ markdown }: SummaryViewProps) => {
  const content = typeof markdown === "string" ? markdown : JSON.stringify(markdown, null, 2);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="prose prose-sm sm:prose-base max-w-none dark:prose-invert 
        prose-headings:font-semibold prose-headings:tracking-tight
        prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
        prose-p:leading-relaxed prose-p:text-muted-foreground
        prose-strong:text-foreground
        prose-code:font-mono prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
        prose-ul:text-muted-foreground prose-ol:text-muted-foreground
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </motion.div>
  );
};

export default SummaryView;
