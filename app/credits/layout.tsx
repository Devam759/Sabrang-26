import type { ReactNode } from "react";

// Credits page uses a full-screen immersive layout —
// no navbar, no footer, no container constraints.
export default function CreditsLayout({ children }: { children: ReactNode }) {
  return <div className="credits-layout-escape">{children}</div>;
}
