import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import mermaid from "mermaid";

interface MindmapViewProps {
  chart: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#e6940a",
    primaryTextColor: "#f0f0f0",
    primaryBorderColor: "#e6940a",
    lineColor: "#555",
    secondaryColor: "#1e293b",
    tertiaryColor: "#0f172a",
    fontFamily: "Space Grotesk, sans-serif",
  },
});

const MindmapView = ({ chart }: MindmapViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const render = async () => {
      if (!containerRef.current || !chart) return;
      try {
        setError(null);
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, chart);
        containerRef.current.innerHTML = svg;
      } catch (err) {
        console.error("Mermaid render error:", err);
        setError("Failed to render mindmap. The chart syntax may be invalid.");
      }
    };
    render();
  }, [chart]);

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
        {error}
        <pre className="mt-4 text-xs bg-muted p-3 rounded-lg overflow-auto font-mono text-muted-foreground">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-auto rounded-xl bg-card/50 border border-border p-6"
    >
      <div ref={containerRef} className="flex justify-center [&>svg]:max-w-full" />
    </motion.div>
  );
};

export default MindmapView;
