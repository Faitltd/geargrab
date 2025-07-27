import { O as head, D as pop, z as push } from "../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "clsx";
import "../../../chunks/state.svelte.js";
function _page($$payload, $$props) {
  push();
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>My Rentals - GearGrab</title>`;
  });
  $$payload.out.push(`<div class="min-h-screen bg-gray-50 flex items-center justify-center"><div class="text-center"><h1 class="text-2xl font-bold text-gray-900 mb-4">Redirecting...</h1> <p class="text-gray-600">Taking you to the browse page...</p></div></div>`);
  pop();
}
export {
  _page as default
};
