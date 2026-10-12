import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../index.css";
import { ClientProviders } from "./client-providers";

// Mirrors the head of the old index.html, so the page looks and reads the same.
const description =
  "Plataforma para gestión de solicitudes comerciales de capacitación, consultoría y mentoría — Universidad Icesi.";

export const metadata: Metadata = {
  title: "Solicitudes Comerciales · Universidad Icesi",
  description,
  authors: [{ name: "Universidad Icesi" }],
  openGraph: {
    title: "Solicitudes Comerciales · Universidad Icesi",
    description: "Gestión de solicitudes comerciales de capacitación, consultoría y mentoría.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&display=swap"
          rel="stylesheet"
        />
        {/* Material Symbols Rounded: mismo set de íconos que usa el portal real de estudiantes de Icesi (ver docs/08). */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
