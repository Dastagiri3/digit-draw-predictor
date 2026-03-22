import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, priceData, indicators } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are an expert financial analyst AI. Analyze the following stock data and provide actionable insights.

Stock: ${symbol}

Recent price data (last 5 days):
${JSON.stringify(priceData, null, 2)}

Technical indicators:
${JSON.stringify(indicators, null, 2)}

Provide a structured analysis including:
1. **Trend Analysis**: Is the stock in an uptrend, downtrend, or sideways pattern?
2. **Technical Signal**: Based on RSI, MACD, and Bollinger Bands, what is the current signal (bullish/bearish/neutral)?
3. **Key Levels**: Important support and resistance levels
4. **Risk Assessment**: Current risk level (low/medium/high) with reasoning
5. **Recommendation**: Buy/Hold/Sell recommendation with confidence level (percentage)
6. **Price Target**: Short-term (1 week) and medium-term (1 month) price targets

Be specific with numbers. Format your response clearly.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              content:
                "You are a senior financial analyst AI. Provide data-driven analysis with specific numbers and actionable recommendations. Be concise but thorough. Always include risk warnings.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI analysis failed");
    }

    const aiData = await response.json();
    const analysis = aiData.choices?.[0]?.message?.content || "Analysis unavailable";

    return new Response(JSON.stringify({ analysis, symbol }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-stock error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
