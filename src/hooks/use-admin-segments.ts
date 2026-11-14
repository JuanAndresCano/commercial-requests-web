import { useQuery } from "@tanstack/react-query";
import { segmentsApi, type SegmentsParams } from "@/lib/api/segments";

/** A run only changes when someone imports a new one, so there is no live polling here. */
export function useAdminSegments(params: SegmentsParams = {}) {
  return useQuery({
    queryKey: ["admin-segments", params],
    queryFn: () => segmentsApi.get(params),
    staleTime: 60_000,
  });
}
