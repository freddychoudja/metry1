import WeatherDashboard from "./components/WeatherDashboard";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <div className="min-h-screen">
      <WeatherDashboard />
      <Toaster />
    </div>
  );
}

export default App;