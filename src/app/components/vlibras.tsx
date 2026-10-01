"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => unknown;
    };
  }
}

export default function VLibras() {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!scriptLoaded) return;

    if (window.VLibras) {
      new window.VLibras.Widget("https://vlibras.gov.br/app");
    }
  }, [scriptLoaded]);

  return (
    <>
      <div
        vw="true"
        className="enabled"
        aria-label="VLibras - Acessibilidade em Libras"
      >
        <div
          vw-access-button="true"
          className="active"
        />

        <div
          vw-plugin-wrapper="true"
        >
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>

      <Script
        src="https://vlibras.gov.br/app/vlibras-plugin.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
    </>
  );
}
