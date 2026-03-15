import * as React from "react";
import { renderMermaidSVG, THEMES } from "beautiful-mermaid";
import { ZoomIn, ZoomOut, RotateCcw, Hand, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DiagramPreviewProps {
  code: string;
  className?: string;
}

export function DiagramPreview({ code, className }: DiagramPreviewProps) {
  const [svgHtml, setSvgHtml] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [scale, setScale] = React.useState(1);
  const [isDragging, setIsDragging] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  // Check dark mode on mount
  React.useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Render diagram with appropriate theme
  React.useEffect(() => {
    if (!code.trim()) {
      setSvgHtml("");
      setError(null);
      return;
    }

    try {
      const theme = isDarkMode ? THEMES["github-dark"] : THEMES["github-light"];
      const result = renderMermaidSVG(code, theme);
      setSvgHtml(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render diagram");
      setSvgHtml("");
    }
  }, [code, isDarkMode]);

  const handleZoomIn = () => setScale((s) => Math.min(s * 1.2, 5));
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.2, 0.2));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((s) => Math.min(Math.max(s * delta, 0.2), 5));
    }
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className={cn("relative flex flex-col h-full w-full bg-background", className)}>
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <Hand className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Drag to pan, Ctrl+Scroll to zoom</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className="flex-1 overflow-hidden bg-muted/30 cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {error ? (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              <p className="font-semibold">Error rendering diagram</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : svgHtml ? (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.1s ease-out",
              }}
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>No diagram to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
