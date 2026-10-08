import Script from "next/script";

export function ContentAdsenseScript() {
  const adsenseClient =
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT ??
    "ca-pub-5723913841152869";

  return (
    <Script
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
      strategy="afterInteractive"
    />
  );
}
