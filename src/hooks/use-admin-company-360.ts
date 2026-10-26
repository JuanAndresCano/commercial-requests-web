import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { requestsApi } from "@/lib/api/requests";
import { LIVE_REFRESH_MS } from "@/lib/live-refresh";

export function useAdminCompanies() {
  return useQuery({
    queryKey: ["admin-companies"],
    queryFn: () => requestsApi.getAdminCompanies(),
    staleTime: 30_000,
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function useAdminCompany360(companyId: string | null) {
  return useQuery({
    queryKey: ["admin-company-360", companyId],
    queryFn: () => (companyId ? requestsApi.getAdminCompany360(companyId) : null),
    enabled: Boolean(companyId),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    refetchInterval: LIVE_REFRESH_MS,
  });
}
