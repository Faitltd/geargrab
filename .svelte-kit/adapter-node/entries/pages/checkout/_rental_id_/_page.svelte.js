import { E as store_get, O as head, G as unsubscribe_stores, D as pop, z as push } from "../../../../chunks/index.js";
import { p as page } from "../../../../chunks/stores.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "clsx";
import "../../../../chunks/state.svelte.js";
import "../../../../chunks/base44Client.js";
import "../../../../chunks/auth.js";
import "@stripe/stripe-js";
{
  console.error("Missing Stripe publishable key. Please set VITE_STRIPE_PUBLISHABLE_KEY in your environment variables.");
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  store_get($$store_subs ??= {}, "$page", page).params.rental_id;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Checkout - GearGrab</title>`;
    $$payload2.out.push(`<meta name="description" content="Complete your rental payment securely"/>`);
  });
  $$payload.out.push(`<div class="min-h-screen bg-gray-50 py-8"><div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"><div class="text-center mb-8"><h1 class="text-3xl font-bold text-gray-900">Complete Your Rental</h1> <p class="mt-2 text-gray-600">Secure checkout powered by Stripe</p></div> `);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex justify-center items-center py-12"><svg class="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <span class="ml-2 text-gray-600">Loading checkout...</span></div>`);
  }
  $$payload.out.push(`<!--]--></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
