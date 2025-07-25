import { Q as ensure_array_like, R as head, T as attr_class, K as escape_html, F as attr, S as maybe_selected, D as pop, z as push, M as stringify } from "../../../chunks/index.js";
function _page($$payload, $$props) {
  push();
  let subcategories;
  let currentStep = 1;
  const totalSteps = 5;
  let formData = {
    title: "",
    category: "",
    subcategory: "",
    description: ""
  };
  let errors = {};
  const categories = [
    {
      id: "camping",
      name: "Camping",
      subcategories: ["Tents", "Sleeping Bags", "Cooking", "Backpacks"]
    },
    {
      id: "hiking",
      name: "Hiking",
      subcategories: ["Backpacks", "Footwear", "Clothing", "Navigation"]
    },
    {
      id: "skiing",
      name: "Skiing",
      subcategories: ["Skis", "Boots", "Poles", "Clothing"]
    },
    {
      id: "water-sports",
      name: "Water Sports",
      subcategories: ["Kayaks", "Paddleboards", "Surfboards", "Life Vests"]
    },
    {
      id: "climbing",
      name: "Climbing",
      subcategories: ["Ropes", "Harnesses", "Shoes", "Helmets"]
    },
    {
      id: "biking",
      name: "Biking",
      subcategories: ["Mountain Bikes", "Road Bikes", "Helmets", "Accessories"]
    }
  ];
  subcategories = [];
  const each_array = ensure_array_like(
    // Handle image change from ImageUploader component
    // Add feature field
    // Remove feature field
    // Add specification field
    // Remove specification field
    // Handle date selection for availability
    // Navigate to previous step
    // Submit form
    // In a real app, we would send this to the server
    // Reset form
    // Basic info
    // Details
    // Features and specifications
    // Images
    // Pricing
    // Location
    // Delivery options
    // Availability
    // Insurance
    // Reset errors
    // Reset step
    // Validate form data and update errors
    // Validate basic info
    // Validate details, features, and specifications
    // Validate features (at least one non-empty feature)
    // Validate specifications (key and value must both be filled if either is filled)
    // Validate images
    // Validate pricing and location
    // Validate delivery options
    // Preview step - no validation needed
    // Check if current step is valid (for disabling/enabling buttons)
    // Make the Next button always enabled to allow users to navigate through the form
    // They'll see validation errors when they try to proceed
    // Navigate to next step with validation
    // Still validate to show errors, but proceed anyway
    Array(totalSteps)
  );
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>List Your Gear - GearGrab</title>`;
  });
  $$payload.out.push(`<div class="min-h-screen"><div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><h1 class="text-3xl font-bold text-white drop-shadow-lg mb-6">List Your Gear</h1> <div class="mb-8"><div class="flex justify-between mb-2"><!--[-->`);
  for (let i = 0, $$length = each_array.length; i < $$length; i++) {
    each_array[i];
    $$payload.out.push(`<div class="flex flex-col items-center"><div${attr_class(`w-8 h-8 rounded-xl flex items-center justify-center ${stringify(i + 1 <= currentStep ? "bg-green-500/90 backdrop-blur-sm text-white shadow-lg" : "bg-white/80 backdrop-blur-sm text-gray-600 shadow-md border border-white/30")}`)}>${escape_html(i + 1)}</div> <div class="text-xs mt-1 text-white drop-shadow-md">${escape_html(i === 0 ? "Basic Info" : i === 1 ? "Details" : i === 2 ? "Images" : i === 3 ? "Pricing & Location" : "Preview")}</div></div> `);
    if (i < totalSteps - 1) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="flex-1 flex items-center"><div${attr_class(`h-1 w-full rounded-xl ${stringify(i + 1 < currentStep ? "bg-green-500/80 backdrop-blur-sm shadow-sm" : "bg-white/60 backdrop-blur-sm shadow-sm")}`)}></div></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div></div> <div class="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">`);
  {
    $$payload.out.push("<!--[-->");
    const each_array_1 = ensure_array_like(categories);
    $$payload.out.push(`<div><h2 class="text-xl font-semibold mb-4">Basic Information</h2> <div class="space-y-4"><div><label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title *</label> <input type="text" id="title" class="form-input block w-full rounded-md" placeholder="e.g. Premium Camping Tent (4-Person)"${attr("value", formData.title)}/> `);
    if (errors.title) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<p class="text-red-500 text-sm mt-1">${escape_html(errors.title)}</p>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> <div><label for="category" class="block text-sm font-medium text-gray-700 mb-1">Category *</label> <select id="category" class="form-select block w-full rounded-md">`);
    $$payload.select_value = formData.category;
    $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>Select a category</option><!--[-->`);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let category = each_array_1[$$index_1];
      $$payload.out.push(`<option${attr("value", category.id)}${maybe_selected($$payload, category.id)}>${escape_html(category.name)}</option>`);
    }
    $$payload.out.push(`<!--]-->`);
    $$payload.select_value = void 0;
    $$payload.out.push(`</select> `);
    if (errors.category) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<p class="text-red-500 text-sm mt-1">${escape_html(errors.category)}</p>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> `);
    if (subcategories.length > 0) {
      $$payload.out.push("<!--[-->");
      const each_array_2 = ensure_array_like(subcategories);
      $$payload.out.push(`<div><label for="subcategory" class="block text-sm font-medium text-gray-700 mb-1">Subcategory</label> <select id="subcategory" class="form-select block w-full rounded-md">`);
      $$payload.select_value = formData.subcategory;
      $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>Select a subcategory</option><!--[-->`);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let subcategory = each_array_2[$$index_2];
        $$payload.out.push(`<option${attr("value", subcategory)}${maybe_selected($$payload, subcategory)}>${escape_html(subcategory)}</option>`);
      }
      $$payload.out.push(`<!--]-->`);
      $$payload.select_value = void 0;
      $$payload.out.push(`</select></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <div><label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description *</label> <textarea id="description" class="form-textarea block w-full rounded-md" rows="4" placeholder="Describe your gear in detail. Include features, benefits, and condition.">`);
    const $$body = escape_html(formData.description);
    if ($$body) {
      $$payload.out.push(`${$$body}`);
    }
    $$payload.out.push(`</textarea> `);
    if (errors.description) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<p class="text-red-500 text-sm mt-1">${escape_html(errors.description)}</p>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div></div></div>`);
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="mt-8 flex justify-between">`);
  {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div></div>`);
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button type="button" class="btn btn-primary"${attr("disabled", false, true)}>Next</button>`);
  }
  $$payload.out.push(`<!--]--></div></div></div></div>`);
  pop();
}
export {
  _page as default
};
