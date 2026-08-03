import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "tars",
  description: "Local dashboard for tars projects, worktrees, and PRDs",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a href="/" className="brand">
            tars
          </a>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
