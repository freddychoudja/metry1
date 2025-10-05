import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Wifi } from "lucide-react";

interface StatusItem {
  name: string;
  status: "online" | "offline" | "checking";
  description: string;
}

export function AppStatus() {
  const [statuses, setStatuses] = useState<StatusItem[]>([
    { name: "Frontend", status: "checking", description: "React application" },
    { name: "Supabase", status: "checking", description: "Database connection" },
    { name: "NASA API", status: "checking", description: "Historical weather data" },
  ]);

  useEffect(() => {
    const checkStatuses = async () => {
      // Check frontend (always online if component renders)
      setStatuses(prev => prev.map(item => 
        item.name === "Frontend" ? { ...item, status: "online" as const } : item
      ));

      // Check Supabase
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (supabaseUrl) {
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: "HEAD",
            headers: {
              "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY || "",
            },
          });
          
          setStatuses(prev => prev.map(item => 
            item.name === "Supabase" ? { 
              ...item, 
              status: response.ok ? "online" as const : "offline" as const 
            } : item
          ));
        } else {
          setStatuses(prev => prev.map(item => 
            item.name === "Supabase" ? { ...item, status: "offline" as const } : item
          ));
        }
      } catch {
        setStatuses(prev => prev.map(item => 
          item.name === "Supabase" ? { ...item, status: "offline" as const } : item
        ));
      }

      // Check NASA API endpoint
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (supabaseUrl) {
          const response = await fetch(`${supabaseUrl}/functions/v1/get-nasa-weather`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              latitude: 0,
              longitude: 0,
              month: 1,
              day: 1,
            }),
          });
          
          setStatuses(prev => prev.map(item => 
            item.name === "NASA API" ? { 
              ...item, 
              status: response.status !== 404 ? "online" as const : "offline" as const 
            } : item
          ));
        } else {
          setStatuses(prev => prev.map(item => 
            item.name === "NASA API" ? { ...item, status: "offline" as const } : item
          ));
        }
      } catch {
        setStatuses(prev => prev.map(item => 
          item.name === "NASA API" ? { ...item, status: "offline" as const } : item
        ));
      }
    };

    checkStatuses();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "offline":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "checking":
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case "offline":
        return <Badge variant="destructive">Offline</Badge>;
      case "checking":
        return <Badge variant="secondary">Checking...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const allOnline = statuses.every(item => item.status === "online");

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          System Status
          {allOnline && <Badge className="bg-green-100 text-green-800">All Systems Operational</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statuses.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                {getStatusIcon(item.status)}
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
              {getStatusBadge(item.status)}
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>App Version:</strong> 1.0.0<br />
            <strong>Data Source:</strong> NASA POWER API<br />
            <strong>Last Updated:</strong> {new Date().toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}