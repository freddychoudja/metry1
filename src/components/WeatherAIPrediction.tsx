import { useState, forwardRef, useImperativeHandle } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BrainCircuit } from "lucide-react";

interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export interface WeatherAIPredictionRef {
  fetchAIRecommendation: (location: Location, date: Date) => void;
}

export const WeatherAIPrediction = forwardRef<WeatherAIPredictionRef>((_props, ref) => {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAIRecommendation = async (location: Location, date: Date) => {
    if (!location || !date) return;

    setLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke("get_weather_recommendation", {
        body: {
          latitude: location.lat,
          longitude: location.lng,
          date: date.toISOString(),
        },
      });

      if (functionError) {
        throw new Error(`Supabase function error: ${functionError.message}`);
      }

      if (!data.recommendation) {
        throw new Error("Aucune recommandation reçue de l'IA.");
      }

      setRecommendation(data.recommendation);
      toast({
        title: "Analyse IA Réussie",
        description: "La recommandation de l'IA a été chargée.",
      });

    } catch (err: any) {
      console.error("Error fetching AI recommendation:", err);
      setError(err.message || "An unknown error occurred.");
      toast({
        title: "Erreur d'analyse IA",
        description: "Impossible de charger la recommandation de l'IA.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchAIRecommendation,
  }));

  if (!loading && !error && !recommendation) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-purple-500" />
          Analyse et Recommandation par IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>L'IA analyse les données, veuillez patienter...</span>
          </div>
        )}
        {error && (
          <div className="text-red-500">
            <p><strong>Erreur :</strong> {error}</p>
          </div>
        )}
        {recommendation && !loading && (
          <p className="text-gray-700">{recommendation}</p>
        )}
      </CardContent>
    </Card>
  );
});