import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StageKpiCard } from "./StageKpiCard";

describe("StageKpiCard (UX H15)", () => {
  it.each([true, false])(
    "exposes its active state to assistive technology, not only by color (active=%s)",
    (active) => {
      const onClick = vi.fn();
      render(<StageKpiCard stage="nueva" label="Nuevas" count={3} hint="Ver" active={active} onClick={onClick} />);
      const card = screen.getByRole("button", { name: /Nuevas/i });
      expect(card).toHaveAttribute("aria-pressed", String(active));
      fireEvent.click(card);
      expect(onClick).toHaveBeenCalledTimes(1);
    },
  );
});
