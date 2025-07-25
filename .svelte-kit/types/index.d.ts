type DynamicRoutes = {
	"/listing/[id]": { id: string }
};

type Layouts = {
	"/": { id?: string };
	"/auth": undefined;
	"/auth/login": undefined;
	"/auth/signup": undefined;
	"/browse": undefined;
	"/list-gear": undefined;
	"/listing": { id?: string };
	"/listing/[id]": { id: string }
};

export type RouteId = "/" | "/auth" | "/auth/login" | "/auth/signup" | "/browse" | "/list-gear" | "/listing" | "/listing/[id]";

export type RouteParams<T extends RouteId> = T extends keyof DynamicRoutes ? DynamicRoutes[T] : Record<string, never>;

export type LayoutParams<T extends RouteId> = Layouts[T] | Record<string, never>;

export type Pathname = "/" | "/auth" | "/auth/login" | "/auth/signup" | "/browse" | "/list-gear" | "/listing" | `/listing/${string}` & {};

export type ResolvedPathname = `${"" | `/${string}`}${Pathname}`;

export type Asset = "/favicon.svg";