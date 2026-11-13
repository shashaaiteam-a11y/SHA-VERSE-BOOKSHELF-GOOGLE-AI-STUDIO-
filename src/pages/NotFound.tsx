import React from "react";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">404 - Page Not Found</h1>
        <p className="text-muted-foreground text-sm">
          The page or book you are looking for doesn't exist or has been moved.
        </p>
        <div className="pt-2">
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Bookshelf
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
