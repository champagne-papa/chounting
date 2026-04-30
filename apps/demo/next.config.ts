import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Source-shipped workspace package — Next must transpile its
  // .ts/.tsx files because @chounting/ui has no build step.
  transpilePackages: ["@chounting/ui"],
};

export default nextConfig;
