import React, { useEffect } from "react";
import { Layout } from "./Layout";

type PageLayoutProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export function PageLayout({ title, description, children }: PageLayoutProps) {
  useEffect(() => {
    if (title) document.title = `${title} | MedRise Medical Centre`;
    if (description) {
      let el = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.name = "description";
        document.head.appendChild(el);
      }
      el.content = description;
    }
  }, [title, description]);

  return <Layout>{children}</Layout>;
}

export default PageLayout;
