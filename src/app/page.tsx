import { redirect } from "next/navigation";

import { getAuthenticatedContext } from "@/features/auth/auth.data";

export default async function HomePage() {
  const context = await getAuthenticatedContext();
  redirect(context ? "/dashboard" : "/login");
}
