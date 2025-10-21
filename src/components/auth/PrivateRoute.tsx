import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Card, CardContent } from "@/components/ui/card";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Carregando...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;