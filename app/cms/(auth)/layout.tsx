import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../cms.css";

/** Sign-in, forgot and reset password pages: never in search results. */
export const metadata: Metadata = { title: "Air Dive Alor CMS", robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="cms cms-auth">
      <div className="cms-auth__card">
        <div className="cms-auth__brand">
          <img src="/brand/logo-air-dive-alor-white.png" srcSet="/brand/logo-air-dive-alor-white.png 600w, /brand/logo-air-dive-alor-white@2x.png 1200w" sizes="54px" alt="Air Dive Alor" />
          <span>Content management</span>
        </div>
        {children}
      </div>
    </div>
  );
}
