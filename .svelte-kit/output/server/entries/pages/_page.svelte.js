import { J as fallback, K as maybe_selected, M as bind_props, D as pop, z as push, N as head } from "../../chunks/index.js";
import { e as escape_html } from "../../chunks/escaping.js";
import { a as attr } from "../../chunks/attributes.js";
function TaxInformationForm($$payload, $$props) {
  push();
  let showBusinessName, showEarningsAlert;
  let user = fallback($$props["user"], () => ({}), true);
  let onUpdate = fallback($$props["onUpdate"], null);
  let taxInfo = {
    tax_id_type: "",
    tax_id_number: "",
    entity_type: "individual",
    business_name: "",
    tax_address: {
      street_address: "",
      city: "",
      state: "",
      zip_code: "",
      country: "US"
    },
    backup_withholding: false
  };
  let isSaving = false;
  let annualEarnings = 0;
  function getTaxIdPlaceholder(type) {
    switch (type) {
      case "ssn":
        return "XXX-XX-XXXX";
      case "ein":
        return "XX-XXXXXXX";
      case "itin":
        return "9XX-XX-XXXX";
      default:
        return "Enter tax ID";
    }
  }
  showBusinessName = taxInfo.entity_type === "business";
  showEarningsAlert = annualEarnings >= 600;
  $$payload.out.push(`<div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg"><div class="mb-6"><h2 class="text-2xl font-bold text-gray-900 mb-2">Tax Information</h2> <p class="text-gray-600">Please provide your tax information for 1099 reporting compliance.</p></div> `);
  if (showEarningsAlert) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md"><div class="flex items-center"><svg class="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg> <div><h3 class="text-sm font-medium text-yellow-800">1099 Reporting Required</h3> <p class="text-sm text-yellow-700 mt-1">Your annual earnings ($${escape_html(annualEarnings.toLocaleString())}) exceed $600. Tax information is required for 1099 reporting.</p></div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <form class="space-y-6"><div><label for="entity_type" class="block text-sm font-medium text-gray-700 mb-2">Entity Type</label> <select id="entity_type" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">`);
  $$payload.select_value = taxInfo.entity_type;
  $$payload.out.push(`<option value="individual"${maybe_selected($$payload, "individual")}>Individual</option><option value="business"${maybe_selected($$payload, "business")}>Business</option>`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> `);
  if (showBusinessName) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div><label for="business_name" class="block text-sm font-medium text-gray-700 mb-2">Business Name</label> <input type="text" id="business_name"${attr("value", taxInfo.business_name)} placeholder="Enter business name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div><label for="tax_id_type" class="block text-sm font-medium text-gray-700 mb-2">Tax ID Type</label> <select id="tax_id_type" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">`);
  $$payload.select_value = taxInfo.tax_id_type;
  $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>Select tax ID type</option><option value="ssn"${maybe_selected($$payload, "ssn")}>Social Security Number (SSN)</option><option value="ein"${maybe_selected($$payload, "ein")}>Employer Identification Number (EIN)</option><option value="itin"${maybe_selected($$payload, "itin")}>Individual Taxpayer Identification Number (ITIN)</option>`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <div><label for="tax_id_number" class="block text-sm font-medium text-gray-700 mb-2">Tax ID Number</label> <input type="text" id="tax_id_number"${attr("value", taxInfo.tax_id_number)}${attr("placeholder", getTaxIdPlaceholder(taxInfo.tax_id_type))} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/></div> <div><h3 class="text-lg font-medium text-gray-900 mb-3">Tax Address</h3> <div class="grid grid-cols-1 gap-4"><div><label for="street_address" class="block text-sm font-medium text-gray-700 mb-1">Street Address</label> <input type="text" id="street_address"${attr("value", taxInfo.tax_address.street_address)} placeholder="Enter street address" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/></div> <div class="grid grid-cols-2 gap-4"><div><label for="city" class="block text-sm font-medium text-gray-700 mb-1">City</label> <input type="text" id="city"${attr("value", taxInfo.tax_address.city)} placeholder="Enter city" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/></div> <div><label for="state" class="block text-sm font-medium text-gray-700 mb-1">State</label> <input type="text" id="state"${attr("value", taxInfo.tax_address.state)} placeholder="Enter state" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/></div></div> <div class="grid grid-cols-2 gap-4"><div><label for="zip_code" class="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label> <input type="text" id="zip_code"${attr("value", taxInfo.tax_address.zip_code)} placeholder="Enter ZIP code" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/></div> <div><label for="country" class="block text-sm font-medium text-gray-700 mb-1">Country</label> <select id="country" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">`);
  $$payload.select_value = taxInfo.tax_address.country;
  $$payload.out.push(`<option value="US"${maybe_selected($$payload, "US")}>United States</option>`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div></div></div></div> <div class="space-y-3"><div class="flex items-center"><input type="checkbox" id="backup_withholding"${attr("checked", taxInfo.backup_withholding, true)} class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/> <label for="backup_withholding" class="ml-2 block text-sm text-gray-700">Subject to backup withholding</label></div></div> <button type="submit"${attr("disabled", isSaving, true)} class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">${escape_html("Save Tax Information")}</button></form></div>`);
  bind_props($$props, { user, onUpdate });
  pop();
}
function _page($$payload) {
  let user = {
    id: "user-123",
    tax_id_type: "ssn",
    tax_id_number: "123-45-6789",
    entity_type: "individual",
    business_name: "",
    tax_address: {
      street_address: "123 Main St",
      city: "Anytown",
      state: "CA",
      zip_code: "12345",
      country: "US"
    },
    backup_withholding: false,
    tax_exempt: false,
    tax_exempt_reason: "",
    annual_earnings: 1e3
  };
  function handleUpdate(updatedData) {
    console.log("Tax information updated:", updatedData);
    user = { ...user, ...updatedData };
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>GearGrab - Gear Rental Marketplace</title>`;
    $$payload2.out.push(`<meta name="description" content="Rent and list outdoor gear with GearGrab"/>`);
  });
  $$payload.out.push(`<div class="container mx-auto px-4 py-8"><h1 class="text-3xl font-bold text-center mb-8 text-gray-900">GearGrab Tax Compliance</h1> `);
  TaxInformationForm($$payload, { user, onUpdate: handleUpdate });
  $$payload.out.push(`<!----></div>`);
}
export {
  _page as default
};
