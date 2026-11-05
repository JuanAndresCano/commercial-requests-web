import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TestRouter } from "@/test/router";
import { Link, useParams, usePathname, useRouter, useSearchParams } from "./index";

function Probe() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const route = useParams<{ id?: string }>();
  return (
    <div>
      <span data-testid="pathname">{pathname}</span>
      <span data-testid="query">{params.get("filter") ?? "none"}</span>
      <span data-testid="id">{route.id ?? "no-id"}</span>
      <button onClick={() => router.push("/dashboard")}>push</button>
      <button onClick={() => router.replace("/login")}>replace</button>
      <button onClick={() => router.back()}>back</button>
      <Link href="/solicitudes/nueva" className="to-wizard">
        wizard
      </Link>
    </div>
  );
}

const routes = {
  "/solicitudes/:id": <Probe />,
  "/dashboard": <Probe />,
  "/login": <Probe />,
  "/solicitudes/nueva": <Probe />,
};

describe("app-router facade (Next-shaped API over react-router)", () => {
  it("Link renders an anchor with the href and keeps the extra props", () => {
    render(<TestRouter route="/dashboard" routes={routes} />);
    const link = screen.getByRole("link", { name: "wizard" });
    expect(link).toHaveAttribute("href", "/solicitudes/nueva");
    expect(link).toHaveClass("to-wizard");
  });

  it("Link navigates on click", () => {
    render(<TestRouter route="/dashboard" routes={routes} />);
    fireEvent.click(screen.getByRole("link", { name: "wizard" }));
    expect(screen.getByTestId("pathname")).toHaveTextContent("/solicitudes/nueva");
  });

  it("useRouter().push and replace navigate to the given path", () => {
    render(<TestRouter route="/solicitudes/abc" routes={routes} />);
    expect(screen.getByTestId("pathname")).toHaveTextContent("/solicitudes/abc");
    fireEvent.click(screen.getByText("push"));
    expect(screen.getByTestId("pathname")).toHaveTextContent("/dashboard");
    fireEvent.click(screen.getByText("replace"));
    expect(screen.getByTestId("pathname")).toHaveTextContent("/login");
  });

  it("useRouter().back goes to the previous entry", () => {
    render(<TestRouter route="/solicitudes/abc" routes={routes} />);
    fireEvent.click(screen.getByText("push"));
    expect(screen.getByTestId("pathname")).toHaveTextContent("/dashboard");
    fireEvent.click(screen.getByText("back"));
    expect(screen.getByTestId("pathname")).toHaveTextContent("/solicitudes/abc");
  });

  it("usePathname excludes the query string and useSearchParams reads it", () => {
    render(<TestRouter route="/dashboard?filter=sin-profesor" routes={routes} />);
    expect(screen.getByTestId("pathname")).toHaveTextContent("/dashboard");
    expect(screen.getByTestId("query")).toHaveTextContent("sin-profesor");
  });

  it("useParams returns the route params", () => {
    render(<TestRouter route="/solicitudes/REQ-2026-9" routes={routes} />);
    expect(screen.getByTestId("id")).toHaveTextContent("REQ-2026-9");
  });
});
