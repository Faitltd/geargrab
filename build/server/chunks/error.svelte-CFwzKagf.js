import { u as push, G as escape_html, w as pop, N as getContext } from './index-B8_Tn3qy.js';
import 'clsx';
import './state.svelte-CrBACqEv.js';
import '@sveltejs/kit/internal';
import './exports-Cv9LZeD1.js';
import { w as writable } from './index2-D8-jKE2y.js';

function create_updated_store() {
  const { set, subscribe } = writable(false);
  {
    return {
      subscribe,
      // eslint-disable-next-line @typescript-eslint/require-await
      check: async () => false
    };
  }
}
const stores = {
  updated: /* @__PURE__ */ create_updated_store()
};
({
  check: stores.updated.check
});
function context() {
  return getContext("__request__");
}
const page$1 = {
  get error() {
    return context().page.error;
  },
  get status() {
    return context().page.status;
  }
};
const page = page$1;
function Error$1($$payload, $$props) {
  push();
  $$payload.out.push(`<h1>${escape_html(page.status)}</h1> <p>${escape_html(page.error?.message)}</p>`);
  pop();
}

export { Error$1 as default };
//# sourceMappingURL=error.svelte-CFwzKagf.js.map
