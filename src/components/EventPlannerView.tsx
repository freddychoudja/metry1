import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, Loader2, Plus, ArrowLeft, Trash2, Thermometer, Droplets, Wind } from "lucide-react";
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

interface Event {
  id: string;
  name: string;
  location: Location;
  date: Date;
  time?: string;
  weather?: any;
  advice?: WeatherAdvice;
}

interface WeatherAdvice {
  emoji: string;
  title: string;
  description: string;
  bgColor: string;
}

interface EventPlannerViewProps {
  user: SupabaseUser | null;
}

export function EventPlannerView({ user }: EventPlannerViewProps) {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'details'>('list');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventName, setEventName] = useState("");
  const [location, setLocation] = useState<Location | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadEvents();
    } else {
      setEvents([]);
    }
  }, [user]);

  const loadEvents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          console.log('Events table does not exist yet');
          return;
        }
        throw error;
      }

      if (data) {
        const formattedEvents: Event[] = data.map(event => ({
          id: event.id,
          name: event.name,
          location: {
            lat: parseFloat(event.location_lat),
            lng: parseFloat(event.location_lng),
            name: event.location_name
          },
          date: new Date(event.event_date),
          time: event.event_time,
          weather: event.weather_data,
          advice: event.advice_data
        }));

        setEvents(formattedEvents);
        console.log(`Loaded ${formattedEvents.length} events`);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      // Don't show error toast for missing table
      if (error.code !== '42P01') {
        toast({
          title: "Error",
          description: "Failed to load events.",
          variant: "destructive",
        });
      }
    }
  };

  const getEventSuitabilityScore = (weather: any): number => {
    const { avg_temperature, avg_rainfall, avg_wind_speed, avg_humidity, heavy_rain_probability, extreme_heat_probability } = weather;
    let score = 100;
    
    // Temperature penalties
    if (avg_temperature > 35) score -= 40;
    else if (avg_temperature > 30) score -= 20;
    else if (avg_temperature < 10) score -= 35;
    else if (avg_temperature < 15) score -= 15;
    
    // Rain penalties
    if (heavy_rain_probability > 30) score -= 50;
    else if (heavy_rain_probability > 15) score -= 25;
    else if (heavy_rain_probability > 5) score -= 10;
    
    // Wind penalties
    if (avg_wind_speed > 20) score -= 30;
    else if (avg_wind_speed > 12) score -= 15;
    
    // Humidity penalties
    if (avg_humidity > 85) score -= 15;
    else if (avg_humidity > 75) score -= 8;
    
    return Math.max(0, score);
  };

  const getWeatherAdvice = (weather: any): WeatherAdvice => {
    const { avg_temperature, avg_rainfall, avg_wind_speed, avg_humidity, heavy_rain_probability, extreme_heat_probability } = weather;
    const suitabilityScore = getEventSuitabilityScore(weather);

    // Critical safety issues (score < 30)
    if (avg_temperature > 35 || extreme_heat_probability > 20) {
      return {
        emoji: "🚨",
        title: "Dangerous heat - Cancel outdoor event",
        description: "Extreme heat poses health risks. Move indoors or reschedule!",
        bgColor: "bg-gradient-to-r from-red-600 to-red-700"
      };
    }
    
    if (heavy_rain_probability > 40 || avg_rainfall > 20) {
      return {
        emoji: "⛈️",
        title: "Severe weather - Indoor venue required",
        description: "Heavy rain/storms expected. Outdoor events not safe.",
        bgColor: "bg-gradient-to-r from-blue-700 to-indigo-800"
      };
    }
    
    if (avg_wind_speed > 25) {
      return {
        emoji: "💨",
        title: "Dangerous winds - Safety concern",
        description: "Strong winds pose safety risks. Avoid tents and decorations.",
        bgColor: "bg-gradient-to-r from-gray-600 to-slate-700"
      };
    }
    
    // Major concerns (score 30-50)
    if (heavy_rain_probability > 25 || avg_rainfall > 12) {
      return {
        emoji: "🌧️",
        title: "High rain risk - Covered venue needed",
        description: "Strong chance of rain. Tents or indoor backup essential.",
        bgColor: "bg-gradient-to-r from-blue-600 to-indigo-700"
      };
    }
    
    if (avg_temperature > 32 || extreme_heat_probability > 15) {
      return {
        emoji: "🔥",
        title: "Very hot - Provide cooling stations",
        description: "Hot conditions. Shade, water, and cooling areas required.",
        bgColor: "bg-gradient-to-r from-orange-500 to-red-500"
      };
    }
    
    if (avg_temperature < 8) {
      return {
        emoji: "🥶",
        title: "Freezing cold - Heating required",
        description: "Very cold. Indoor venue or heating systems needed.",
        bgColor: "bg-gradient-to-r from-blue-600 to-indigo-700"
      };
    }
    
    // Moderate concerns (score 50-70)
    if (heavy_rain_probability > 15 || avg_rainfall > 6) {
      return {
        emoji: "☔",
        title: "Rain possible - Have backup plan",
        description: "Moderate rain chance. Prepare covered areas or indoor option.",
        bgColor: "bg-gradient-to-r from-blue-400 to-indigo-500"
      };
    }
    
    if (avg_temperature > 28 || extreme_heat_probability > 8) {
      return {
        emoji: "☀️",
        title: "Warm weather - Provide shade",
        description: "Warm conditions. Ensure shade and hydration for guests.",
        bgColor: "bg-gradient-to-r from-yellow-400 to-orange-400"
      };
    }
    
    if (avg_temperature < 12) {
      return {
        emoji: "❄️",
        title: "Cold weather - Guests need warmth",
        description: "Chilly conditions. Inform guests to dress warmly.",
        bgColor: "bg-gradient-to-r from-blue-500 to-indigo-600"
      };
    }
    
    if (avg_wind_speed > 15) {
      return {
        emoji: "🌬️",
        title: "Windy - Secure decorations",
        description: "Moderate winds. Secure all lightweight items and decorations.",
        bgColor: "bg-gradient-to-r from-gray-400 to-slate-500"
      };
    }
    
    // Minor concerns (score 70-85)
    if (avg_humidity > 80) {
      return {
        emoji: "💧",
        title: "Very humid - Ensure ventilation",
        description: "High humidity. Good ventilation and cooling options recommended.",
        bgColor: "bg-gradient-to-r from-teal-400 to-cyan-500"
      };
    }
    
    if (heavy_rain_probability > 8 || avg_rainfall > 3) {
      return {
        emoji: "🌦️",
        title: "Light rain possible - Minor precautions",
        description: "Small rain chance. Have umbrellas or light cover available.",
        bgColor: "bg-gradient-to-r from-blue-300 to-cyan-400"
      };
    }
    
    if (avg_wind_speed > 8) {
      return {
        emoji: "🍃",
        title: "Breezy - Secure light items",
        description: "Light winds. Secure napkins, tablecloths, and light decorations.",
        bgColor: "bg-gradient-to-r from-green-300 to-teal-400"
      };
    }
    
    // Good conditions (score 85-95)
    if (avg_temperature > 22 && avg_temperature <= 28) {
      return {
        emoji: "🌤️",
        title: "Great weather for events",
        description: "Warm and comfortable. Excellent for outdoor activities.",
        bgColor: "bg-gradient-to-r from-yellow-300 to-orange-300"
      };
    }
    
    // Perfect conditions (score 95+)
    if (suitabilityScore >= 95) {
      return {
        emoji: "✨",
        title: "Perfect event weather!",
        description: "Ideal conditions. Everything looks great for your outdoor event!",
        bgColor: "bg-gradient-to-r from-green-400 to-emerald-500"
      };
    }
    
    // Good but not perfect
    return {
      emoji: "🌤️",
      title: "Good conditions overall",
      description: "Generally favorable weather. Minor adjustments may be needed.",
      bgColor: "bg-gradient-to-r from-green-300 to-emerald-400"
    };
  };

  const handleEventSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create events.",
        variant: "destructive",
      });
      return;
    }

    if (!eventName || !location || !selectedDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in event name, location, and date.",
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
          latitude: location.lat,
          longitude: location.lng,
          month: selectedDate.getMonth() + 1,
          day: selectedDate.getDate(),
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const weather = await response.json();
      const advice = getWeatherAdvice(weather);

      // Save to Supabase
      const { data, error } = await supabase
        .from('events')
        .insert({
          user_id: user.id,
          name: eventName,
          location_name: location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
          location_lat: location.lat,
          location_lng: location.lng,
          event_date: selectedDate.toISOString().split('T')[0],
          event_time: selectedTime || null,
          weather_data: weather,
          advice_data: advice
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const newEvent: Event = {
        id: data.id,
        name: eventName,
        location,
        date: selectedDate,
        time: selectedTime,
        weather,
        advice
      };

      setEvents(prev => [...prev, newEvent]);
      
      // Reset form
      setEventName("");
      setLocation(null);
      setSelectedDate(undefined);
      setSelectedTime("");
      
      toast({
        title: "Event Created!",
        description: `"${eventName}" added with weather forecast.`,
      });
      
      setActiveView('list');
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEvents(prev => prev.filter(e => e.id !== eventId));
      toast({
        title: "Event Deleted",
        description: "Event removed from your list.",
      });
      if (selectedEvent?.id === eventId) {
        setActiveView('list');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      });
    }
  };

  const viewEventDetails = (event: Event) => {
    setSelectedEvent(event);
    setActiveView('details');
  };

  if (activeView === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setActiveView('list')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
          <h1 className="text-2xl font-bold">Create New Event</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventName">Event Name</Label>
                <Input
                  id="eventName"
                  placeholder="e.g., Summer Picnic, Birthday Party"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <LocationSearch onLocationSelect={setLocation} />
                {location && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{location.name}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
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
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventTime">Time (Optional)</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={handleEventSubmit} 
                disabled={loading || !eventName || !location || !selectedDate}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Weather Forecast...
                  </>
                ) : (
                  "Create Event with Weather Forecast"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weather Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {location && selectedDate ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Weather forecast will be generated when you create the event</p>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">{eventName || "Your Event"}</p>
                    <p className="text-sm text-gray-600">{location.name}</p>
                    <p className="text-sm text-gray-600">{format(selectedDate, "PPP")}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Fill in event details to see weather preview
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (activeView === 'details' && selectedEvent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setActiveView('list')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
            <h1 className="text-2xl font-bold">{selectedEvent.name}</h1>
          </div>
          <Button 
            variant="destructive" 
            onClick={() => deleteEvent(selectedEvent.id)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Event
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Event Name</Label>
                <p className="text-lg font-semibold">{selectedEvent.name}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Location</Label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedEvent.location.name}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedEvent.location.lat.toFixed(4)}°, {selectedEvent.location.lng.toFixed(4)}°
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Date & Time</Label>
                <p className="text-lg">{format(selectedEvent.date, "EEEE, MMMM do, yyyy")}</p>
                {selectedEvent.time && (
                  <p className="text-gray-600">at {selectedEvent.time}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedEvent.advice && (
            <Card>
              <CardHeader>
                <CardTitle>Weather Advice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`${selectedEvent.advice.bgColor} text-white p-6 rounded-lg`}>
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{selectedEvent.advice.emoji}</span>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{selectedEvent.advice.title}</h3>
                      <p className="opacity-90">{selectedEvent.advice.description}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {selectedEvent.weather && (
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
                    {selectedEvent.weather.avg_temperature.toFixed(1)}°C
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Rainfall</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {selectedEvent.weather.avg_rainfall.toFixed(1)}mm
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">Wind Speed</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-700">
                    {selectedEvent.weather.avg_wind_speed.toFixed(1)}m/s
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Humidity</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {selectedEvent.weather.avg_humidity.toFixed(1)}%
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
        <h1 className="text-2xl font-bold">Event Planner</h1>
        {user && (
          <Button onClick={() => setActiveView('create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>

      {!user ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold mb-2">Sign in required</h3>
            <p className="text-gray-600 text-center mb-6">
              Please sign in to create and manage your events with weather forecasts.
            </p>
          </CardContent>
        </Card>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">No events yet</h3>
            <p className="text-gray-600 text-center mb-6">
              Create your first event and get weather forecasts to plan perfectly!
            </p>
            <Button onClick={() => setActiveView('create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      {event.location.name}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEvent(event.id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent onClick={() => viewEventDetails(event)}>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {format(event.date, "EEEE, MMM dd, yyyy")}
                    {event.time && ` at ${event.time}`}
                  </p>
                  
                  {event.advice && (
                    <div className={`${event.advice.bgColor} text-white p-3 rounded-lg`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{event.advice.emoji}</span>
                        <div>
                          <p className="font-medium text-sm">{event.advice.title}</p>
                          <p className="text-xs opacity-90">{event.advice.description}</p>
                          {event.weather && (
                            <p className="text-xs opacity-75 mt-1">
                              Suitability: {getEventSuitabilityScore(event.weather)}/100
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {event.weather && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-orange-50 p-2 rounded text-center">
                        <p className="font-medium text-orange-700">
                          {event.weather.avg_temperature.toFixed(1)}°C
                        </p>
                        <p className="text-orange-600">Temp</p>
                      </div>
                      <div className="bg-blue-50 p-2 rounded text-center">
                        <p className="font-medium text-blue-700">
                          {event.weather.avg_rainfall.toFixed(1)}mm
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