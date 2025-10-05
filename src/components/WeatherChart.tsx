import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface WeatherData {
  latitude: number;
  longitude: number;
  month: number;
  day: number;
  avg_temperature: number;
  avg_humidity: number;
  avg_rainfall: number;
  avg_wind_speed: number;
  extreme_heat_probability: number;
  heavy_rain_probability: number;
  data_source: string;
}

interface WeatherChartProps {
  data: WeatherData[];
}

const COLORS = {
  temperature: "#f97316",
  humidity: "#3b82f6", 
  rainfall: "#06b6d4",
  wind: "#6b7280",
  heat: "#dc2626",
  rain: "#2563eb"
};

type MetricTooltipProps = {
  payload: {
    unit: string;
  };
};

export function WeatherChart({ data }: WeatherChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const weatherData = data[0]; // Use first data point for now
  
  const metrics = [
    { name: "Temperature", value: weatherData.avg_temperature, unit: "°C", color: COLORS.temperature },
    { name: "Humidity", value: weatherData.avg_humidity, unit: "%", color: COLORS.humidity },
    { name: "Rainfall", value: weatherData.avg_rainfall, unit: "mm", color: COLORS.rainfall },
    { name: "Wind Speed", value: weatherData.avg_wind_speed, unit: "m/s", color: COLORS.wind }
  ];

  const probabilities = [
    { name: "Extreme Heat", value: weatherData.extreme_heat_probability, color: COLORS.heat },
    { name: "Heavy Rain", value: weatherData.heavy_rain_probability, color: COLORS.rain }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weather Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value: number, name: string, props: MetricTooltipProps) => [
                  `${value.toFixed(1)} ${props.payload.unit}`,
                  name
                ]}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {metrics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Probabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={probabilities} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" domain={[0, 100]} fontSize={12} />
              <YAxis dataKey="name" type="category" width={80} fontSize={12} />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Probability']}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {probabilities.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location & Data Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p><span className="font-medium">Coordinates:</span> {weatherData.latitude.toFixed(4)}°, {weatherData.longitude.toFixed(4)}°</p>
              <p><span className="font-medium">Date:</span> {new Date(2024, weatherData.month - 1, weatherData.day).toLocaleDateString()}</p>
            </div>
            <div className="space-y-1">
              <p><span className="font-medium">Source:</span> {weatherData.data_source}</p>
              <p className="text-xs text-gray-500">Historical data (2000-2023)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}