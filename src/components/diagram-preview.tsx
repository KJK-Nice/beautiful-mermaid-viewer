import * as React from "react";
import { renderMermaidSVG, THEMES } from "beautiful-mermaid";
import { ZoomIn, ZoomOut, RotateCcw, Hand, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface DiagramPreviewProps {
  code: string;
  className?: string;
  /** Left side of the merged toolbar (e.g. sidebar trigger + title). */
  leadingToolbar?: React.ReactNode;
  /** After viewer controls (e.g. Edit / Delete). */
  trailingToolbar?: React.ReactNode;
  /** Optional banner below the toolbar (e.g. shared-diagram notice). */
  topBanner?: React.ReactNode;
}

export function DiagramPreview({
  code,
  className,
  leadingToolbar,
  trailingToolbar,
  topBanner,
}: DiagramPreviewProps) {
  const [svgHtml, setSvgHtml] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [scale, setScale] = React.useState(1);
  const [isDragging, setIsDragging] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [isDarkMode, setIsDarkMode] = React.useState(false);

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

  React.useEffect(() => {
    if (!code.trim()) {
      setSvgHtml("");
      setError(null);
      return;
    }

    try {
      const baseTheme = isDarkMode ? THEMES["github-dark"] : THEMES["github-light"];
      const theme =
        "border" in baseTheme && baseTheme.border
          ? baseTheme
          : { ...baseTheme, border: baseTheme.line ?? (isDarkMode ? "#3d444d" : "#d1d9e0") };
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
    <div className={cn("relative flex min-h-0 flex-1 flex-col bg-background", className)}>
      <div className="flex min-h-10 shrink-0 items-center gap-2 border-b bg-muted/50 px-3 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">{leadingToolbar}</div>
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground"
                aria-label="Pan and zoom shortcuts"
              >
                <Hand className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Drag to pan, Ctrl+Scroll to zoom</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={toggleTheme}>
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <div className="mx-0.5 h-4 w-px shrink-0 bg-border" />
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[52px] shrink-0 text-center text-xs text-muted-foreground tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          {trailingToolbar ? (
            <>
              <div className="mx-1 h-4 w-px shrink-0 bg-border" />
              <div className="flex items-center gap-1">{trailingToolbar}</div>
            </>
          ) : null}
        </div>
      </div>

      {topBanner ? (
        <div className="shrink-0 border-b bg-muted/40 px-3 py-2 text-sm">{topBanner}</div>
      ) : null}

      <div
        className="relative flex-1 cursor-grab overflow-hidden bg-muted/30 active:cursor-grabbing"
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
