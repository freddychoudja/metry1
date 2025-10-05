import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Location {
  lat: number;
  lng: number;
  name?: string;
}

interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface SavedLocationsProps {
  onLocationSelect: (location: Location) => void;
}

export function SavedLocations({ onLocationSelect }: SavedLocationsProps) {
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSavedLocations();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('saved_locations_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'saved_locations' },
        () => fetchSavedLocations()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSavedLocations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("saved_locations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        // Handle missing table gracefully
        if (error.code === '42P01' || error.message?.includes('relation')) {
          console.warn('Saved locations table not found - database not configured');
          setSavedLocations([]);
        } else if (error.code === 'PGRST116' || error.message?.includes('406')) {
          console.warn('Query parameter encoding issue - retrying with simpler query');
          // Retry with a simpler query
          const { data: retryData, error: retryError } = await supabase
            .from("saved_locations")
            .select("id, name, latitude, longitude, created_at")
            .eq("user_id", user.id);
          
          if (retryError) {
            throw retryError;
          }
          setSavedLocations(retryData || []);
        } else {
          throw error;
        }
      } else {
        setSavedLocations(data || []);
      }
    } catch (error: any) {
      console.warn('Error fetching saved locations:', error?.message || 'Unknown error');
      setSavedLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_locations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSavedLocations(prev => prev.filter(loc => loc.id !== id));
      toast({
        title: "Location Deleted",
        description: "Location removed from your favorites.",
      });
    } catch (error) {
      console.error("Error deleting location:", error);
      toast({
        title: "Error",
        description: "Failed to delete location.",
        variant: "destructive",
      });
    }
  };

  const selectLocation = (savedLocation: SavedLocation) => {
    onLocationSelect({
      lat: savedLocation.latitude,
      lng: savedLocation.longitude,
      name: savedLocation.name
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Saved Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Saved Locations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {savedLocations.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-2">No saved locations yet.</p>
            <p className="text-xs text-gray-400">
              Save locations by selecting them and clicking the heart icon.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {savedLocations.map((location) => (
              <div key={location.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                <button
                  onClick={() => selectLocation(location)}
                  className="flex-1 text-left text-sm hover:text-blue-600 font-medium"
                  title={`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                >
                  {location.name}
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteLocation(location.id)}
                  className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                  title="Delete location"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}