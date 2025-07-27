type DynamicRoutes = {
	"/listing/[id]": { id: string }
};

type Layouts = {
	"/": { id?: string };
	"/auth": undefined;
	"/auth/login": undefined;
	"/auth/signup": undefined;
	"/browse": undefined;
	"/checkout": undefined;
	"/list-gear": undefined;
	"/listing": { id?: string };
	"/listing/[id]": { id: string };
	"/my-rentals": undefined
};

export type RouteId = "/" | "/auth" | "/auth/login" | "/auth/signup" | "/browse" | "/checkout" | "/list-gear" | "/listing" | "/listing/[id]" | "/my-rentals";

export type RouteParams<T extends RouteId> = T extends keyof DynamicRoutes ? DynamicRoutes[T] : Record<string, never>;

export type LayoutParams<T extends RouteId> = Layouts[T] | Record<string, never>;

export type Pathname = "/" | "/auth" | "/auth/login" | "/auth/signup" | "/browse" | "/checkout" | "/list-gear" | "/listing" | `/listing/${string}` & {} | "/my-rentals";

export type ResolvedPathname = `${"" | `/${string}`}${Pathname}`;

export type Asset = "/favicon.svg";