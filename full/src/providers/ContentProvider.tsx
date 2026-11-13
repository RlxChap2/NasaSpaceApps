"use client";

import { createContext, useContext, ReactNode } from "react";
import type { SiteContent } from "@/lib/content-types";

const ContentContext = createContext<SiteContent | null>(null);

export function ContentProvider({
  children,
  content,
}: {
  children: ReactNode;
  content: SiteContent;
}) {
  return (
    <ContentContext.Provider value={content}>
      {children}
    </ContentContext.Provider>
  );
}

export function useSiteContent() {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error("useSiteContent must be used within a ContentProvider");
  }
  return context;
}
