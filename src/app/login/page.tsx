"use client";

import dynamic from "next/dynamic";

const Login = dynamic(() => import("@/views/Login"), { ssr: false, loading: () => null });

export default function LoginPage() {
  return <Login />;
}
