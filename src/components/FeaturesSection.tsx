import { Card } from "@/components/ui/card";
import { BarChart3, Map, Download, TrendingUp, Calendar, Shield } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Map,
      title: "Recherche mondiale",
      description: "Explorez n'importe quel lieu sur Terre via carte interactive ou barre de recherche",
    },
    {
      icon: Calendar,
      title: "Données historiques",
      description: "Accédez à plus de 20 ans d'archives climatiques pour des analyses précises",
    },
    {
      icon: BarChart3,
      title: "Visualisations interactives",
      description: "Graphiques, distributions de probabilité et cartes colorées",
    },
    {
      icon: TrendingUp,
      title: "Calculs statistiques",
      description: "Probabilités de conditions extrêmes basées sur des données réelles",
    },
    {
      icon: Shield,
      title: "Sources professionnelles Meteomatics",
      description: "API météorologique professionnelle - données scientifiques fiables",
    },
    {
      icon: Download,
      title: "Export des données",
      description: "Téléchargez vos résultats en CSV/JSON avec métadonnées",
    },
  ];

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Fonctionnalités puissantes
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Une suite complète d'outils pour explorer et comprendre les tendances climatiques
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-6 shadow-soft hover:shadow-medium transition-all duration-300 border-border/50 backdrop-blur-sm bg-card/80 hover:scale-105"
              >
                <div className="inline-flex p-3 rounded-xl bg-gradient-sky mb-4 shadow-glow">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
