import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database.types";

import { getPublicSupabaseConfig } from "./config";

const adminKeySchema = z.string().min(1);

export function createAdminClient(): SupabaseClient<Database> {
  const { url } = getPublicSupabaseConfig();
  const keyResult = adminKeySchema.safeParse(
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  if (!keyResult.success) {
    throw new Error(
      "Configurazione Supabase amministrativa mancante. Verifica SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createSupabaseClient<Database>(url, keyResult.data, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
