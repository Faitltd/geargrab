import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createMobileStore() {
	const { subscribe, set } = writable(false);

	function checkMobile() {
		if (browser) {
			const isMobile = window.innerWidth < 768;
			set(isMobile);
		}
	}

	if (browser) {
		checkMobile();
		window.addEventListener('resize', checkMobile);
	}

	return {
		subscribe
	};
}

export const isMobile = createMobileStore();
