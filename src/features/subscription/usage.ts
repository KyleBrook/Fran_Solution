import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getMonthlyExportCount(userId: string): Promise<number> {
  const start = startOfMonth(new Date()).toISOString();
  const end = endOfMonth(new Date()).toISOString();

  const { count, error } = await supabase
    .from("pdf_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start)
    .lte("created_at", end);

  if (error) throw error;
  return count || 0;
}