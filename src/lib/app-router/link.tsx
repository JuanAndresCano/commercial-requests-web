import NextLink from "next/link";

/**
 * `next/link` as the app's Link. Screens import it from `@/lib/app-router` so that the routing
 * library can change again without touching them.
 */
export const Link = NextLink;
