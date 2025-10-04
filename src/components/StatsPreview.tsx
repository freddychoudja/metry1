import { Card } from "@/components/ui/card";
import { Thermometer, Droplets, Wind, CloudRain } from "lucide-react";

const StatsPreview = () => {
  const stats = [
    {
      icon: Thermometer,
      label: "Température extrême",
      value: "65%",
      description: "Probabilité > 35°C",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: CloudRain,
      label: "Précipitations",
      value: "40%",
      description: "Probabilité > 10mm/jour",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Wind,
      label: "Vent fort",
      value: "15%",
      description: "Probabilité > 15 m/s",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: Droplets,
      label: "Humidité élevée",
      value: "78%",
      description: "Probabilité > 80%",
      color: "text-primary-glow",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Exemple de résultats
          </h2>
          <p className="text-muted-foreground">
            Statistiques climatiques pour Lagos, Nigeria - Juin
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="p-6 shadow-soft hover:shadow-medium transition-shadow border-border/50 backdrop-blur-sm bg-card/80"
              >
                <div className={`inline-flex p-3 rounded-xl ${stat.bgColor} mb-4`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {stat.label}
                </h3>
                
                <div className={`text-4xl font-bold ${stat.color} mb-2`}>
                  {stat.value}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Summary text */}
        <Card className="mt-8 p-6 shadow-soft border-border/50 backdrop-blur-sm bg-card/80">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-sky flex items-center justify-center">
              <Thermometer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Résumé climatique
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                En juin à Lagos : <span className="text-accent font-semibold">65% de chance de journées très chaudes</span> (&gt;35°C), 
                avec <span className="text-primary font-semibold">40% de probabilité de pluie</span> (&gt;10mm/jour). 
                L'humidité reste élevée à <span className="text-primary-glow font-semibold">78%</span>, créant des conditions tropicales typiques. 
                Les vents restent modérés avec seulement 15% de chance de conditions venteuses.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default StatsPreview;
