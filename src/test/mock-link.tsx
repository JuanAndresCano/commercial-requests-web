import { forwardRef, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { navigateTestRouter } from "./next-navigation-mock";

type MockLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  replace?: boolean;
  prefetch?: boolean;
  scroll?: boolean;
  children?: ReactNode;
};

/** `next/link` without the app router: an anchor that navigates through the in-memory router. */
export const MockLink = forwardRef<HTMLAnchorElement, MockLinkProps>(function MockLink(
  { href, replace, prefetch: _prefetch, scroll: _scroll, onClick, children, ...rest },
  ref,
) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigateTestRouter(href, Boolean(replace));
  };
  return (
    <a ref={ref} href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
});
