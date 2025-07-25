import { E as store_get, Q as ensure_array_like, R as head, F as attr, S as maybe_selected, K as escape_html, M as stringify, G as unsubscribe_stores, D as pop, z as push } from "../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/state.svelte.js";
import { p as page } from "../../../chunks/stores.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let listings;
  const dummyListings = [
    {
      id: "1",
      title: "Premium Camping Tent (4-Person)",
      description: "Spacious 4-person tent, perfect for family camping trips.",
      category: "camping",
      dailyPrice: 35,
      images: [
        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
      ],
      location: { city: "Denver", state: "CO" },
      condition: "Like New",
      averageRating: 4.8,
      reviewCount: 12
    },
    {
      id: "2",
      title: "Mountain Bike - Trek X-Caliber 8",
      description: "High-quality mountain bike for trail riding.",
      category: "biking",
      dailyPrice: 45,
      images: [
        "https://images.unsplash.com/photo-1511994298241-608e28f14fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
      ],
      location: { city: "Boulder", state: "CO" },
      condition: "Good",
      averageRating: 4.6,
      reviewCount: 8
    },
    {
      id: "3",
      title: "Kayak - Wilderness Systems Pungo 120",
      description: "Stable and comfortable kayak for lake adventures.",
      category: "water-sports",
      dailyPrice: 50,
      images: [
        "https://images.unsplash.com/photo-1604537466158-719b1972feb8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80"
      ],
      location: { city: "Fort Collins", state: "CO" },
      condition: "Good",
      averageRating: 4.9,
      reviewCount: 15
    },
    {
      id: "4",
      title: "Backpacking Set - Complete Kit",
      description: "Complete backpacking kit including tent, sleeping bag, pad, and cooking equipment.",
      category: "hiking",
      dailyPrice: 65,
      images: [
        "https://images.unsplash.com/photo-1501554728187-ce583db33af7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
      ],
      location: { city: "Denver", state: "CO" },
      condition: "Good",
      averageRating: 4.7,
      reviewCount: 9
    },
    {
      id: "5",
      title: "Snowboard Package - Burton Custom",
      description: "Complete snowboard package including board, bindings, and boots.",
      category: "skiing",
      dailyPrice: 55,
      images: [
        "https://images.unsplash.com/photo-1522056615691-da7b8106c665?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
      ],
      location: { city: "Breckenridge", state: "CO" },
      condition: "Like New",
      averageRating: 4.9,
      reviewCount: 7
    },
    {
      id: "6",
      title: "Climbing Gear Set - Harness, Shoes, Rope",
      description: "Complete climbing gear set for indoor or outdoor climbing.",
      category: "climbing",
      dailyPrice: 40,
      images: [
        "https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1103&q=80"
      ],
      location: { city: "Boulder", state: "CO" },
      condition: "Good",
      averageRating: 4.8,
      reviewCount: 11
    }
  ];
  const categories = [
    { id: "", name: "All Categories" },
    { id: "camping", name: "Camping" },
    { id: "hiking", name: "Hiking" },
    { id: "skiing", name: "Skiing" },
    { id: "water-sports", name: "Water Sports" },
    { id: "climbing", name: "Climbing" },
    { id: "biking", name: "Biking" }
  ];
  let query = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("q") || "";
  let category = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("category") || "";
  let location = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("location") || "";
  let minPrice = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("minPrice") || "";
  let maxPrice = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("maxPrice") || "";
  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }
  listings = dummyListings.filter((listing) => {
    if (category && listing.category !== category) {
      return false;
    }
    if (location) {
      const locationLower = location.toLowerCase();
      const cityState = `${listing.location.city}, ${listing.location.state}`.toLowerCase();
      if (!cityState.includes(locationLower)) {
        return false;
      }
    }
    if (minPrice && listing.dailyPrice < parseInt(minPrice)) {
      return false;
    }
    if (maxPrice && listing.dailyPrice > parseInt(maxPrice)) {
      return false;
    }
    if (query) {
      const queryLower = query.toLowerCase();
      return listing.title.toLowerCase().includes(queryLower) || listing.description.toLowerCase().includes(queryLower) || listing.category.toLowerCase().includes(queryLower);
    }
    return true;
  });
  const each_array = ensure_array_like(
    // Handle search form submission
    // Build query parameters
    // Navigate with updated parameters
    // No longer needed since we're using <a> tags
    // Format currency
    categories
  );
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Browse Gear - GearGrab</title>`;
  });
  $$payload.out.push(`<div class="min-h-screen"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 mb-6"><div class="grid grid-cols-1 md:grid-cols-4 gap-4"><div><label for="search-query" class="form-label">What gear do you need?</label> <input type="text" id="search-query" class="form-input" placeholder="Tent, kayak, bike..."${attr("value", query)}/></div> <div><label for="category" class="form-label">Category</label> <select id="category" class="form-input">`);
  $$payload.select_value = category;
  $$payload.out.push(`<!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let cat = each_array[$$index];
    $$payload.out.push(`<option${attr("value", cat.id)}${maybe_selected($$payload, cat.id)}>${escape_html(cat.name)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <div><label for="location" class="form-label">Location</label> <input type="text" id="location" class="form-input" placeholder="City, state, or zip"${attr("value", location)}/></div> <div class="flex items-end"><button class="btn btn-primary w-full">Search</button></div></div> <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4"><div class="flex items-center space-x-2"><div class="w-1/2"><label for="min-price" class="form-label">Min Price</label> <input type="number" id="min-price" class="form-input" placeholder="Min"${attr("value", minPrice)}/></div> <div class="w-1/2"><label for="max-price" class="form-label">Max Price</label> <input type="number" id="max-price" class="form-input" placeholder="Max"${attr("value", maxPrice)}/></div></div> <div></div> <div class="flex items-end"><button class="btn btn-secondary w-full">Clear Filters</button></div></div></div> <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6"><div><h1 class="text-2xl font-bold text-white drop-shadow-lg">`);
  if (listings.length === 0) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`No gear found`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`${escape_html(listings.length)} ${escape_html(listings.length === 1 ? "item" : "items")} found`);
  }
  $$payload.out.push(`<!--]--> `);
  if (query || category || location) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="font-normal text-white/80 drop-shadow-md">`);
    if (query) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`for "${escape_html(query)}"`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> `);
    if (category) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`in ${escape_html(categories.find((c) => c.id === category)?.name)}`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> `);
    if (location) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`near ${escape_html(location)}`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></span>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></h1></div></div> `);
  if (listings.length === 0) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 text-center"><svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <h3 class="mt-2 text-lg font-medium text-gray-900">No results found</h3> <p class="mt-1 text-gray-500">Try adjusting your search filters or browse all available gear.</p> <div class="mt-6"><button class="btn btn-primary">View All Gear</button></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    const each_array_1 = ensure_array_like(listings);
    $$payload.out.push(`<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"><!--[-->`);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let listing = each_array_1[$$index_1];
      $$payload.out.push(`<a${attr("href", `/listing/${stringify(listing.id)}`)} class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl hover:bg-white/98 transition-all block"><div class="aspect-w-16 aspect-h-9 bg-gray-200"><img${attr("src", listing.images[0])}${attr("alt", listing.title)} class="object-cover w-full h-48"/></div> <div class="p-4"><h3 class="font-medium text-lg mb-1 text-gray-900">${escape_html(listing.title)}</h3> <p class="text-gray-600 text-sm mb-2">${escape_html(listing.location.city)}, ${escape_html(listing.location.state)}</p> <div class="flex justify-between items-center"><p class="font-bold text-green-600">${escape_html(formatCurrency(listing.dailyPrice))}/day</p> <div class="flex items-center text-gray-700"><span class="text-yellow-400 mr-1">★</span> <span>${escape_html(listing.averageRating || "New")}</span> `);
      if (listing.reviewCount) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<span class="text-gray-500 ml-1">(${escape_html(listing.reviewCount)})</span>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div></div> <div class="mt-2 flex flex-wrap gap-1">`);
      if (listing.category) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<span class="inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-medium bg-green-100/80 text-green-800 backdrop-blur-sm">${escape_html(listing.category)}</span>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (listing.condition) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<span class="inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-medium bg-gray-100/80 text-gray-800 backdrop-blur-sm">${escape_html(listing.condition)}</span>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div></div></a>`);
    }
    $$payload.out.push(`<!--]--></div>`);
  }
  $$payload.out.push(`<!--]--></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
