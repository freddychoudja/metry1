import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, Loader2, Plus, ArrowLeft, Trash2, Thermometer, Droplets, Wind, Plane } from "lucide-react";
import { LocationSearch } from "./LocationSearch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Location {
  lat: number;
  lng: number;
  name?: string;
}

interface Trip {
  id: string;
  name: string;
  destination: Location;
  start_date: Date;
  end_date: Date;
  weather?: any;
  advice?: TravelAdvice;
}

interface TravelAdvice {
  emoji: string;
  title: string;
  description: string;
  bgColor: string;
  packingList: string[];
}

interface TravelPlannerViewProps {
  user: SupabaseUser | null;
}

export function TravelPlannerView({ user }: TravelPlannerViewProps) {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'details'>('list');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripName, setTripName] = useState("");
  const [destination, setDestination] = useState<Location | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTrips();
    } else {
      setTrips([]);
    }
  }, [user]);

  const loadTrips = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          console.log('Trips table does not exist yet');
          return;
        }
        throw error;
      }

      if (data) {
        const formattedTrips: Trip[] = data.map(trip => ({
          id: trip.id,
          name: trip.title || 'Untitled Trip',
          destination: {
            lat: parseFloat(trip.location_lat) || 0,
            lng: parseFloat(trip.location_lng) || 0,
            name: trip.location_name || 'Unknown'
          },
          start_date: new Date(trip.start_date),
          end_date: new Date(trip.end_date),
          weather: trip.weather_data,
          advice: trip.weather_data ? getTravelAdvice(trip.weather_data) : undefined
        }));

        setTrips(formattedTrips);
        console.log(`Loaded ${formattedTrips.length} trips`);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      if (error.code !== '42P01') {
        toast({
          title: "Error",
          description: "Failed to load trips.",
          variant: "destructive",
        });
      }
    }
  };

  const getTravelAdvice = (weather: any): TravelAdvice => {
    const { avg_temperature, avg_rainfall, avg_wind_speed, avg_humidity, heavy_rain_probability, extreme_heat_probability } = weather;
    
    let packingList = [];
    
    // Temperature-based advice
    if (avg_temperature > 32 || extreme_heat_probability > 15) {
      packingList = ["Light, breathable clothing", "Sunscreen SPF 30+", "Wide-brimmed hat", "Extra water bottles", "Cooling towel"];
      return {
        emoji: "🌡️",
        title: "Hot climate - Pack for heat protection",
        description: "Very hot conditions. Stay hydrated and avoid midday sun exposure.",
        bgColor: "bg-gradient-to-r from-red-500 to-orange-600",
        packingList
      };
    }
    
    if (heavy_rain_probability > 25 || avg_rainfall > 12) {
      packingList = ["Waterproof jacket", "Umbrella", "Waterproof bag", "Quick-dry clothing", "Extra socks"];
      return {
        emoji: "🌧️",
        title: "Rainy weather - Pack waterproof gear",
        description: "High chance of rain. Expect transport delays and wet conditions.",
        bgColor: "bg-gradient-to-r from-blue-500 to-indigo-600",
        packingList
      };
    }
    
    if (avg_temperature < 10) {
      packingList = ["Warm layers", "Waterproof winter jacket", "Gloves", "Warm hat", "Insulated boots"];
      return {
        emoji: "❄️",
        title: "Cold weather - Pack warm clothing",
        description: "Very cold conditions. Layer clothing and protect extremities.",
        bgColor: "bg-gradient-to-r from-blue-600 to-indigo-700",
        packingList
      };
    }
    
    if (avg_wind_speed > 20) {
      packingList = ["Windproof jacket", "Secure hat with strap", "Protective eyewear", "Sturdy footwear"];
      return {
        emoji: "💨",
        title: "Very windy - Expect travel delays",
        description: "Strong winds may affect flights and outdoor activities.",
        bgColor: "bg-gradient-to-r from-gray-500 to-slate-600",
        packingList
      };
    }
    
    if (avg_temperature > 25 && avg_temperature <= 32) {
      packingList = ["Light summer clothes", "Light jacket for evenings", "Sunscreen", "Comfortable walking shoes"];
      return {
        emoji: "☀️",
        title: "Warm weather - Perfect for sightseeing",
        description: "Great conditions for outdoor activities and exploration.",
        bgColor: "bg-gradient-to-r from-yellow-400 to-orange-400",
        packingList
      };
    }
    
    if (avg_temperature >= 15 && avg_temperature <= 25) {
      packingList = ["Comfortable clothing", "Light layers", "Light jacket", "Comfortable shoes"];
      return {
        emoji: "🌤️",
        title: "Perfect travel weather!",
        description: "Ideal conditions for all activities. Comfortable temperatures expected.",
        bgColor: "bg-gradient-to-r from-green-400 to-emerald-500",
        packingList
      };
    }
    
    // Default moderate conditions
    packingList = ["Layered clothing", "Light jacket", "Comfortable shoes", "Weather-appropriate gear"];
    return {
      emoji: "🌤️",
      title: "Moderate conditions - Pack versatile items",
      description: "Variable weather expected. Pack layers for comfort.",
      bgColor: "bg-gradient-to-r from-gray-300 to-slate-400",
      packingList
    };
  };

  const handleTripSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create trips.",
        variant: "destructive",
      });
      return;
    }

    if (!tripName || !destination || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all trip details.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-weather-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          latitude: destination.lat,
          longitude: destination.lng,
          month: startDate.getMonth() + 1,
          day: startDate.getDate(),
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const weather = await response.json();
      const advice = getTravelAdvice(weather);

      const { data, error } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          title: tripName,
          location_name: destination.name || `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`,
          location_lat: destination.lat,
          location_lng: destination.lng,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          weather_data: weather
        })
        .select()
        .single();

      if (error) throw error;

      const newTrip: Trip = {
        id: data.id,
        name: tripName,
        destination,
        start_date: startDate,
        end_date: endDate,
        weather,
        advice
      };

      setTrips(prev => [...prev, newTrip]);
      
      setTripName("");
      setDestination(null);
      setStartDate(undefined);
      setEndDate(undefined);
      
      toast({
        title: "Trip Created!",
        description: `"${tripName}" added with weather forecast.`,
      });
      
      setActiveView('list');
    } catch (error) {
      console.error("Error creating trip:", error);
      toast({
        title: "Error",
        description: "Failed to create trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTrip = async (tripId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTrips(prev => prev.filter(t => t.id !== tripId));
      toast({
        title: "Trip Deleted",
        description: "Trip removed from your list.",
      });
      if (selectedTrip?.id === tripId) {
        setActiveView('list');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast({
        title: "Error",
        description: "Failed to delete trip.",
        variant: "destructive",
      });
    }
  };

  const viewTripDetails = (trip: Trip) => {
    setSelectedTrip(trip);
    setActiveView('details');
  };

  if (activeView === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setActiveView('list')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trips
          </Button>
          <h1 className="text-2xl font-bold">Plan New Trip</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Trip Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tripName">Trip Name</Label>
                <Input
                  id="tripName"
                  placeholder="e.g., Summer Vacation, Business Trip"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Destination</Label>
                <LocationSearch onLocationSelect={setDestination} />
                {destination && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{destination.name}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {destination.lat.toFixed(4)}°, {destination.lng.toFixed(4)}°
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button 
                onClick={handleTripSubmit} 
                disabled={loading || !tripName || !destination || !startDate || !endDate}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Weather Forecast...
                  </>
                ) : (
                  "Create Trip with Weather Forecast"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weather Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {destination && startDate ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Weather forecast will be generated when you create the trip</p>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">{tripName || "Your Trip"}</p>
                    <p className="text-sm text-gray-600">{destination.name}</p>
                    <p className="text-sm text-gray-600">{format(startDate, "PPP")}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Fill in trip details to see weather preview
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (activeView === 'details' && selectedTrip) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setActiveView('list')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Trips
            </Button>
            <h1 className="text-2xl font-bold">{selectedTrip.name}</h1>
          </div>
          <Button 
            variant="destructive" 
            onClick={() => deleteTrip(selectedTrip.id)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Trip
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Trip Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Trip Name</Label>
                <p className="text-lg font-semibold">{selectedTrip.name}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Destination</Label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedTrip.destination.name}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedTrip.destination.lat.toFixed(4)}°, {selectedTrip.destination.lng.toFixed(4)}°
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Travel Dates</Label>
                <p className="text-lg">{format(selectedTrip.start_date, "MMM dd")} - {format(selectedTrip.end_date, "MMM dd, yyyy")}</p>
              </div>
            </CardContent>
          </Card>

          {selectedTrip.advice && (
            <Card>
              <CardHeader>
                <CardTitle>Travel Advice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`${selectedTrip.advice.bgColor} text-white p-6 rounded-lg mb-4`}>
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{selectedTrip.advice.emoji}</span>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{selectedTrip.advice.title}</h3>
                      <p className="opacity-90">{selectedTrip.advice.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Packing Checklist:</h4>
                  <ul className="space-y-1">
                    {selectedTrip.advice.packingList.map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-green-500">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {selectedTrip.weather && (
          <Card>
            <CardHeader>
              <CardTitle>Weather Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">Temperature</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700">
                    {selectedTrip.weather.avg_temperature.toFixed(1)}°C
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Rainfall</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {selectedTrip.weather.avg_rainfall.toFixed(1)}mm
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">Wind Speed</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-700">
                    {selectedTrip.weather.avg_wind_speed.toFixed(1)}m/s
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Humidity</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {selectedTrip.weather.avg_humidity.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Default list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Travel Planner</h1>
        {user && (
          <Button onClick={() => setActiveView('create')}>
            <Plus className="w-4 h-4 mr-2" />
            Plan Trip
          </Button>
        )}
      </div>

      {!user ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold mb-2">Sign in required</h3>
            <p className="text-gray-600 text-center mb-6">
              Please sign in to create and manage your travel plans with weather forecasts.
            </p>
          </CardContent>
        </Card>
      ) : trips.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">✈️</div>
            <h3 className="text-xl font-semibold mb-2">No trips planned yet</h3>
            <p className="text-gray-600 text-center mb-6">
              Plan your first trip and get weather forecasts for perfect travel preparation!
            </p>
            <Button onClick={() => setActiveView('create')}>
              <Plus className="w-4 h-4 mr-2" />
              Plan Your First Trip
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <Card key={trip.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{trip.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <Plane className="w-4 h-4" />
                      {trip.destination.name}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTrip(trip.id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent onClick={() => viewTripDetails(trip)}>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {format(trip.start_date, "MMM dd")} - {format(trip.end_date, "MMM dd, yyyy")}
                  </p>
                  
                  {trip.advice && (
                    <div className={`${trip.advice.bgColor} text-white p-3 rounded-lg`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{trip.advice.emoji}</span>
                        <div>
                          <p className="font-medium text-sm">{trip.advice.title}</p>
                          <p className="text-xs opacity-90">{trip.advice.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {trip.weather && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-orange-50 p-2 rounded text-center">
                        <p className="font-medium text-orange-700">
                          {trip.weather.avg_temperature.toFixed(1)}°C
                        </p>
                        <p className="text-orange-600">Temp</p>
                      </div>
                      <div className="bg-blue-50 p-2 rounded text-center">
                        <p className="font-medium text-blue-700">
                          {trip.weather.avg_rainfall.toFixed(1)}mm
                        </p>
                        <p className="text-blue-600">Rain</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}