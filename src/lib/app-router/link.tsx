import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Link as RouterLink } from "react-router-dom";

type LinkProps = Omit<ComponentPropsWithoutRef<typeof RouterLink>, "to"> & {
  /** Destination path. Always a plain string (every call site in the app uses one). */
  href: string;
};

/**
 * Shaped like `next/link` (href instead of to) but implemented over react-router-dom.
 * It exists so the screens stop importing the router directly; when the app moves to
 * Next.js only the implementation of `@/lib/app-router` changes, not the screens.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ href, ...rest }, ref) {
  return <RouterLink ref={ref} to={href} {...rest} />;
});
