import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/types/database.types";

import { getPublicSupabaseConfig } from "./config";

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  const { url, publishableKey } = getPublicSupabaseConfig();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The phase 3 proxy will refresh sessions.
        }
      },
    },
  });
}
