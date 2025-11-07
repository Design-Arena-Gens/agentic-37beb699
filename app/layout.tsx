import "./globals.css";
import type { Metadata } from "next";

const APP_NAME = "WhatsAuto Twin";

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    "Configure an auto-responder that mirrors your personal WhatsApp tone when you're away."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
