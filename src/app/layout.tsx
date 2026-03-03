import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "JBB – Jual Beli Buntu",
    template: "%s | JBB",
  },
  description:
    "JBB (Jual Beli Buntu) adalah platform e-commerce digital untuk warga Buntu. Belanja mudah, bayar QRIS, pengiriman oleh kurir lokal.",
  keywords: ["jbb", "jual beli buntu", "e-commerce buntu", "qris", "belanja online buntu"],
  openGraph: {
    title: "JBB – Jual Beli Buntu",
    description: "Platform e-commerce untuk warga Buntu. Bayar dengan QRIS.",
    type: "website",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 antialiased" suppressHydrationWarning>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
