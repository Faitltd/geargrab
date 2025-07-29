

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.CZfxejKV.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/1mFRTl23.js","_app/immutable/chunks/jEW6FX16.js"];
export const stylesheets = ["_app/immutable/assets/2.BjilVEhD.css"];
export const fonts = [];
