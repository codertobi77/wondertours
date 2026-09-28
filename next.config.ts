import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle autonome (.next/standalone/server.js) pour le déploiement LWS
  // (cPanel / Passenger). Sans effet sur Vercel, qui ignore cette option.
  output: "standalone",
};

export default nextConfig;
