import "./globals.css";

/**
 * Layout — wraps every page in the app.
 *
 * The <meta> tags here are critical for PWA behavior:
 * - "theme-color" controls the browser toolbar color
 * - "apple-mobile-web-app-capable" enables full-screen on iOS
 * - The manifest link tells the browser this is an installable app
 */
export const metadata = {
  title: "NicheNews — Your Personalized Feed",
  description: "Stay updated on exactly what matters to you. No algorithm, no noise.",
  manifest: "/manifest.json",
  themeColor: "#06060f",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NicheNews",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts — Inter is a clean, modern typeface */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* PWA icon for iOS */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
