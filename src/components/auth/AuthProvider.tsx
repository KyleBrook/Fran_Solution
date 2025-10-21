import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);

      // Redirecionar conforme estado inicial
      if (!data.session && location.pathname.startsWith("/dashboard")) {
        navigate("/login", { replace: true });
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === "SIGNED_IN") {
        navigate("/dashboard", { replace: true });
      } else if (event === "SIGNED_OUT") {
        navigate("/login", { replace: true });
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;