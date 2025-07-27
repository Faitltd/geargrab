type DynamicRoutes = {
	"/checkout/[rental_id]": { rental_id: string };
	"/listing/[id]": { id: string }
};

type Layouts = {
	"/": { rental_id?: string; id?: string };
	"/auth": undefined;
	"/auth/login": undefined;
	"/auth/signup": undefined;
	"/auth/social-demo": undefined;
	"/browse": undefined;
	"/checkout": { rental_id?: string };
	"/checkout/success": undefined;
	"/checkout/[rental_id]": { rental_id: string };
	"/list-gear": undefined;
	"/listing": { id?: string };
	"/listing/[id]": { id: string };
	"/messages": undefined;
	"/my-rentals": undefined
};

export type RouteId = "/" | "/auth" | "/auth/login" | "/auth/signup" | "/auth/social-demo" | "/browse" | "/checkout" | "/checkout/success" | "/checkout/[rental_id]" | "/list-gear" | "/listing" | "/listing/[id]" | "/messages" | "/my-rentals";

export type RouteParams<T extends RouteId> = T extends keyof DynamicRoutes ? DynamicRoutes[T] : Record<string, never>;

export type LayoutParams<T extends RouteId> = Layouts[T] | Record<string, never>;

export type Pathname = "/" | "/auth" | "/auth/login" | "/auth/signup" | "/auth/social-demo" | "/browse" | "/checkout" | "/checkout/success" | `/checkout/${string}` & {} | "/list-gear" | "/listing" | `/listing/${string}` & {} | "/messages" | "/my-rentals";

export type ResolvedPathname = `${"" | `/${string}`}${Pathname}`;

export type Asset = "/favicon.svg";