"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import { getPublicSupabaseConfig } from "./config";

let browserClient: SupabaseClient<Database> | undefined;

export function createClient(): SupabaseClient<Database> {
  if (browserClient) {
    return browserClient;
  }

  const { url, publishableKey } = getPublicSupabaseConfig();
  browserClient = createBrowserClient<Database>(url, publishableKey);

  return browserClient;
}
