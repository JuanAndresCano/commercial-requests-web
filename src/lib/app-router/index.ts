// Navigation facade over Next.js (`next/link` + `next/navigation`). Screens import from
// "@/lib/app-router" and never from the framework directly.
export { Link } from "./link";
export { useRouter, usePathname, useSearchParams, useParams } from "./hooks";
export type { AppRouter } from "./hooks";
