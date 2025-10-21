export type PlanId = "free" | "basic" | "pro";

export type Plan = {
  id: PlanId;
  label: string;
  aiEnabled: boolean;
  monthlyExportLimit: number;
  watermarkRequired: boolean;
};

export const plans: Record<PlanId, Plan> = {
  free: {
    id: "free",
    label: "Free",
    aiEnabled: false,
    monthlyExportLimit: 1,
    watermarkRequired: true,
  },
  basic: {
    id: "basic",
    label: "Basic",
    aiEnabled: true,
    monthlyExportLimit: 10,
    watermarkRequired: false,
  },
  pro: {
    id: "pro",
    label: "Pro",
    aiEnabled: true,
    monthlyExportLimit: 50,
    watermarkRequired: false,
  },
};

// Mapeamento simples (até integrar Stripe):
// - status !== 'active' => free
// - status === 'active' e product_id === 'basic' => basic
// - status === 'active' e product_id === 'pro' => pro
export function planFromSubscription(sub?: { status?: string | null; product_id?: string | null }): PlanId {
  if (!sub?.status || sub.status !== "active") return "free";
  const pid = (sub.product_id || "").toLowerCase();
  if (pid === "pro") return "pro";
  if (pid === "basic") return "basic";
  return "free";
}