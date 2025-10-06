import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, Loader2, Plus, List, Trash2 } from "lucide-react";
import { LocationSearch } from "./LocationSearch";
import { useToast } from "@/hooks/use-toast";
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

interface EventPlannerProps {
  onEventCreated?: (eventData: any) => void;
  user?: any;
}

export function EventPlanner({ onEventCreated, user }: EventPlannerProps) {
  const [activeView, setActiveView] = useState<'create' | 'list'>('create');
  const [events, setEvents] = useState<Event[]>([]);
  const [eventName, setEventName] = useState("");
  const [location, setLocation] = useState<Location | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getWeatherAdvice = (weather: any): WeatherAdvice => {
    const { avg_temperature, avg_rainfall, avg_wind_speed, heavy_rain_probability, extreme_heat_probability } = weather;

    if (heavy_rain_probability > 20 || avg_rainfall > 10) {
      return {
        emoji: "🌧️",
        title: "High chance of rain",
        description: "Consider indoor options or covered venues.",
        bgColor: "bg-gradient-to-r from-blue-400 to-indigo-500"
      };
    }
    
    if (avg_temperature > 35 || extreme_heat_probability > 15) {
      return {
        emoji: "🔥",
        title: "Very hot conditions",
        description: "Plan for early morning or evening.",
        bgColor: "bg-gradient-to-r from-orange-400 to-red-500"
      };
    }
    
    if (avg_temperature < 15) {
      return {
        emoji: "❄️",
        title: "Cold weather expected",
        description: "Dress warmly and consider indoor venues.",
        bgColor: "bg-gradient-to-r from-blue-500 to-indigo-600"
      };
    }
    
    if (avg_wind_speed > 15) {
      return {
        emoji: "💨",
        title: "Windy conditions",
        description: "Secure all items and decorations.",
        bgColor: "bg-gradient-to-r from-gray-400 to-slate-500"
      };
    }

    return {
      emoji: "🌤️",
      title: "Perfect weather!",
      description: "Great conditions for outdoor activities.",
      bgColor: "bg-gradient-to-r from-green-400 to-emerald-500"
    };
  };

  const handleEventSubmit = async () => {
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

      const newEvent: Event = {
        id: Date.now().toString(),
        name: eventName,
        location,
        date: selectedDate,
        time: selectedTime,
        weather,
        advice
      };

      setEvents(prev => [...prev, newEvent]);
      onEventCreated?.(newEvent);
      
      // Reset form
      setEventName("");
      setLocation(null);
      setSelectedDate(undefined);
      setSelectedTime("");
      
      toast({
        title: "Event Created!",
        description: `"${eventName}" added with weather advice.`,
      });
      
      setActiveView('list');
    } catch (error) {
      console.error("Error fetching weather data:", error);
      toast({
        title: "Error",
        description: "Failed to get weather data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    toast({
      title: "Event Deleted",
      description: "Event removed from your list.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Event Planner</CardTitle>
        <div className="flex gap-1">
          {user && (
            <Button
              size="sm"
              variant={activeView === 'create' ? 'default' : 'outline'}
              onClick={() => setActiveView('create')}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Create
            </Button>
          )}
          <Button
            size="sm"
            variant={activeView === 'list' ? 'default' : 'outline'}
            onClick={() => setActiveView('list')}
            className="text-xs"
          >
            <List className="w-3 h-3 mr-1" />
            Events ({events.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeView === 'create' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="eventName" className="text-xs">Event Name</Label>
              <Input
                id="eventName"
                placeholder="e.g., Picnic, Concert"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Location</Label>
              <LocationSearch onLocationSelect={setLocation} />
              {location && (
                <div className="p-2 bg-blue-50 rounded text-xs">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {location.name || `${location.lat.toFixed(2)}°, ${location.lng.toFixed(2)}°`}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-left font-normal text-xs",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {selectedDate ? format(selectedDate, "MMM dd") : "Pick date"}
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
                <Label htmlFor="eventTime" className="text-xs">Time</Label>
                <Input
                  id="eventTime"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <Button 
              onClick={handleEventSubmit} 
              disabled={loading || !eventName || !location || !selectedDate}
              size="sm"
              className="w-full text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-gray-500">{user ? 'No events created yet' : 'Sign in to create events'}</p>
                {user && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveView('create')}
                    className="mt-2 text-xs"
                  >
                    Create First Event
                  </Button>
                )}
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{event.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {event.location.name}
                      </div>
                      <p className="text-xs text-gray-600">
                        {format(event.date, "MMM dd, yyyy")}
                        {event.time && ` at ${event.time}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteEvent(event.id)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  {event.advice && (
                    <div className={`${event.advice.bgColor} text-white p-2 rounded text-xs`}>
                      <div className="flex items-center gap-2">
                        <span>{event.advice.emoji}</span>
                        <div>
                          <p className="font-medium">{event.advice.title}</p>
                          <p className="opacity-90">{event.advice.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {event.weather && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-orange-50 p-2 rounded">
                        <p className="text-orange-700 font-medium">{event.weather.avg_temperature.toFixed(1)}°C</p>
                        <p className="text-orange-600">Temperature</p>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-blue-700 font-medium">{event.weather.avg_rainfall.toFixed(1)}mm</p>
                        <p className="text-blue-600">Rainfall</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}