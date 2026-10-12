// Navigation facade shaped like Next.js (`next/link` + `next/navigation`), implemented over
// react-router-dom for now. Screens import from "@/lib/app-router" and never from the router.
export { Link } from "./link";
export { useRouter, usePathname, useSearchParams, useParams } from "./hooks";
export type { AppRouter } from "./hooks";
