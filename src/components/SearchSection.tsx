import { useState } from "react";
import { Search, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const SearchSection = () => {
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const handleSearch = () => {
    console.log("Searching for:", { location, date });
    // TODO: Implement API call
  };

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="p-8 shadow-medium border-border/50 backdrop-blur-sm bg-card/80">
          <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
            Explorez les données climatiques
          </h2>
          
          <div className="space-y-6">
            {/* Location input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                Lieu
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Ex: Lagos, Nigeria"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 h-12 text-lg border-border/50 focus:border-primary transition-colors"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Entrez une ville, région ou coordonnées GPS
              </p>
            </div>

            {/* Date input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                Date / Période
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 text-lg border-border/50 focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground">
                Sélectionnez un jour, mois ou saison
              </p>
            </div>

            {/* Search button */}
            <Button
              onClick={handleSearch}
              disabled={!location || !date}
              size="lg"
              className="w-full h-14 text-lg font-semibold bg-gradient-sky hover:opacity-90 transition-opacity shadow-glow"
            >
              <Search className="w-5 h-5 mr-2" />
              Analyser le climat
            </Button>
          </div>
        </Card>

        {/* Quick info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>💡 Les données proviennent des API NASA POWER, GPM, MERRA-2 et MODIS</p>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;
