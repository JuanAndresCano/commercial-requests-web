import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OfficialNumberBadge } from "./OfficialNumberBadge";

describe("OfficialNumberBadge (C-13)", () => {
  it("shows the official number", () => {
    render(<OfficialNumberBadge officialNumber="CP 2026-0169" />);
    expect(screen.getByText("CP 2026-0169")).toBeInTheDocument();
    expect(screen.getByTitle("Número oficial")).toBeInTheDocument();
  });

  it("shows nothing when there is no official number", () => {
    const { container } = render(<OfficialNumberBadge officialNumber={undefined} />);
    expect(container).toBeEmptyDOMElement();
    const { container: empty } = render(<OfficialNumberBadge officialNumber="  " />);
    expect(empty).toBeEmptyDOMElement();
  });
});
