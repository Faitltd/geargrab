import { E as fallback, F as escape_html, G as store_get, I as attr, J as unsubscribe_stores, K as bind_props, D as pop, z as push, M as copy_payload, N as assign_payload, O as attr_style, P as slot, Q as stringify } from "../../chunks/index.js";
import { e as error, l as loading, i as isAuthenticated } from "../../chunks/auth.js";
function LoginPopup($$payload, $$props) {
  push();
  var $$store_subs;
  let isOpen = fallback($$props["isOpen"], false);
  let title = fallback($$props["title"], "Sign in to continue");
  let message = fallback($$props["message"], "Please sign in to access this feature");
  if (isOpen) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm svelte-16rfhi1" role="dialog" aria-modal="true" aria-labelledby="login-title"><div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 p-8 max-w-md w-full mx-4 transform transition-all"><button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button> <div class="text-center mb-6"><div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div> <h2 id="login-title" class="text-2xl font-bold text-gray-900 mb-2">${escape_html(title)}</h2> <p class="text-gray-600">${escape_html(message)}</p></div> `);
    if (store_get($$store_subs ??= {}, "$error", error)) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p class="text-red-600 text-sm">${escape_html(store_get($$store_subs ??= {}, "$error", error))}</p></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <div class="space-y-3"><button class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"${attr("disabled", store_get($$store_subs ??= {}, "$loading", loading), true)}><svg class="w-5 h-5 mr-3" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path></svg> ${escape_html(store_get($$store_subs ??= {}, "$loading", loading) ? "Signing in..." : "Continue with Google")}</button> <button class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"${attr("disabled", store_get($$store_subs ??= {}, "$loading", loading), true)}><svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path></svg> ${escape_html(store_get($$store_subs ??= {}, "$loading", loading) ? "Signing in..." : "Continue with GitHub")}</button></div> <div class="mt-6 text-center"><p class="text-sm text-gray-500">By signing in, you agree to our <a href="/terms" class="text-green-600 hover:text-green-700 underline">Terms of Service</a> and <a href="/privacy" class="text-green-600 hover:text-green-700 underline">Privacy Policy</a></p></div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { isOpen, title, message });
  pop();
}
function Navbar($$payload, $$props) {
  push();
  var $$store_subs;
  let isMenuOpen = false;
  let showLoginPopup = false;
  let loginPopupTitle = "Sign in to continue";
  let loginPopupMessage = "Please sign in to access this feature";
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out.push(`<nav class="backdrop-blur-sm bg-white/10 border-b border-white/20" role="navigation" aria-label="Main"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div class="flex justify-between h-16"><div class="flex"><div class="flex-shrink-0 flex items-center"><a href="/" class="bg-white/90 backdrop-blur-sm text-green-600 font-bold text-lg px-4 py-2 rounded-xl shadow-lg border border-white/30 h-10 flex items-center">GearGrab</a></div> <div class="hidden sm:ml-6 sm:flex sm:space-x-4 items-center"><a href="/browse" class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10">Browse</a> <button class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10">List Gear</button> <button class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10">My Rentals</button></div></div> <div class="hidden sm:ml-6 sm:flex sm:items-center space-x-3">`);
    if (store_get($$store_subs ??= {}, "$isAuthenticated", isAuthenticated)) {
      $$payload2.out.push("<!--[-->");
      $$payload2.out.push(`<a href="/dashboard" class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10 flex items-center">Dashboard</a> <button class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10 flex items-center">Sign Out</button>`);
    } else {
      $$payload2.out.push("<!--[!-->");
      $$payload2.out.push(`<button class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10 flex items-center">Log In</button> <a href="/auth/signup" class="bg-green-600/90 backdrop-blur-sm text-white hover:bg-green-700/90 px-3 py-2 rounded-xl text-sm font-medium shadow-lg border border-green-500/30 transition-all h-10 flex items-center">Sign Up</a>`);
    }
    $$payload2.out.push(`<!--]--></div> <div class="-mr-2 flex items-center sm:hidden"><button type="button" class="bg-white/80 backdrop-blur-sm inline-flex items-center justify-center p-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 shadow-md border border-white/30 transition-all"${attr("aria-expanded", isMenuOpen)} aria-controls="mobile-menu"><span class="sr-only">Open main menu</span> <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg></button></div></div></div> `);
    {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--></nav> `);
    LoginPopup($$payload2, {
      title: loginPopupTitle,
      message: loginPopupMessage,
      get isOpen() {
        return showLoginPopup;
      },
      set isOpen($$value) {
        showLoginPopup = $$value;
        $$settled = false;
      }
    });
    $$payload2.out.push(`<!---->`);
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function _layout($$payload, $$props) {
  push();
  let scrollY = 0;
  $$payload.out.push(`<div class="fixed inset-0 z-0 overflow-hidden"><div class="absolute bg-cover bg-center bg-no-repeat"${attr_style(` background-image: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'); transform: translateY(${stringify(scrollY * -0.2)}px); top: -20%; left: 0; right: 0; height: 140%; `)}></div> <div class="absolute inset-0 bg-black opacity-40"></div></div> <div class="relative z-10"><a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a> `);
  Navbar($$payload);
  $$payload.out.push(`<!----> <main id="main-content" class="min-h-screen"><!---->`);
  slot($$payload, $$props, "default", {});
  $$payload.out.push(`<!----></main> <footer class="bg-gray-800/90 backdrop-blur-sm text-white py-8 relative"><div class="container mx-auto px-4"><p class="text-center">© ${escape_html((/* @__PURE__ */ new Date()).getFullYear())} GearGrab. All rights reserved.</p></div></footer></div>`);
  pop();
}
export {
  _layout as default
};
