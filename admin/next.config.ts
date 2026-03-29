import type { NextConfig } from "next";

const LEGACY_SLUGS = [
  "nextstep",
  "checklist",
  "parent-boundary",
  "path",
  "system",
  "calendar",
  "scan",
  "waterzone",
  "border",
  "catch",
  "dating",
  "couples-stuck",
  "familyquiz",
  "generator",
  "fb-app",
];

const nextConfig: NextConfig = {
  async rewrites() {
    return LEGACY_SLUGS.map((slug) => ({
      source: `/${slug}`,
      destination: `/${slug}/index.html`,
    }));
  },
};

export default nextConfig;
