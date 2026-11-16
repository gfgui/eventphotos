import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image (local and cloud modes).
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // In development, Next.js would print the arguments of Server Actions: passwords included.
  logging: { serverFunctions: false },
  // Phones open the dev server by the notebook's IP, when PUBLIC_URL points to it.
  allowedDevOrigins: process.env.PUBLIC_URL
    ? [new URL(process.env.PUBLIC_URL).hostname]
    : [],
  // Loaded by Node at run time, outside the server bundle: heic-decode alone embeds 2 MB of WebAssembly.
  serverExternalPackages: ["pg-boss", "heic-decode"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
