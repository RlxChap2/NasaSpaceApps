import projectsJson from "./projects.json";

export interface Project {
  id: string;
  slug: string; // e.g. "beldash" -> rio.dev/beldash
  title: string;
  subtitle: string;
  category: string;
  year: string;
  client: string;
  role: string;
  description: string;
  liveUrl?: string;
  coverImage: string;
  images: string[];
  services: string[];
  stack: string[];
}

/**
 * 🚀 يتم تحميل جميع المشاريع تلقائياً من ملف: src/data/projects.json
 */
export const projectsData: Project[] = projectsJson as Project[];

export function getProjectBySlug(slug: string): Project | undefined {
  return projectsData.find((p) => p.slug.toLowerCase() === slug.toLowerCase());
}

export function getAllProjectSlugs(): string[] {
  return projectsData.map((p) => p.slug);
}

/**
 * 🎲 اختيار صورة مشروع عشوائية للـ OpenGraph و SEO Preview
 */
export function getRandomProjectImage(): string {
  const allImages = projectsData.flatMap((p) => [p.coverImage, ...(p.images || [])]);
  const cleanImages = allImages.filter((img) => typeof img === "string" && img.startsWith("/"));
  if (cleanImages.length === 0) return "/1.png";
  return cleanImages[Math.floor(Math.random() * cleanImages.length)];
}
