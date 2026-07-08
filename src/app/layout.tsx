import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Math Wings",
  description: "Your brain is the button - A math game where solving problems makes you fly!",
  manifest: "/manifest.json",
  icons: {
    apple: "/images/apple-touch-icon.png",
  },
  openGraph: {
    title: "Math Wings",
    description: "Your brain is the button - A math game where solving problems makes you fly!",
    type: "website",
    images: ["/images/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Math Wings",
    description: "Your brain is the button - A math game where solving problems makes you fly!",
    images: ["/images/icon-512.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0D1B2A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/dseg7_classic_bold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/dseg14_classic_bold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
