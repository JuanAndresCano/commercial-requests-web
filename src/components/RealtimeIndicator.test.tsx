import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RealtimeStatusContext } from "@/context/RealtimeContext";
import type { RealtimeStatus } from "@/lib/realtime";
import { RealtimeIndicator } from "./RealtimeIndicator";

const renderWith = (status: RealtimeStatus) =>
  render(
    <RealtimeStatusContext.Provider value={status}>
      <RealtimeIndicator />
    </RealtimeStatusContext.Provider>,
  );

describe("RealtimeIndicator", () => {
  it("says the board is live", () => {
    renderWith("live");

    expect(screen.getByRole("status")).toHaveTextContent("En vivo");
  });

  it("says it is reconnecting", () => {
    renderWith("reconnecting");

    expect(screen.getByRole("status")).toHaveTextContent("Reconectando…");
  });

  it("says it is connecting", () => {
    renderWith("connecting");

    expect(screen.getByRole("status")).toHaveTextContent("Conectando…");
  });

  it.each<RealtimeStatus>(["off", "paused"])("shows nothing when %s", (status) => {
    const { container } = renderWith(status);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing without a provider (e.g. a board rendered on its own)", () => {
    const { container } = render(<RealtimeIndicator />);

    expect(container).toBeEmptyDOMElement();
  });
});
