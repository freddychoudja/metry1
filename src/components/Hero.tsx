import { Cloud, TrendingUp, MapPin } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-sky">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 animate-float">
          <Cloud className="w-32 h-32 text-white" />
        </div>
        <div className="absolute bottom-20 right-20 animate-float" style={{ animationDelay: "2s" }}>
          <Cloud className="w-40 h-40 text-white" />
        </div>
        <div className="absolute top-1/2 left-1/3 animate-float" style={{ animationDelay: "4s" }}>
          <Cloud className="w-24 h-24 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white mb-6 animate-pulse-glow">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">Powered by Meteomatics</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
          WeatherWise Explorer
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 drop-shadow">
          Découvrez les statistiques climatiques historiques de n'importe quel lieu sur Terre.
          Analysez les tendances, calculez les probabilités et anticipez les conditions extrêmes.
        </p>

        <div className="flex flex-wrap justify-center gap-4 text-white/80">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <span>Recherche mondiale</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <span>Données historiques 20+ ans</span>
          </div>
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            <span>API Meteomatics professionnelle</span>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
