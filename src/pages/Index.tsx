import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DrawingCanvas from "@/components/DrawingCanvas";
import PredictionResults from "@/components/PredictionResults";

interface Prediction {
  digit: number;
  confidence: number;
}

const Index = () => {
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);
  const [topPrediction, setTopPrediction] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePredict = async (imageData: string) => {
    setIsLoading(true);
    setPredictions(null);
    setTopPrediction(null);

    try {
      const { data, error } = await supabase.functions.invoke("classify-digit", {
        body: { imageData },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const preds: Prediction[] = data.predictions
        .sort((a: Prediction, b: Prediction) => a.digit - b.digit);
      
      setPredictions(preds);
      const top = preds.reduce((a, b) => (a.confidence > b.confidence ? a : b));
      setTopPrediction(top.digit);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Classification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-sm">09</span>
          </div>
          <h1 className="text-lg font-semibold">MNIST Digit Classifier</h1>
          <span className="ml-auto text-xs font-mono text-muted-foreground">
            AI-powered
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">
        <div className="text-center max-w-md animate-fade-in-up">
          <h2 className="text-2xl font-bold mb-2" style={{ lineHeight: "1.15" }}>
            Draw a handwritten digit
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Sketch any digit from 0 to 9 on the canvas below.
            The AI model will classify it with confidence scores.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
          <DrawingCanvas onPredict={handlePredict} isLoading={isLoading} />
          <PredictionResults predictions={predictions} topPrediction={topPrediction} />
        </div>

        {!predictions && !isLoading && (
          <div className="animate-fade-in-up text-center max-w-sm" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
            <div className="bg-card rounded-lg border p-5 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">How it works</p>
              <ol className="text-left space-y-1 list-decimal list-inside">
                <li>Draw a digit (0–9) on the dark canvas</li>
                <li>Click "Classify Digit" to send to the AI</li>
                <li>View the prediction with per-digit confidence</li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
