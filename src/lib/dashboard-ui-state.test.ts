import { beforeEach, describe, expect, it } from "vitest";
import { resetDashboardUiState } from "./dashboard-ui-state";

describe("resetDashboardUiState", () => {
  beforeEach(() => window.localStorage.clear());

  it("forgets every remembered board selection of both roles", () => {
    window.localStorage.setItem("icesi_kam_dashboard_isolated_v1", JSON.stringify("entregada"));
    window.localStorage.setItem("icesi_kam_dashboard_filter_v1", JSON.stringify("en-costeo"));
    window.localStorage.setItem("icesi_kam_dashboard_view_v1", JSON.stringify("tabla"));
    window.localStorage.setItem("icesi_lp_dashboard_isolated_v1", JSON.stringify("nueva"));
    window.localStorage.setItem("icesi_lp_dashboard_sin_docente_v1", "true");
    window.localStorage.setItem("icesi_sidebar_expanded", "true");

    resetDashboardUiState();

    expect(window.localStorage.length).toBe(0);
  });

  it("keeps unrelated data such as the new-request draft", () => {
    window.localStorage.setItem("icesi_new_request_draft", "{}");
    window.localStorage.setItem("icesi_kam_dashboard_search_v1", JSON.stringify("acme"));

    resetDashboardUiState();

    expect(window.localStorage.getItem("icesi_new_request_draft")).toBe("{}");
    expect(window.localStorage.getItem("icesi_kam_dashboard_search_v1")).toBeNull();
  });
});
