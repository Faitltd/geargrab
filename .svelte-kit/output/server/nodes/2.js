

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.6QTgAAeS.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/DQH0u__Z.js","_app/immutable/chunks/CZIwaskW.js"];
export const stylesheets = ["_app/immutable/assets/2.BVlUC0oj.css"];
export const fonts = [];
