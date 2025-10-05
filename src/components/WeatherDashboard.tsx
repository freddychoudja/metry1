import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, MapPin, Calendar as CalendarIcon, Thermometer, Droplets, Wind, AlertTriangle, Heart, User, LogOut, Download, Clock, TrendingUp, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { WeatherChart } from "./WeatherChart";
import { LocationSearch } from "./LocationSearch";
import { SavedLocations } from "./SavedLocations";
import { AuthModal } from "./AuthModal";
import { AppStatus } from "./AppStatus";
import { AdminManager } from "./AdminManager";
import { useAdmin } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { WeatherAIPrediction, type WeatherAIPredictionRef } from "./WeatherAIPrediction";
import { Chatbot } from "./Chatbot";


interface WeatherData {
  latitude: number;
  longitude: number;
  month: number;
  day: number;
  avg_temperature: number;
  avg_humidity: number;
  avg_rainfall: number;
  avg_wind_speed: number;
  extreme_heat_probability: number;
  heavy_rain_probability: number;
  data_source: string;
}

interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export default function WeatherDashboard() {
  const [location, setLocation] = useState<Location | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAdmin(user);
  const aiPredictionRef = useRef<WeatherAIPredictionRef>(null);

  // Helper functions for date analysis
  const getDateType = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'current';
    if (diffDays < 0) return 'past';
    return 'future';
  };

  const getDateTypeInfo = (dateType: string) => {
    switch (dateType) {
      case 'current':
        return {
          icon: '🌍',
          title: 'Current Weather',
          description: 'Real-time conditions and today\'s forecast',
          bgColor: 'from-blue-500 to-cyan-500'
        };
      case 'past':
        return {
          icon: '📊',
          title: 'Historical Data',
          description: 'Past weather patterns and climate analysis',
          bgColor: 'from-purple-500 to-indigo-500'
        };
      case 'future':
        return {
          icon: '🔮',
          title: 'Weather Forecast',
          description: 'Predicted conditions and planning advice',
          bgColor: 'from-green-500 to-emerald-500'
        };
      default:
        return {
          icon: '🌤️',
          title: 'Weather Data',
          description: 'Weather information',
          bgColor: 'from-gray-500 to-slate-500'
        };
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchWeatherData = async () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please select a location first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setWeatherData(null); // Reset previous data
    const dateType = getDateType(selectedDate);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-weather-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
          month: selectedDate.getMonth() + 1,
          day: selectedDate.getDate(),
          dateType: dateType,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setWeatherData(data);
      aiPredictionRef.current?.fetchAIRecommendation(location, selectedDate);
      
      const typeInfo = getDateTypeInfo(dateType);
      toast({
        title: `${typeInfo.title} Retrieved`,
        description: `${typeInfo.description} loaded successfully.`,
      });
    } catch (error) {
      console.error("Error fetching weather data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch weather data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveLocation = async () => {
    if (!user || !location) return;

    try {
      const { error } = await supabase
        .from("saved_locations")
        .insert({
          user_id: user.id,
          name: location.name || `Location ${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`,
          latitude: location.lat,
          longitude: location.lng,
        });

      if (error) throw error;

      toast({
        title: "Location Saved",
        description: "Location added to your favorites.",
      });
    } catch (error) {
      console.error("Error saving location:", error);
      toast({
        title: "Error",
        description: "Failed to save location.",
        variant: "destructive",
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully.",
    });
  };

  const getWeatherCondition = (data: WeatherData) => {
    const { avg_temperature, avg_humidity, avg_rainfall, avg_wind_speed, extreme_heat_probability, heavy_rain_probability } = data;
    const dateType = getDateType(selectedDate);
    
    let baseCondition = "";
    let bgColor = "";
    const textColor = "text-white";
    
    // Determine base weather condition
    if (avg_temperature >= 32 || extreme_heat_probability > 15) {
      baseCondition = "Very hot and dry";
      bgColor = "bg-gradient-to-r from-orange-400 to-red-500";
    } else if (avg_temperature >= 30) {
      baseCondition = "Hot weather";
      bgColor = "bg-gradient-to-r from-orange-300 to-red-400";
    } else if (avg_temperature >= 25 && avg_humidity < 50) {
      baseCondition = "Warm and pleasant";
      bgColor = "bg-gradient-to-r from-yellow-300 to-orange-400";
    } else if (heavy_rain_probability > 20 || avg_rainfall > 8) {
      baseCondition = "Rainy conditions";
      bgColor = "bg-gradient-to-r from-blue-400 to-indigo-500";
    } else if (avg_temperature <= 12) {
      baseCondition = "Cold weather";
      bgColor = "bg-gradient-to-r from-blue-500 to-indigo-600";
    } else {
      baseCondition = "Moderate conditions";
      bgColor = "bg-gradient-to-r from-green-300 to-emerald-400";
    }
    
    // Add date-specific advice
    let advice = "";
    switch (dateType) {
      case 'current':
        if (avg_temperature >= 30) advice = " — stay hydrated and seek shade!";
        else if (heavy_rain_probability > 20) advice = " — bring an umbrella today!";
        else if (avg_temperature <= 12) advice = " — dress warmly!";
        else advice = " — perfect for outdoor activities!";
        break;
      case 'past':
        advice = " — historical climate pattern for this date";
        break;
      case 'future':
        if (avg_temperature >= 30) advice = " — plan for hot weather, prepare cooling strategies";
        else if (heavy_rain_probability > 20) advice = " — expect rain, plan indoor alternatives";
        else if (avg_temperature <= 12) advice = " — prepare warm clothing";
        else advice = " — good conditions expected for outdoor plans";
        break;
    }
    
    const typeInfo = getDateTypeInfo(dateType);
    return { 
      condition: `${typeInfo.icon} ${baseCondition}${advice}`, 
      bgColor, 
      textColor 
    };
  };

  const getActivityRecommendation = (data: WeatherData) => {
    const { avg_temperature, avg_rainfall, extreme_heat_probability, heavy_rain_probability } = data;
    const dateType = getDateType(selectedDate);
    
    let baseActivity = "";
    let color = "";
    let icon = "";
    
    // Determine base activity
    if (heavy_rain_probability > 30) {
      baseActivity = "Indoor Activities";
      color = "bg-blue-100 text-blue-800";
      icon = "🏠";
    } else if (extreme_heat_probability > 25) {
      baseActivity = "Early Morning/Evening";
      color = "bg-orange-100 text-orange-800";
      icon = "🌅";
    } else if (avg_temperature > 20 && avg_temperature < 30 && avg_rainfall < 5) {
      baseActivity = "Perfect for Hiking";
      color = "bg-green-100 text-green-800";
      icon = "🥾";
    } else if (avg_temperature > 15 && avg_rainfall < 2) {
      baseActivity = "Great for Cycling";
      color = "bg-emerald-100 text-emerald-800";
      icon = "🚴";
    } else {
      baseActivity = "Check Conditions";
      color = "bg-gray-100 text-gray-800";
      icon = "⚠️";
    }
    
    // Add date-specific context
    if (dateType === 'future') {
      baseActivity = `Plan: ${baseActivity}`;
    } else if (dateType === 'past') {
      baseActivity = `Historical: ${baseActivity}`;
    }
    
    return { activity: baseActivity, color, icon };
  };

  const getDateSpecificAdvice = (data: WeatherData) => {
    const dateType = getDateType(selectedDate);
    const { avg_temperature, avg_rainfall, extreme_heat_probability, heavy_rain_probability } = data;
    
    switch (dateType) {
      case 'current':
        return {
          title: "Today's Action Items",
          items: [
            avg_temperature > 25 ? "Stay hydrated - drink water regularly" : "Comfortable temperature for activities",
            heavy_rain_probability > 20 ? "Carry umbrella or rain gear" : "No rain protection needed",
            extreme_heat_probability > 20 ? "Avoid midday sun (11am-3pm)" : "Safe for all-day outdoor activities",
            "Check UV index before going out"
          ]
        };
      case 'past':
        return {
          title: "Historical Climate Insights",
          items: [
            `Typical temperature for this date: ${avg_temperature.toFixed(1)}°C`,
            `Historical rainfall average: ${avg_rainfall.toFixed(1)}mm`,
            `Climate pattern shows ${extreme_heat_probability > 15 ? 'higher' : 'lower'} heat risk`,
            "Use this data for future planning"
          ]
        };
      case 'future':
        return {
          title: "Planning Recommendations",
          items: [
            avg_temperature > 25 ? "Pack cooling items (fan, cold drinks)" : "Standard clothing should be sufficient",
            heavy_rain_probability > 20 ? "Have indoor backup plans ready" : "Outdoor activities should proceed as planned",
            extreme_heat_probability > 20 ? "Schedule activities for early morning or evening" : "Flexible timing for outdoor plans",
            "Monitor forecast updates as date approaches"
          ]
        };
      default:
        return {
          title: "General Advice",
          items: ["Check weather conditions", "Plan accordingly", "Stay prepared"]
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">🌍</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">WeatherWise Explorer</h1>
              <p className="text-xs text-gray-600">Powered by Meteomatics Professional API</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowAuth(true)}>
                <User className="w-4 h-4 mr-1" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!user && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  🌍 Welcome to WeatherWise Explorer
                </h2>
                <p className="text-blue-700 text-sm">
                  Explore historical weather patterns from professional Meteomatics weather data. 
                  <strong>Sign in to save locations and unlock premium features!</strong>
                </p>
              </div>
              <Button 
                variant="outline" 
                className="bg-white/80 hover:bg-white" 
                onClick={() => setShowAuth(true)}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            {isAdmin && <AppStatus />}
            {isAdmin && <AdminManager />}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <LocationSearch onLocationSelect={setLocation} />
                {location && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium">Selected Location:</p>
                    <p className="text-xs text-gray-600">
                      {location.name || `${location.lat.toFixed(4)}°, ${location.lng.toFixed(4)}°`}
                    </p>
                    {user ? (
                      <Button size="sm" variant="outline" className="mt-2" onClick={saveLocation}>
                        <Heart className="w-4 h-4 mr-1" />
                        Save Location
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2" 
                        onClick={() => setShowAuth(true)}
                      >
                        <Heart className="w-4 h-4 mr-1" />
                        Sign in to Save
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Date Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Date Type Indicator */}
                {(() => {
                  const dateType = getDateType(selectedDate);
                  const typeInfo = getDateTypeInfo(dateType);
                  return (
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${typeInfo.bgColor} text-white`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{typeInfo.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{typeInfo.title}</p>
                          <p className="text-xs opacity-90">{typeInfo.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                <Button onClick={fetchWeatherData} disabled={loading || !location} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Get Weather Data"
                  )}
                </Button>
              </CardContent>
            </Card>

            {user ? (
              <SavedLocations onLocationSelect={setLocation} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Premium Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">🔓 Sign in to unlock:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Save favorite locations</li>
                      <li>• Export weather data</li>
                      <li>• Compare multiple locations</li>
                      <li>• Set weather alerts</li>
                    </ul>
                    <Button 
                      size="sm" 
                      className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600" 
                      onClick={() => setShowAuth(true)}
                    >
                      Sign In Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            {weatherData ? (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <div className="space-y-6">
                    {/* Weather Condition Banner */}
                    {(() => {
                      const condition = getWeatherCondition(weatherData);
                      const dateType = getDateType(selectedDate);
                      const typeInfo = getDateTypeInfo(dateType);
                      return (
                        <div className={`${condition.bgColor} ${condition.textColor} p-6 rounded-2xl shadow-lg transition-all duration-500`}>
                          <div className="text-center">
                            <h2 className="text-2xl font-bold mb-2">{typeInfo.title}</h2>
                            <p className="text-xl">{condition.condition}</p>
                            <p className="text-sm opacity-90 mt-2">
                              {format(selectedDate, "EEEE, MMMM do, yyyy")} • Meteomatics API
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Weather Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Thermometer className="w-5 h-5 text-orange-600" />
                              <span className="text-sm font-medium">Temperature</span>
                            </div>
                            <p className="text-3xl font-bold text-orange-700">{weatherData.avg_temperature.toFixed(1)}°C</p>
                            <p className="text-xs text-orange-600 mt-1">Historical average</p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Droplets className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-medium">Humidity</span>
                            </div>
                            <p className="text-3xl font-bold text-blue-700">{weatherData.avg_humidity.toFixed(1)}%</p>
                            <p className="text-xs text-blue-600 mt-1">Relative humidity</p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg border border-cyan-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Droplets className="w-5 h-5 text-cyan-600" />
                              <span className="text-sm font-medium">Rainfall</span>
                            </div>
                            <p className="text-3xl font-bold text-cyan-700">{weatherData.avg_rainfall.toFixed(1)}mm</p>
                            <p className="text-xs text-cyan-600 mt-1">Expected precipitation</p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Wind className="w-5 h-5 text-gray-600" />
                              <span className="text-sm font-medium">Wind Speed</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-700">{weatherData.avg_wind_speed.toFixed(1)}m/s</p>
                            <p className="text-xs text-gray-600 mt-1">Average wind velocity</p>
                          </div>
                        </div>
                        <WeatherChart data={[weatherData]} />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="details">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Detailed Information</CardTitle>
                        {user ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              const dataStr = JSON.stringify(weatherData, null, 2);
                              const dataBlob = new Blob([dataStr], {type: 'application/json'});
                              const url = URL.createObjectURL(dataBlob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `weather-data-${weatherData.latitude}-${weatherData.longitude}-${weatherData.month}-${weatherData.day}.json`;
                              link.click();
                              toast({
                                title: "Data Exported",
                                description: "Weather data downloaded successfully.",
                              });
                            }}
                          >
                            💾 Export Data
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setShowAuth(true)}
                          >
                            🔓 Sign in to Export
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                <span className="font-medium">Extreme Heat Risk</span>
                              </div>
                              <Badge variant={weatherData.extreme_heat_probability > 25 ? "destructive" : "secondary"}>
                                {weatherData.extreme_heat_probability.toFixed(1)}%
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Probability</p>
                              <p className="text-xs text-gray-500">Temperature &gt; 35°C</p>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Droplets className="w-5 h-5 text-blue-500" />
                                <span className="font-medium">Heavy Rain Risk</span>
                              </div>
                              <Badge variant={weatherData.heavy_rain_probability > 30 ? "destructive" : "secondary"}>
                                {weatherData.heavy_rain_probability.toFixed(1)}%
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Probability</p>
                              <p className="text-xs text-gray-500">Rainfall &gt; 20mm</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Data Source</h4>
                        <p className="text-sm text-gray-600">{weatherData.data_source}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Location: {weatherData.latitude.toFixed(4)}°, {weatherData.longitude.toFixed(4)}°
                        </p>
                        <p className="text-xs text-gray-500">
                          Date: {new Date(2024, weatherData.month - 1, weatherData.day).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="recommendations">
                  <div className="space-y-4">
                    <WeatherAIPrediction ref={aiPredictionRef} />
                    <Card>
                      <CardHeader>
                        <CardTitle>Activity Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const recommendation = getActivityRecommendation(weatherData);
                          return (
                            <div className="space-y-4">
                              <div className={`p-4 rounded-lg ${recommendation.color}`}>
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{recommendation.icon}</span>
                                  <div>
                                    <h3 className="font-semibold">{recommendation.activity}</h3>
                                    <p className="text-sm opacity-80">Recommended for these conditions</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 bg-green-50 rounded-lg">
                                  <h4 className="font-medium text-green-800 mb-2">Good Conditions For:</h4>
                                  <ul className="text-sm text-green-700 space-y-1">
                                    {weatherData.avg_temperature > 15 && weatherData.avg_temperature < 30 && (
                                      <li>• Outdoor activities</li>
                                    )}
                                    {weatherData.avg_rainfall < 5 && <li>• Walking and hiking</li>}
                                    {weatherData.avg_wind_speed < 10 && <li>• Cycling</li>}
                                    {weatherData.extreme_heat_probability < 20 && <li>• Sports activities</li>}
                                  </ul>
                                </div>
                                
                                <div className="p-3 bg-yellow-50 rounded-lg">
                                  <h4 className="font-medium text-yellow-800 mb-2">Consider Avoiding:</h4>
                                  <ul className="text-sm text-yellow-700 space-y-1">
                                    {weatherData.extreme_heat_probability > 25 && (
                                      <li>• Midday outdoor activities</li>
                                    )}
                                    {weatherData.heavy_rain_probability > 30 && (
                                      <li>• Outdoor events</li>
                                    )}
                                    {weatherData.avg_wind_speed > 15 && <li>• Water activities</li>}
                                    {weatherData.avg_humidity > 80 && <li>• Intense exercise</li>}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                    
                    {/* Date-Specific Advice */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {(() => {
                            const dateType = getDateType(selectedDate);
                            switch (dateType) {
                              case 'current': return <><Clock className="w-5 h-5" />Today's Advice</>;
                              case 'past': return <><History className="w-5 h-5" />Historical Analysis</>;
                              case 'future': return <><TrendingUp className="w-5 h-5" />Planning Guide</>;
                              default: return <>Weather Advice</>;
                            }
                          })()}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const advice = getDateSpecificAdvice(weatherData);
                          return (
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-900">{advice.title}</h4>
                              <ul className="space-y-2">
                                {advice.items.map((item, index) => (
                                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="text-blue-500 mt-1">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MapPin className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">Select a location and date to view weather data</p>
                  <p className="text-sm text-gray-400 text-center mt-2">
                    Historical weather patterns from Meteomatics professional weather data
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <Chatbot />
    </div>
  );
}