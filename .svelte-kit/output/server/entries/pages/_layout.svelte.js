import { E as slot } from "../../chunks/index.js";
function _layout($$payload, $$props) {
  $$payload.out.push(`<main class="min-h-screen bg-gray-50"><!---->`);
  slot($$payload, $$props, "default", {});
  $$payload.out.push(`<!----></main>`);
}
export {
  _layout as default
};
