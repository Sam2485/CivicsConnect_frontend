import { createContext, MouseEvent, useContext, useMemo, useSyncExternalStore } from "react";

type RouterContextValue = {
  pathname: string;
  search: string;
  push: (href: string) => void;
  replace: (href: string) => void;
};

const RouterContext = createContext<RouterContextValue | null>(null);
const ROUTE_EVENT = "civicconnect:navigation";

function notifyRouteChange() {
  window.dispatchEvent(new Event(ROUTE_EVENT));
}

function navigate(href: string, mode: "push" | "replace") {
  if (mode === "push") {
    window.history.pushState(null, "", href);
  } else {
    window.history.replaceState(null, "", href);
  }
  notifyRouteChange();
}

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(ROUTE_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(ROUTE_EVENT, callback);
  };
}

function snapshot() {
  return `${window.location.pathname}${window.location.search}`;
}

function serverSnapshot() {
  return "/";
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const route = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [pathname, search = ""] = route.split("?");
  const value = useMemo<RouterContextValue>(
    () => ({
      pathname,
      search: search ? `?${search}` : "",
      push: (href) => navigate(href, "push"),
      replace: (href) => navigate(href, "replace")
    }),
    [pathname, search]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useRouterContext() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("Router hooks must be used inside RouterProvider");
  }
  return context;
}

export function useRouter() {
  const { push, replace } = useRouterContext();
  return { push, replace };
}

export function usePathname() {
  return useRouterContext().pathname;
}

export function useSearchParams() {
  const { search } = useRouterContext();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function Link({
  href,
  children,
  onClick,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      props.target === "_blank" ||
      href.startsWith("http") ||
      href.startsWith("mailto:")
    ) {
      return;
    }
    event.preventDefault();
    navigate(href, "push");
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
