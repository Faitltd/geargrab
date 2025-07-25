type DynamicRoutes = {
	"/listing/[id]": { id: string }
};

type Layouts = {
	"/": { id?: string };
	"/listing": { id?: string };
	"/listing/[id]": { id: string }
};

export type RouteId = "/" | "/listing" | "/listing/[id]";

export type RouteParams<T extends RouteId> = T extends keyof DynamicRoutes ? DynamicRoutes[T] : Record<string, never>;

export type LayoutParams<T extends RouteId> = Layouts[T] | Record<string, never>;

export type Pathname = "/" | "/listing" | `/listing/${string}` & {};

export type ResolvedPathname = `${"" | `/${string}`}${Pathname}`;

export type Asset = "/favicon.svg";