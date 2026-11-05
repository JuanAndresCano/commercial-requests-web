import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const received = vi.hoisted(() => vi.fn());
vi.mock("next/link", async () => {
  const { forwardRef } = await import("react");
  return {
    default: forwardRef<HTMLAnchorElement, { href: string; prefetch?: boolean; children?: React.ReactNode }>(
      function FakeNextLink(props, ref) {
        received(props);
        return (
          <a ref={ref} href={props.href}>
            {props.children}
          </a>
        );
      },
    ),
  };
});

import { Link } from "./link";

describe("Link", () => {
  it("does not prefetch by default", () => {
    render(<Link href="/solicitudes/1">detalle</Link>);
    expect(screen.getByRole("link", { name: "detalle" })).toHaveAttribute("href", "/solicitudes/1");
    expect(received).toHaveBeenLastCalledWith(expect.objectContaining({ prefetch: false }));
  });

  it("lets a call site opt in to prefetching", () => {
    render(
      <Link href="/dashboard" prefetch>
        inicio
      </Link>,
    );
    expect(received).toHaveBeenLastCalledWith(expect.objectContaining({ prefetch: true }));
  });
});
