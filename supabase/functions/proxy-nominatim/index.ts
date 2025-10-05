import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q) {
    return new Response(JSON.stringify({ error: "Missing query" }), { status: 400, headers: corsHeaders });
  }
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`;
  const response = await fetch(url);
  const data = await response.text();
  return new Response(data, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});