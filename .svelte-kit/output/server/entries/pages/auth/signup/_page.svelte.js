import { S as head, D as pop, z as push } from "../../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "clsx";
import "../../../../chunks/state.svelte.js";
import { S as SocialLogin } from "../../../../chunks/SocialLogin.js";
function _page($$payload, $$props) {
  push();
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Sign Up - GearGrab</title>`;
  });
  $$payload.out.push(`<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"><div class="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20"><div><h1 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h1> <p class="mt-2 text-center text-sm text-gray-600">Or <a href="/auth/login" class="font-medium text-green-600 hover:text-green-500">sign in to your existing account</a></p></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="mt-6">`);
  SocialLogin($$payload, { showTitle: false, layout: "list", buttonSize: "default" });
  $$payload.out.push(`<!----></div></div></div>`);
  pop();
}
export {
  _page as default
};
