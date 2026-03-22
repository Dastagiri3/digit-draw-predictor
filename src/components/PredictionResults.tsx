interface Prediction {
  digit: number;
  confidence: number;
}

interface PredictionResultsProps {
  predictions: Prediction[] | null;
  topPrediction: number | null;
}

const PredictionResults = ({ predictions, topPrediction }: PredictionResultsProps) => {
  if (!predictions) return null;

  return (
    <div className="w-full max-w-sm animate-scale-in">
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="text-center mb-5">
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-1">
            Prediction
          </p>
          <span className="text-6xl font-bold leading-none">{topPrediction}</span>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3">
            Confidence by digit
          </p>
          {predictions.map(({ digit, confidence }) => {
            const isTop = digit === topPrediction;
            const pct = Math.round(confidence * 100);
            return (
              <div key={digit} className="flex items-center gap-3 text-sm">
                <span className={`w-4 text-right font-mono ${isTop ? "font-bold" : "text-muted-foreground"}`}>
                  {digit}
                </span>
                <div className="flex-1 h-5 bg-confidence-bg rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all duration-700 ease-out"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isTop
                        ? "hsl(var(--confidence-bar))"
                        : "hsl(var(--muted-foreground) / 0.25)",
                    }}
                  />
                </div>
                <span className={`w-10 text-right font-mono text-xs ${isTop ? "font-bold" : "text-muted-foreground"}`}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PredictionResults;
