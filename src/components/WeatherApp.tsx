import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, MapPin, Loader2, Thermometer, CloudRain, Wind } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WeatherForecast {
  temperature: number;
  temperatureMin: number;
  temperatureMax: number;
  rainProbability: number;
  windSpeed: number;
  windStrength: string;
  recommendation: string;
}

export default function WeatherApp() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const { toast } = useToast();

  const getLocation = useCallback(() => {
    setGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setGettingLocation(false);
          toast({
            title: "📍 Position détectée",
            description: "Votre localisation a été détectée avec succès.",
          });
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
          setGettingLocation(false);
          toast({
            title: "Erreur de localisation",
            description: "Impossible d'obtenir votre position. Vérifiez vos autorisations.",
            variant: "destructive",
          });
        }
      );
    } else {
      setGettingLocation(false);
      toast({
        title: "Géolocalisation non supportée",
        description: "Votre navigateur ne supporte pas la géolocalisation.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  const getForecast = async () => {
    if (!location) {
      toast({
        title: "Position manquante",
        description: "Veuillez autoriser la géolocalisation.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setForecast(null);

    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-weather-forecast`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude: location.lat,
            longitude: location.lon,
            date: formattedDate,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données météo");
      }

      const data = await response.json();
      setForecast(data);
      toast({
        title: "✅ Prévision obtenue",
        description: "Les données météo ont été récupérées avec succès.",
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'obtenir les prévisions météo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-none">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">
              🎉 Va-t-il pleuvoir sur mon défilé ?
            </h1>
            <p className="text-muted-foreground text-lg">
              Prévisions météo simples et claires pour votre événement
            </p>
          </div>

          {/* Location Display */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MapPin className="w-5 h-5" />
            <span>
              {gettingLocation ? (
                "Détection de votre position..."
              ) : location ? (
                `Position : ${location.lat.toFixed(4)}°, ${location.lon.toFixed(4)}°`
              ) : (
                <Button variant="link" onClick={getLocation} className="p-0 h-auto">
                  Activer la géolocalisation
                </Button>
              )}
            </span>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-lg font-medium">📅 Date de l'événement :</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full max-w-sm justify-start text-left font-normal text-lg"
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {format(date, "PPP", { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  locale={fr}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Main Action Button */}
          <Button
            size="lg"
            className="w-full text-xl py-6 font-bold shadow-lg hover:shadow-xl transition-all"
            onClick={getForecast}
            disabled={loading || !location}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Chargement...
              </>
            ) : (
              "🔮 OBTENIR LA PRÉVISION"
            )}
          </Button>

          {/* Results Display */}
          {forecast && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Weather Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-none">
                  <CardContent className="p-6 text-center space-y-2">
                    <Thermometer className="w-12 h-12 mx-auto text-orange-600" />
                    <p className="text-sm text-muted-foreground font-medium">Température</p>
                    <p className="text-4xl font-bold text-orange-700">{forecast.temperature} °C</p>
                    <p className="text-xs text-muted-foreground">
                      Min {forecast.temperatureMin}° · Max {forecast.temperatureMax}°
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-none">
                  <CardContent className="p-6 text-center space-y-2">
                    <CloudRain className="w-12 h-12 mx-auto text-blue-600" />
                    <p className="text-sm text-muted-foreground font-medium">Risque de pluie</p>
                    <p className="text-4xl font-bold text-blue-700">{forecast.rainProbability} %</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-none">
                  <CardContent className="p-6 text-center space-y-2">
                    <Wind className="w-12 h-12 mx-auto text-slate-600" />
                    <p className="text-sm text-muted-foreground font-medium">Vent</p>
                    <p className="text-4xl font-bold text-slate-700 capitalize">
                      {forecast.windStrength}
                    </p>
                    <p className="text-xs text-muted-foreground">{forecast.windSpeed} km/h</p>
                  </CardContent>
                </Card>
              </div>

              {/* AI Recommendation */}
              <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border-2 border-primary/20">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">💡</span>
                    <h3 className="text-xl font-bold text-primary">Recommandation IA</h3>
                  </div>
                  <p className="text-lg leading-relaxed text-foreground whitespace-pre-line">
                    {forecast.recommendation}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}