// See https://kit.svelte.dev/docs/types#app
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
      user: any;
      userId: string | null;
    }
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
