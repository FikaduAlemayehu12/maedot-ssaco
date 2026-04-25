// Compatibility shim: re-implements the small surface of react-router-dom
// that the ported source files use, on top of @tanstack/react-router.
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import {
  Link as TSLink,
  useNavigate as tsUseNavigate,
  useSearch,
  useRouter,
} from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  replace?: boolean;
  children?: ReactNode;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ to, replace, children, ...rest }, ref) => {
  // Use TanStack Link with type-loose 'to' since dynamic routes are simple here.
  return (
    // @ts-ignore - dynamic route strings
    <TSLink ref={ref} to={to} replace={replace} {...rest}>
      {children}
    </TSLink>
  );
});
Link.displayName = "Link";

interface NavLinkRenderProps { isActive: boolean; isPending: boolean }
type NavLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
  to: string;
  className?: string | ((p: NavLinkRenderProps) => string);
  children?: ReactNode | ((p: NavLinkRenderProps) => ReactNode);
  end?: boolean;
};

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(({ to, className, children, end, ...rest }, ref) => {
  return (
    // @ts-ignore - dynamic route strings
    <TSLink
      ref={ref}
      to={to}
      activeOptions={{ exact: end }}
      {...rest}
    >
      {(state: { isActive: boolean }) => {
        const props = { isActive: state.isActive, isPending: false };
        const cls = typeof className === "function" ? className(props) : className;
        const child = typeof children === "function" ? children(props) : children;
        return <span className={cn(cls)}>{child}</span>;
      }}
    </TSLink>
  );
});
NavLink.displayName = "NavLink";

export const useNavigate = () => {
  const nav = tsUseNavigate();
  return (to: string | number, opts?: { replace?: boolean }) => {
    if (typeof to === "number") {
      if (typeof window !== "undefined") window.history.go(to);
      return;
    }
    // @ts-ignore - dynamic route strings
    nav({ to, replace: opts?.replace });
  };
};

export const useSearchParams = (): [URLSearchParams, (next: URLSearchParams | Record<string, string>) => void] => {
  const router = useRouter();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const params = new URLSearchParams();
  Object.entries(search ?? {}).forEach(([k, v]) => {
    if (v != null) params.set(k, String(v));
  });
  const setSearchParams = (next: URLSearchParams | Record<string, string>) => {
    const obj: Record<string, string> = {};
    if (next instanceof URLSearchParams) {
      next.forEach((v, k) => { obj[k] = v; });
    } else {
      Object.assign(obj, next);
    }
    router.navigate({ to: ".", search: obj as any, replace: true });
  };
  return [params, setSearchParams];
};

export type { NavLinkProps };
