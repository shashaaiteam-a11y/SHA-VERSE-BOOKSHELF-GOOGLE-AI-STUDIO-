import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Offline: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
          <WifiOff className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">You are offline</h1>
        <p className="text-muted-foreground text-sm">
          Please check your internet connection and try refreshing. Downloaded books in your library are still accessible!
        </p>
        <div className="pt-2">
          <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Offline;
