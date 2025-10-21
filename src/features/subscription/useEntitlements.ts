import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { plans, planFromSubscription, type PlanId } from "./plans";
import { isUnlimitedEmail } from "@/config/unlimited";

export type Entitlements = {
  planId: PlanId;
  aiEnabled: boolean;
  monthlyExportLimit: number;
  watermarkRequired: boolean;
  loading: boolean;
};

export function useEntitlements(): Entitlements {
  const { user } = useAuth();

  const isLocalUnlimited = isUnlimitedEmail(user?.email ?? null);

  const { data: isServerUnlimited = false, isLoading: isCheckingUnlimited } = useQuery({
    queryKey: ["unlimited_whitelist", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ unlimited: boolean }>(
        "whitelist",
        { body: { action: "check", email: user!.email! } }
      );
      if (error) throw error;
      return !!(data as any)?.unlimited;
    },
  });

  const unlimited = isLocalUnlimited || isServerUnlimited;

  const { data, isLoading: isLoadingSub } = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user?.id && !unlimited,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (unlimited) {
    return {
      planId: "pro",
      aiEnabled: true,
      monthlyExportLimit: Number.MAX_SAFE_INTEGER,
      watermarkRequired: false,
      loading: isCheckingUnlimited && !!user?.email,
    };
  }

  const planId = planFromSubscription(
    data ? { status: (data as any)?.status, product_id: (data as any)?.product_id } : undefined
  );
  const plan = plans[planId];

  return {
    planId,
    aiEnabled: plan.aiEnabled,
    monthlyExportLimit: plan.monthlyExportLimit,
    watermarkRequired: plan.watermarkRequired,
    loading: (isLoadingSub && !!user?.id) || (isCheckingUnlimited && !!user?.email),
  };
}