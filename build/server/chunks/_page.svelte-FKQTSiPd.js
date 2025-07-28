import { u as push, I as store_get, O as head, K as unsubscribe_stores, w as pop } from './index-CLLn2lTc.js';
import { p as page } from './stores-Bc4d8Goj.js';
import '@sveltejs/kit/internal';
import './exports-Cv9LZeD1.js';
import 'clsx';
import './state.svelte-BN_1LSkf.js';
import './base44Client-Dlm5DwUC.js';

function _page($$payload, $$props) {
  push();
  var $$store_subs;
  store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("rental_id");
  store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("payment_intent");
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Payment Successful - GearGrab</title>`;
    $$payload2.out.push(`<meta name="description" content="Your rental payment was successful"/>`);
  });
  $$payload.out.push(`<div class="min-h-screen bg-gray-50 py-8"><div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex justify-center items-center py-12"><svg class="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <span class="ml-2 text-gray-600">Confirming payment...</span></div>`);
  }
  $$payload.out.push(`<!--]--></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-FKQTSiPd.js.map
