import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an MNIST digit classifier. You will receive an image of a handwritten digit (0-9) drawn on a dark background with white strokes. Your task is to classify which digit it is.

You MUST respond by calling the classify_digit function with your predictions. Provide confidence scores for ALL 10 digits (0-9) that sum to approximately 1.0. Be accurate - the top prediction should have high confidence when the digit is clear.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageData },
              },
              {
                type: "text",
                text: "Classify this handwritten digit. Return confidence scores for each digit 0-9.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_digit",
              description: "Return classification results for a handwritten digit",
              parameters: {
                type: "object",
                properties: {
                  predictions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        digit: { type: "number", description: "The digit (0-9)" },
                        confidence: { type: "number", description: "Confidence score between 0 and 1" },
                      },
                      required: ["digit", "confidence"],
                    },
                    description: "Array of 10 predictions, one for each digit 0-9",
                  },
                },
                required: ["predictions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_digit" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const body = await response.text();
      console.error("AI gateway error:", status, body);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify-digit error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
