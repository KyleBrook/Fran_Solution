import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import { isAdminEmail } from "@/config/admins";
import i18n from "@/i18n";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

const PUBLIC_ROUTES = ["/login", "/ebookfy", "/reset-password"];
const DEFAULT_LANGUAGE = "pt";

const normalizeLanguage = (lng?: string | null) => {
  if (!lng) return DEFAULT_LANGUAGE;
  return lng.split("-")[0];
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(isAdminEmail(currentUser?.email ?? null));
      setLoading(false);

      if (!data.session && !PUBLIC_ROUTES.includes(location.pathname)) {
        navigate("/login", { replace: true });
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);
      setIsAdmin(isAdminEmail(newUser?.email ?? null));

      if (event === "SIGNED_IN") {
        navigate("/dashboard", { replace: true });
      } else if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password", { replace: true });
      } else if (event === "SIGNED_OUT") {
        navigate("/login", { replace: true });
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  useEffect(() => {
    let active = true;

    const applyLanguagePreference = async (currentUser: User | null) => {
      if (!active) return;

      const stored = typeof window !== "undefined" ? window.localStorage.getItem("lang") : null;
      const storedLanguage = normalizeLanguage(stored);

      if (!currentUser) {
        const guestLanguage = storedLanguage || DEFAULT_LANGUAGE;
        if (guestLanguage !== normalizeLanguage(i18n.language)) {
          await i18n.changeLanguage(guestLanguage);
        }
        return;
      }

      const { data, error } = await supabase
        .from("user_preferences")
        .select("language")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Failed to load language preference:", error);
        const fallback = storedLanguage || DEFAULT_LANGUAGE;
        if (fallback !== normalizeLanguage(i18n.language)) {
          await i18n.changeLanguage(fallback);
        }
        return;
      }

      if (data?.language) {
        const preferred = normalizeLanguage(data.language);
        if (preferred !== normalizeLanguage(i18n.language)) {
          await i18n.changeLanguage(preferred);
        }
        if (typeof window !== "undefined") {
          window.localStorage.setItem("lang", preferred);
        }
      } else {
        const fallback = storedLanguage || DEFAULT_LANGUAGE;
        const { error: upsertError } = await supabase
          .from("user_preferences")
          .upsert({ user_id: currentUser.id, language: fallback }, { onConflict: "user_id" });

        if (upsertError) {
          console.error("Failed to persist language preference:", upsertError);
        }

        if (fallback !== normalizeLanguage(i18n.language)) {
          await i18n.changeLanguage(fallback);
        }
        if (typeof window !== "undefined") {
          window.localStorage.setItem("lang", fallback);
        }
      }
    };

    applyLanguagePreference(user);

    return () => {
      active = false;
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;