/** @type {import('next').NextConfig} */
const nextConfig = {
  // The container runs a Node server (see Dockerfile); Traefik still routes /api to the backend.
  output: "standalone",
  poweredByHeader: false,
  // `next dev` appends a block of "agent rules" to AGENTS.md on every start; the repo's AGENTS.md is hand-written.
  agentRules: false,
};

export default nextConfig;
