/** @type {import('next').NextConfig} */
const nextConfig = {
  // The container runs a Node server (see Dockerfile); Traefik still routes /api to the backend.
  output: "standalone",
  poweredByHeader: false,
  // The Vite entry point (main.tsx) never used StrictMode; the App Router turns it on by default, which in
  // `next dev` would run every effect twice (EventSource, requests). Production is not affected either way.
  reactStrictMode: false,
  // `next dev` appends a block of "agent rules" to AGENTS.md on every start; the repo's AGENTS.md is hand-written.
  agentRules: false,
  async headers() {
    // Same rule as the old nginx.conf: everything but the content-hashed assets is revalidated on every load,
    // so a new deploy is picked up and a cached page never points to chunks that no longer exist.
    return [{ source: "/((?!_next/static/).*)", headers: [{ key: "Cache-Control", value: "no-cache" }] }];
  },
};

export default nextConfig;
