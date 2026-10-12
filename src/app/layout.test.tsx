import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RootLayout, { metadata, viewport } from "./layout";

// The old index.html is gone; these values are what it declared, so the page keeps the same head.
describe("root layout (replaces index.html)", () => {
  it("keeps the title, description, author and Open Graph metadata of the old index.html", () => {
    expect(metadata.title).toBe("Solicitudes Comerciales · Universidad Icesi");
    expect(metadata.description).toBe(
      "Plataforma para gestión de solicitudes comerciales de capacitación, consultoría y mentoría — Universidad Icesi.",
    );
    expect(metadata.authors).toEqual([{ name: "Universidad Icesi" }]);
    expect(metadata.openGraph).toMatchObject({
      title: "Solicitudes Comerciales · Universidad Icesi",
      description: "Gestión de solicitudes comerciales de capacitación, consultoría y mentoría.",
      type: "website",
    });
    expect(viewport).toMatchObject({ width: "device-width", initialScale: 1 });
  });

  it("renders an es document with the Google Fonts links and the children in the body", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <main>contenido</main>
      </RootLayout>,
    );
    expect(html).toContain('<html lang="es">');
    expect(html).toContain('<link rel="preconnect" href="https://fonts.googleapis.com"/>');
    expect(html).toContain('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>');
    expect(html).toContain("family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700");
    expect(html).toContain("family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200");
    expect(html).toContain("<body><main>contenido</main></body>");
  });
});
