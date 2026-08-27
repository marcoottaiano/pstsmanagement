import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app.config";

export const metadata: Metadata = {
  title: `Statistiche | ${APP_CONFIG.name}`,
};

export default function AdminReportsPage() {
  redirect("/dashboard/admin/statistics");
}
