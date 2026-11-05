import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./page";
import LoginPage from "./login/page";
import NotFoundPage from "./not-found";
import DashboardPage from "./(private)/dashboard/page";
import NewRequestPage from "./(private)/solicitudes/nueva/page";
import RequestDetailPage from "./(private)/solicitudes/[id]/page";
import PrivateLayout from "./(private)/layout";

vi.mock("@/views/Index", () => ({ default: () => <div>vista-index</div> }));
vi.mock("@/views/Login", () => ({ default: () => <div>vista-login</div> }));
vi.mock("@/views/NotFound", () => ({ default: () => <div>vista-404</div> }));
vi.mock("@/views/Dashboard", () => ({ default: () => <div>vista-dashboard</div> }));
vi.mock("@/views/NewRequest", () => ({ default: () => <div>vista-nueva</div> }));
vi.mock("@/views/RequestDetail", () => ({ default: () => <div>vista-detalle</div> }));
vi.mock("@/components/RequireAuth", () => ({
  RequireAuth: ({ children }: { children: ReactElement }) => <div data-testid="guard">{children}</div>,
}));

// Each route file must load its own view (client-side only) and nothing else.
describe("app routes", () => {
  it.each([
    ["/", HomePage, "vista-index"],
    ["/login", LoginPage, "vista-login"],
    ["not-found", NotFoundPage, "vista-404"],
    ["/dashboard", DashboardPage, "vista-dashboard"],
    ["/solicitudes/nueva", NewRequestPage, "vista-nueva"],
    ["/solicitudes/[id]", RequestDetailPage, "vista-detalle"],
  ])("%s renders its view", async (_route, Page, marker) => {
    render(<Page />);
    expect(await screen.findByText(marker)).toBeInTheDocument();
  });

  it("the (private) layout puts its children behind the auth guard", () => {
    render(
      <PrivateLayout>
        <span>privado</span>
      </PrivateLayout>,
    );
    expect(screen.getByTestId("guard")).toContainElement(screen.getByText("privado"));
  });
});
