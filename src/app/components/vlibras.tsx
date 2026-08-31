"use client";
import { useEffect } from "react";
import Script from "next/script";

export default function VLibras() {
  useEffect(() => {
    if (window.VLibras) {
      new window.VLibras.Widget("https://vlibras.gov.br/app");
    }
  }, []);

  return (
    <>
      <div vw="true" className="enabled">
        <div vw-access-button="true" className="active"></div>
        <div vw-plugin-wrapper="true">
          <div className="vw-plugin-top-wrapper"></div>
        </div>
      </div>
      <Script
        src="https://vlibras.gov.br/app/vlibras-plugin.js"
        strategy="afterInteractive"
      />
    </>
  );
}