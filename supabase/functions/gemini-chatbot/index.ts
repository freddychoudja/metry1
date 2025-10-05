// FICHIER : supabase/functions/gemini-chatbot/index.ts
// VERSION FINALE, CORRIGÉE ET TESTÉE

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// CORRECTION #1 : On enlève la version pour utiliser la plus récente bibliothèque
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "https://esm.sh/@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("Le secret GEMINI_API_KEY est manquant.");

    const { messages } = await req.json();
    if (!messages) throw new Error("Le format des messages est invalide ou manquant.");
    
    const systemInstruction = messages.find((m) => m.role === "system");
    const conversation = messages.filter((m) => m.role === "user" || m.role === "model");

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      // CORRECTION #2 : Le nom du modèle était incorrect
      model: "gemini-1.5-flash",
      systemInstruction,
    });

    let history = conversation.slice(0, -1);
    const firstUserIndex = history.findIndex((m) => m.role === "user");
    history = (firstUserIndex !== -1) ? history.slice(firstUserIndex) : [];
    
    const lastMessage = conversation[conversation.length - 1]?.parts[0]?.text;
    if (!lastMessage) throw new Error("Le dernier message utilisateur est introuvable.");

    const chat = model.startChat({
      history,
      generationConfig: { maxOutputTokens: 1000 },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // CORRECTION #3 : Revenir au streaming que le front-end attend
    const result = await chat.sendMessageStream(lastMessage);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of result.stream) {
          const text = chunk.text();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Erreur dans la fonction:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});