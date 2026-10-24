import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vedic-ai.vercel.app";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/", "/login", "/reports"] },
    ],
    sitemap: baseUrl.replace(/\/$/, "") + "/sitemap.xml",
  };
}
