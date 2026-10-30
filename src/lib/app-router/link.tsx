import { forwardRef, type ComponentPropsWithoutRef } from "react";
import NextLink from "next/link";

/**
 * `next/link` as the app's Link. Screens import it from `@/lib/app-router` so that the routing library can
 * change again without touching them. Prefetch is off by default: react-router never preloaded anything and
 * `next/link` would otherwise prefetch every visible link (dozens on the board) against the Node server.
 */
export const Link = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<typeof NextLink>>(function Link(
  { prefetch = false, ...props },
  ref,
) {
  return <NextLink ref={ref} prefetch={prefetch} {...props} />;
});
