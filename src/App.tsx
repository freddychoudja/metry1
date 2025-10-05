import WeatherDashboard from "./components/WeatherDashboard";
import { Toaster } from "@/components/ui/toaster";

function App() {
  console.log("App component rendering"); // Ajout de log pour le débogage
  return (
    <div className="min-h-screen bg-background text-foreground">
      <WeatherDashboard />
      <Toaster />
    </div>
  );
}

export default App;