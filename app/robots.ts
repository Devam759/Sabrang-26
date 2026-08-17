import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://sabrang.jklu.edu.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/dashboard/", "/login/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/dashboard/", "/login/"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/dashboard/", "/login/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
