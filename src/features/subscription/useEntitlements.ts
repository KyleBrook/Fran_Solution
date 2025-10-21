import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { plans, planFromSubscription, type PlanId } from "./plans";

export type Entitlements = {
  planId: PlanId;
  aiEnabled: boolean;
  monthlyExportLimit: number;
  watermarkRequired: boolean;
  loading: boolean;
};

export function useEntitlements(): Entitlements {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user?.id,
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

  const planId = planFromSubscription(
    data ? { status: (data as any)?.status, product_id: (data as any)?.product_id } : undefined
  );
  const plan = plans[planId];

  return {
    planId,
    aiEnabled: plan.aiEnabled,
    monthlyExportLimit: plan.monthlyExportLimit,
    watermarkRequired: plan.watermarkRequired,
    loading: isLoading && !!user?.id,
  };
}