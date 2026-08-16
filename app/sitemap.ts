import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://sabrang.jklu.edu.in";
  // Fixed date — update this when content changes significantly
  const lastUpdated = "2026-08-14T00:00:00.000Z";

  return [
    {
      url: baseUrl,
      lastModified: lastUpdated,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: lastUpdated,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: lastUpdated,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/schedule`,
      lastModified: lastUpdated,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: lastUpdated,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/team`,
      lastModified: lastUpdated,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: lastUpdated,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sponsors`,
      lastModified: lastUpdated,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: lastUpdated,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: lastUpdated,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/menu`,
      lastModified: lastUpdated,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/credits`,
      lastModified: lastUpdated,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
