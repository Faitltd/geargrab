// See https://kit.svelte.dev/docs/types#app
declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
			details?: any;
		}

		interface Locals {
			user: {
				uid: string;
				email?: string;
				emailVerified?: boolean;
				displayName?: string;
				photoURL?: string;
			} | null;
			userId: string | null;
		}

		interface PageData {
			user?: App.Locals['user'];
		}

		// interface Platform {}
	}
}

export {};
