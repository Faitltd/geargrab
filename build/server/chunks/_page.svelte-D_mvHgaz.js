import { u as push, K as store_get, S as head, T as ensure_array_like, M as attr, G as escape_html, Q as stringify, O as unsubscribe_stores, w as pop, N as fallback, V as maybe_selected, P as bind_props } from './index-DqlF6s7T.js';
import { p as page } from './stores-BWB-PtPr.js';
import 'clsx';
import '@sveltejs/kit/internal';
import './exports-Cv9LZeD1.js';
import './state.svelte-DjO9YKWy.js';

function SearchFilters($$payload, $$props) {
  push();
  let filters = fallback(
    $$props["filters"],
    () => ({
      query: "",
      category: "",
      subcategory: "",
      city: "",
      state: "",
      min_price: "",
      max_price: "",
      condition: "",
      brand: "",
      delivery_options: [],
      instant_book: false,
      sort_by: "created_at",
      latitude: null,
      longitude: null,
      radius: 50
    }),
    true
  );
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
  const sortOptions = [
    { value: "created_at", label: "Newest First" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "distance", label: "Distance (requires location)" },
    { value: "rating", label: "Highest Rated" }
  ];
  const each_array = ensure_array_like(Object.keys(categories));
  const each_array_1 = ensure_array_like(sortOptions);
  $$payload.out.push(`<div class="bg-white rounded-lg shadow-md p-6"><div class="flex flex-col lg:flex-row gap-4 mb-6"><div class="flex-1"><input type="text"${attr("value", filters.query)} placeholder="Search for gear (e.g., tent, kayak, camera)..." class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"/></div> <div class="flex gap-2"><button type="button" class="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500" title="Use my location"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></button> <button type="button" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">Search</button></div></div> <div class="flex flex-wrap gap-2 mb-4"><select class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">`);
  $$payload.select_value = filters.category;
  $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>All Categories</option><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let category = each_array[$$index];
    $$payload.out.push(`<option${attr("value", category)}${maybe_selected($$payload, category)}>${escape_html(category.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()))}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select> <select class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">`);
  $$payload.select_value = filters.sort_by;
  $$payload.out.push(`<!--[-->`);
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let option = each_array_1[$$index_1];
    $$payload.out.push(`<option${attr("value", option.value)}${maybe_selected($$payload, option.value)}${attr("disabled", option.value === "distance" && !filters.latitude, true)}>${escape_html(option.label)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select> <button type="button" class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500">${escape_html("More")} Filters</button> <button type="button" class="px-3 py-2 text-gray-600 hover:text-gray-800 focus:outline-none">Clear All</button></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, { filters });
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let gearItems = [];
  let filters = {
    query: store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("q") || "",
    category: store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("category") || "",
    subcategory: store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("subcategory") || "",
    city: store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("city") || "",
    state: store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("state") || "",
    min_price: store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("min_price") || "",
    max_price: store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("max_price") || "",
    condition: store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("condition") || "",
    brand: store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("brand") || "",
    delivery_options: store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("delivery_options")?.split(",") || [],
    instant_book: store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("instant_book") === "true",
    sort_by: store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("sort_by") || "created_at",
    latitude: store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("latitude") ? parseFloat(store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("latitude")) : null,
    longitude: store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("longitude") ? parseFloat(store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("longitude")) : null,
    radius: parseInt(store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("radius")) || 50
  };
  function formatPrice(price) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }
  function getImageUrl(images) {
    if (!images) return "/placeholder-gear.jpg";
    const imageArray = Array.isArray(images) ? images : JSON.parse(images || "[]");
    return imageArray.length > 0 ? imageArray[0] : "/placeholder-gear.jpg";
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Browse Gear - GearGrab</title>`;
    $$payload2.out.push(`<meta name="description" content="Find and rent outdoor gear from fellow adventurers"/>`);
  });
  $$payload.out.push(`<div class="min-h-screen bg-gray-50"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div class="text-center mb-8"><h1 class="text-3xl font-bold text-gray-900">Browse Gear</h1> <p class="mt-2 text-lg text-gray-600">Find the perfect outdoor gear for your next adventure</p></div> <div class="mb-8">`);
  SearchFilters($$payload, { filters });
  $$payload.out.push(`<!----></div> <div class="flex justify-between items-center mb-6"><div class="text-sm text-gray-600">`);
  {
    $$payload.out.push("<!--[!-->");
    {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`No results found`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
    if (gearItems.length > 0) {
      $$payload.out.push("<!--[-->");
      const each_array_1 = ensure_array_like(gearItems);
      $$payload.out.push(`<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"><!--[-->`);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let item = each_array_1[$$index_1];
        $$payload.out.push(`<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"><a${attr("href", `/gear/${stringify(item.id)}`)} class="block"><div class="aspect-w-4 aspect-h-3"><img${attr("src", getImageUrl(item.images))}${attr("alt", item.title)} class="w-full h-48 object-cover" loading="lazy"/></div> <div class="p-4"><h3 class="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">${escape_html(item.title)}</h3> <p class="text-sm text-gray-600 mb-2">${escape_html(item.city)}, ${escape_html(item.state)} `);
        if (item.distance) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`• ${escape_html(item.distance.toFixed(1))} mi away`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--></p> <div class="flex items-center justify-between"><div class="text-lg font-bold text-green-600">${escape_html(formatPrice(item.daily_price))}/day</div> <div class="flex items-center text-sm text-gray-500"><svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg> ${escape_html(item.rating || "New")}</div></div> <div class="mt-2 flex items-center justify-between text-xs text-gray-500"><span class="capitalize">${escape_html(item.condition)}</span> <span>${escape_html(item.owner_name)}</span></div></div></a></div>`);
      }
      $$payload.out.push(`<!--]--></div> `);
      {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<div class="text-center py-12"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> <h3 class="mt-2 text-lg font-medium text-gray-900">No gear found</h3> <p class="mt-1 text-gray-500">Try adjusting your search filters or browse all categories.</p> <div class="mt-4"><button class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">Clear Filters</button></div></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-D_mvHgaz.js.map
