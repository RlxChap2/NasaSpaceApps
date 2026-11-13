import fs from "fs";
import path from "path";
import type { SiteContent, Project } from "@/lib/content-types";

// Re-export types so we don't break existing imports everywhere immediately
export type { SiteContent, Project };

export function getSiteContent(): SiteContent {
  const contentPath = path.join(process.cwd(), "src", "content", "site-content.json");
  const rawContent = fs.readFileSync(contentPath, "utf8");
  return JSON.parse(rawContent) as SiteContent;
}
