import { u as push, E as attr_style, F as slot, G as escape_html, w as pop, I as store_get, J as attr, K as unsubscribe_stores, M as stringify } from './index-CLLn2lTc.js';
import 'clsx';

function Navbar($$payload) {
  var $$store_subs;
  const authStore = {
    subscribe: (callback) => {
      callback({ user: null });
      return () => {
      };
    }
  };
  let isMenuOpen = false;
  $$payload.out.push(`<nav class="backdrop-blur-sm bg-white/10 border-b border-white/20" role="navigation" aria-label="Main"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div class="flex justify-between h-16"><div class="flex"><div class="flex-shrink-0 flex items-center"><a href="/" class="bg-white/90 backdrop-blur-sm text-green-600 font-bold text-lg px-4 py-2 rounded-xl shadow-lg border border-white/30 h-10 flex items-center">GearGrab</a></div> <div class="hidden sm:ml-6 sm:flex sm:space-x-4 items-center"><a href="/browse" class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10">Browse</a> <a href="/list-gear" class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10">List Gear</a> <a href="/my-rentals" class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10">My Rentals</a></div></div> <div class="hidden sm:ml-6 sm:flex sm:items-center space-x-3">`);
  if (store_get($$store_subs ??= {}, "$authStore", authStore).user) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<a href="/dashboard" class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10 flex items-center">Dashboard</a> <button class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10 flex items-center">Sign Out</button>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<a href="/auth/login" class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10 flex items-center">Log In</a> <a href="/auth/signup" class="bg-green-600/90 backdrop-blur-sm text-white hover:bg-green-700/90 px-3 py-2 rounded-xl text-sm font-medium shadow-lg border border-green-500/30 transition-all h-10 flex items-center">Sign Up</a>`);
  }
  $$payload.out.push(`<!--]--></div> <div class="-mr-2 flex items-center sm:hidden"><button type="button" class="bg-white/80 backdrop-blur-sm inline-flex items-center justify-center p-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 shadow-md border border-white/30 transition-all"${attr("aria-expanded", isMenuOpen)} aria-controls="mobile-menu"><span class="sr-only">Open main menu</span> <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg></button></div></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></nav>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
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

export { _layout as default };
//# sourceMappingURL=_layout.svelte-CmahHae6.js.map
