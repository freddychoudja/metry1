import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchWithRetry = async (url: string, options: any, retries = 2, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        if (i < retries - 1) {
          await new Promise(r => setTimeout(r, delay));
        } else {
          throw error;
        }
      }
    }
  };

  const searchLocations = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Use Supabase Edge Function to proxy Nominatim
      const { data, error } = await supabase.functions.invoke('search-locations', {
        body: { query: searchQuery }
      });
      
      if (error) throw error;
      
      setSuggestions(data || []);
    } catch (error) {
      // Fallback to predefined locations
      const fallbackLocations = [
        { lat: '40.7128', lon: '-74.0060', display_name: 'New York, NY, USA' },
        { lat: '51.5074', lon: '-0.1278', display_name: 'London, UK' },
        { lat: '48.8566', lon: '2.3522', display_name: 'Paris, France' },
        { lat: '35.6762', lon: '139.6503', display_name: 'Tokyo, Japan' },
        { lat: '-33.8688', lon: '151.2093', display_name: 'Sydney, Australia' },
        { lat: '3.848', lon: '11.502', display_name: 'Yaoundé, Cameroon' },
        { lat: '5.1439', lon: '10.5167', display_name: 'Bangangte, Cameroon' },
        { lat: '6.2442', lon: '1.4372', display_name: 'Lomé, Togo' },
        { lat: '5.6037', lon: '-0.1870', display_name: 'Accra, Ghana' }
      ].filter(loc => loc.display_name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      setSuggestions(fallbackLocations);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowDropdown(true);
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
    setShowDropdown(false);
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
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {showDropdown && (suggestions.length > 0 || query.length >= 3) && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                onClick={() => selectLocation(suggestion)}
              >
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{suggestion.display_name}</span>
              </button>
            ))
          ) : query.length >= 3 && !loading ? (
            <div className="px-4 py-2 text-sm text-gray-500">
              No locations found. Try a different search term.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}