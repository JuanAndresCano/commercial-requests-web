"use client";

import dynamic from "next/dynamic";

const Dashboard = dynamic(() => import("@/views/Dashboard"), { ssr: false, loading: () => null });

export default function DashboardPage() {
  return <Dashboard />;
}
