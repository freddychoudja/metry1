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
  }, []);

  const fetchSavedLocations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("saved_locations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedLocations(data || []);
    } catch (error) {
      console.error("Error fetching saved locations:", error);
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
          <p className="text-sm text-gray-500">No saved locations yet.</p>
        ) : (
          <div className="space-y-2">
            {savedLocations.map((location) => (
              <div key={location.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <button
                  onClick={() => selectLocation(location)}
                  className="flex-1 text-left text-sm hover:text-blue-600"
                >
                  {location.name}
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteLocation(location.id)}
                  className="h-6 w-6 p-0"
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