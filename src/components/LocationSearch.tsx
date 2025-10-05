import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";

interface Location {
  lat: number;
  lng: number;
  name?: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
}

interface NominatimSuggestion {
  lat: string;
  lon: string;
  display_name: string;
}

export function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const searchLocations = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error searching locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    searchLocations(value);
  };

  const selectLocation = (suggestion: NominatimSuggestion) => {
    const location: Location = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      name: suggestion.display_name.split(",")[0]
    };
    onLocationSelect(location);
    setQuery(suggestion.display_name.split(",")[0]);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search for a city or location..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              onClick={() => selectLocation(suggestion)}
            >
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{suggestion.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}