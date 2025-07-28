import { u as push, O as head, I as store_get, K as unsubscribe_stores, w as pop, P as fallback, G as escape_html, E as attr_style, Q as ensure_array_like, J as attr, T as maybe_selected, S as bind_props, M as stringify } from './index-CLLn2lTc.js';
import '@sveltejs/kit/internal';
import './exports-Cv9LZeD1.js';
import 'clsx';
import './state.svelte-BN_1LSkf.js';
import { i as isAuthenticated } from './auth-hwAP128p.js';
import './base44Client-Dlm5DwUC.js';
import './index2-9J_H_0ie.js';

function GearListingForm($$payload, $$props) {
  push();
  let gearItem = fallback(
    $$props["gearItem"],
    null
    // For editing existing items
  );
  let isEditing = fallback($$props["isEditing"], false);
  let currentStep = 1;
  const totalSteps = 4;
  let formData = {
    title: "",
    description: "",
    category: "",
    subcategory: "",
    daily_price: "",
    weekly_price: "",
    monthly_price: "",
    deposit_amount: "",
    images: [],
    condition: "good",
    brand: "",
    model: "",
    year: "",
    size: "",
    weight: "",
    dimensions: "",
    features: [],
    included_accessories: [],
    delivery_options: [],
    pickup_location: "",
    city: "",
    state: "",
    zip_code: "",
    latitude: null,
    longitude: null,
    availability_type: "manual",
    min_rental_days: 1,
    max_rental_days: 30,
    advance_notice_days: 1,
    instant_book: false
  };
  const categories = {
    "camping": [
      "Tents",
      "Sleeping Bags",
      "Backpacks",
      "Cooking Gear",
      "Lighting"
    ],
    "climbing": ["Ropes", "Harnesses", "Helmets", "Shoes", "Protection"],
    "water-sports": [
      "Kayaks",
      "Paddleboards",
      "Wetsuits",
      "Life Jackets",
      "Paddles"
    ],
    "winter-sports": ["Skis", "Snowboards", "Boots", "Poles", "Helmets"],
    "cycling": [
      "Mountain Bikes",
      "Road Bikes",
      "Helmets",
      "Accessories",
      "Tools"
    ],
    "hiking": [
      "Backpacks",
      "Boots",
      "Trekking Poles",
      "Navigation",
      "Clothing"
    ]
  };
  if (isEditing && gearItem) {
    formData = {
      ...formData,
      ...gearItem,
      images: Array.isArray(gearItem.images) ? gearItem.images : JSON.parse(gearItem.images || "[]"),
      features: Array.isArray(gearItem.features) ? gearItem.features : JSON.parse(gearItem.features || "[]"),
      included_accessories: Array.isArray(gearItem.included_accessories) ? gearItem.included_accessories : JSON.parse(gearItem.included_accessories || "[]"),
      delivery_options: Array.isArray(gearItem.delivery_options) ? gearItem.delivery_options : JSON.parse(gearItem.delivery_options || "[]")
    };
  }
  $$payload.out.push(`<div class="max-w-4xl mx-auto bg-white rounded-lg shadow-md"><div class="px-6 py-4 border-b border-gray-200"><div class="flex items-center justify-between mb-2"><h2 class="text-xl font-semibold text-gray-900">${escape_html(isEditing ? "Edit" : "List")} Your Gear</h2> <span class="text-sm text-gray-500">Step ${escape_html(currentStep)} of 4</span></div> <div class="w-full bg-gray-200 rounded-full h-2"><div class="bg-green-600 h-2 rounded-full transition-all duration-300"${attr_style(`width: ${stringify(currentStep / totalSteps * 100)}%`)}></div></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <form class="p-6">`);
  {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(Object.keys(categories));
    $$payload.out.push(`<div class="space-y-6"><h3 class="text-lg font-medium text-gray-900">Basic Information</h3> <div><label for="title" class="block text-sm font-medium text-gray-700">Title *</label> <input type="text" id="title"${attr("value", formData.title)} required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="e.g., REI Co-op Half Dome 2 Plus Tent"/></div> <div><label for="description" class="block text-sm font-medium text-gray-700">Description *</label> <textarea id="description" required rows="4" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="Describe your gear, its condition, and any special features...">`);
    const $$body = escape_html(formData.description);
    if ($$body) {
      $$payload.out.push(`${$$body}`);
    }
    $$payload.out.push(`</textarea></div> <div class="grid grid-cols-2 gap-4"><div><label for="category" class="block text-sm font-medium text-gray-700">Category *</label> <select id="category" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">`);
    $$payload.select_value = formData.category;
    $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>Select category...</option><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let category = each_array[$$index];
      $$payload.out.push(`<option${attr("value", category)}${maybe_selected($$payload, category)}>${escape_html(category.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()))}</option>`);
    }
    $$payload.out.push(`<!--]-->`);
    $$payload.select_value = void 0;
    $$payload.out.push(`</select></div> <div><label for="subcategory" class="block text-sm font-medium text-gray-700">Subcategory</label> <select id="subcategory" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"${attr("disabled", !formData.category, true)}>`);
    $$payload.select_value = formData.subcategory;
    $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>Select subcategory...</option>`);
    if (formData.category && categories[formData.category]) {
      $$payload.out.push("<!--[-->");
      const each_array_1 = ensure_array_like(categories[formData.category]);
      $$payload.out.push(`<!--[-->`);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let subcategory = each_array_1[$$index_1];
        $$payload.out.push(`<option${attr("value", subcategory)}${maybe_selected($$payload, subcategory)}>${escape_html(subcategory)}</option>`);
      }
      $$payload.out.push(`<!--]-->`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
    $$payload.select_value = void 0;
    $$payload.out.push(`</select></div></div> <div class="grid grid-cols-3 gap-4"><div><label for="brand" class="block text-sm font-medium text-gray-700">Brand</label> <input type="text" id="brand"${attr("value", formData.brand)} class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="e.g., REI Co-op"/></div> <div><label for="model" class="block text-sm font-medium text-gray-700">Model</label> <input type="text" id="model"${attr("value", formData.model)} class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="e.g., Half Dome 2 Plus"/></div> <div><label for="year" class="block text-sm font-medium text-gray-700">Year</label> <input type="number" id="year"${attr("value", formData.year)} min="1990"${attr("max", (/* @__PURE__ */ new Date()).getFullYear())} class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="2023"/></div></div></div>`);
  }
  $$payload.out.push(`<!--]--> <div class="flex justify-between pt-6 border-t border-gray-200 mt-8"><button type="button"${attr("disabled", currentStep === 1, true)} class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button> `);
  {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<button type="button" class="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Next</button>`);
  }
  $$payload.out.push(`<!--]--></div></form></div>`);
  bind_props($$props, { gearItem, isEditing });
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>List Your Gear - GearGrab</title>`;
    $$payload2.out.push(`<meta name="description" content="List your outdoor gear for rent and start earning money"/>`);
  });
  $$payload.out.push(`<div class="min-h-screen bg-gray-50 py-8"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div class="text-center mb-8"><h1 class="text-3xl font-bold text-gray-900">List Your Gear</h1> <p class="mt-2 text-lg text-gray-600">Turn your unused outdoor gear into income by renting it to fellow adventurers</p></div> <div class="bg-white rounded-lg shadow-md p-6 mb-8"><h2 class="text-xl font-semibold text-gray-900 mb-4">Why List on GearGrab?</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-6"><div class="text-center"><div class="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-3"><svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path></svg></div> <h3 class="text-lg font-medium text-gray-900">Earn Extra Income</h3> <p class="text-sm text-gray-600">Make money from gear sitting in your garage</p></div> <div class="text-center"><div class="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-3"><svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div> <h3 class="text-lg font-medium text-gray-900">Secure &amp; Protected</h3> <p class="text-sm text-gray-600">All rentals are insured and verified</p></div> <div class="text-center"><div class="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-3"><svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div> <h3 class="text-lg font-medium text-gray-900">Build Community</h3> <p class="text-sm text-gray-600">Connect with fellow outdoor enthusiasts</p></div></div></div> `);
  if (store_get($$store_subs ??= {}, "$isAuthenticated", isAuthenticated)) {
    $$payload.out.push("<!--[-->");
    GearListingForm($$payload, {});
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="bg-white rounded-lg shadow-md p-8 text-center"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> <h3 class="mt-2 text-lg font-medium text-gray-900">Sign In Required</h3> <p class="mt-1 text-gray-600">You need to be signed in to list your gear</p> <div class="mt-4"><button class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">Sign In</button></div></div>`);
  }
  $$payload.out.push(`<!--]--></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-55_Lqwaj.js.map
