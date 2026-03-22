import { useRef, useEffect, useState, useCallback } from "react";

interface DrawingCanvasProps {
  onPredict: (imageData: string) => void;
  isLoading: boolean;
}

const DrawingCanvas = ({ onPredict, isLoading }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#1e2330";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#1e2330";
    ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    setHasDrawn(false);
  }, []);

  const handlePredict = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onPredict(dataUrl);
  };

  return (
    <div className="flex flex-col items-center gap-4 animate-fade-in-up">
      <div className="relative rounded-lg overflow-hidden shadow-lg border-2 border-canvas-border">
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className="cursor-crosshair touch-none"
          style={{ width: 280, height: 280, background: "hsl(var(--canvas-bg))" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-muted-foreground/40 text-sm font-mono select-none">
              Draw a digit (0–9)
            </span>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={clearCanvas}
          className="px-5 py-2.5 rounded-md bg-secondary text-secondary-foreground font-medium text-sm
                     hover:bg-secondary/80 active:scale-[0.97] transition-all duration-150"
        >
          Clear
        </button>
        <button
          onClick={handlePredict}
          disabled={!hasDrawn || isLoading}
          className="px-5 py-2.5 rounded-md bg-accent text-accent-foreground font-medium text-sm
                     hover:brightness-110 active:scale-[0.97] transition-all duration-150
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? "Classifying…" : "Classify Digit"}
        </button>
      </div>
    </div>
  );
};

export default DrawingCanvas;
