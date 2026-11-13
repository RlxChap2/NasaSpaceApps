import type { Project } from "@/lib/content-types";

export type { Project };

export function projectHref(project: Project) {
  const href = project.href?.trim();

  if (!href || !href.includes("/") && !href.startsWith("#")) {
    return `/works/${project.id}`;
  }

  return href;
}

export function getProject(projects: Project[], id: string) {
  return projects.find((project) => project.id === id);
}

export function getNextProject(projects: Project[], id: string) {
  const currentIndex = projects.findIndex((project) => project.id === id);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % projects.length;

  return projects[nextIndex];
}
