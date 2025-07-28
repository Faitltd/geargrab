import { u as push, I as store_get, O as head, G as escape_html, J as attr, K as unsubscribe_stores, w as pop } from './index-CLLn2lTc.js';
import { p as page } from './stores-Bc4d8Goj.js';
import 'clsx';
import '@sveltejs/kit/internal';
import './exports-Cv9LZeD1.js';
import './state.svelte-BN_1LSkf.js';

function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let listing = {
    title: "Premium Outdoor Gear",
    description: "High-quality outdoor equipment for your next adventure.",
    price: "$50/day",
    category: "Camping",
    owner: "John Doe",
    location: "San Francisco, CA",
    rating: 4.8,
    reviews: 24
  };
  store_get($$store_subs ??= {}, "$page", page).params.id;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>GearGrab - ${escape_html(listing.title)}</title>`;
    $$payload2.out.push(`<meta name="description"${attr("content", listing.description)}/>`);
  });
  $$payload.out.push(`<div class="container mx-auto px-4 py-8"><div class="max-w-4xl mx-auto"><nav class="mb-6"><ol class="flex items-center space-x-2 text-sm text-gray-500"><li><a href="/" class="hover:text-blue-600">Home</a></li> <li>/</li> <li><a href="/browse" class="hover:text-blue-600">Browse</a></li> <li>/</li> <li class="text-gray-900">${escape_html(listing.title)}</li></ol></nav> <div class="bg-white rounded-lg shadow-lg overflow-hidden"><div class="md:flex"><div class="md:w-1/2"><div class="aspect-w-16 aspect-h-12 bg-gray-200"><div class="flex items-center justify-center h-64 bg-gray-300 rounded-lg"><span class="text-gray-500">Image Placeholder</span></div></div></div> <div class="md:w-1/2 p-6"><div class="flex items-center justify-between mb-4"><span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">${escape_html(listing.category)}</span> <span class="text-2xl font-bold text-green-600">${escape_html(listing.price)}</span></div> <h1 class="text-3xl font-bold text-gray-900 mb-4">${escape_html(listing.title)}</h1> <div class="flex items-center mb-4"><div class="flex items-center"><span class="text-yellow-400">★</span> <span class="ml-1 text-sm text-gray-600">${escape_html(listing.rating)} (${escape_html(listing.reviews)} reviews)</span></div></div> <p class="text-gray-600 mb-6">${escape_html(listing.description)}</p> <div class="space-y-3 mb-6"><div class="flex items-center"><span class="text-gray-500 w-20">Owner:</span> <span class="text-gray-900">${escape_html(listing.owner)}</span></div> <div class="flex items-center"><span class="text-gray-500 w-20">Location:</span> <span class="text-gray-900">${escape_html(listing.location)}</span></div> <div class="flex items-center"><span class="text-gray-500 w-20">Status:</span> <span class="text-green-600 font-medium">${escape_html("Available")}</span></div></div> <div class="space-y-3"><button class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"${attr("disabled", false, true)}>${escape_html("Rent Now")}</button> <button class="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors">Contact Owner</button></div></div></div></div> <div class="mt-8 grid md:grid-cols-2 gap-8"><div class="bg-white rounded-lg shadow p-6"><h3 class="text-lg font-semibold mb-4">Description</h3> <p class="text-gray-600">This is a detailed description of the gear item. It includes information about 
          the condition, specifications, and any special instructions for use.</p></div> <div class="bg-white rounded-lg shadow p-6"><h3 class="text-lg font-semibold mb-4">Rental Terms</h3> <ul class="space-y-2 text-gray-600"><li>• Minimum rental: 1 day</li> <li>• Security deposit required</li> <li>• Free cancellation 24h before</li> <li>• Pickup/delivery available</li></ul></div></div></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CoeK3UFX.js.map
