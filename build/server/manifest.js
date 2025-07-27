const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.svg"]),
	mimeTypes: {".svg":"image/svg+xml"},
	_: {
		client: {start:"_app/immutable/entry/start.Bk2W5uO0.js",app:"_app/immutable/entry/app.CpO4y1Gk.js",imports:["_app/immutable/entry/start.Bk2W5uO0.js","_app/immutable/chunks/C94zkJfw.js","_app/immutable/chunks/DCC44snd.js","_app/immutable/chunks/CZIwaskW.js","_app/immutable/entry/app.CpO4y1Gk.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/CZIwaskW.js","_app/immutable/chunks/DCC44snd.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BQ6CF9gK.js","_app/immutable/chunks/DFZWBCUT.js","_app/immutable/chunks/Bp-8lCth.js","_app/immutable/chunks/5vQelUuP.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-B1o0nbOS.js')),
			__memo(() => import('./chunks/1-Dp9peTYE.js')),
			__memo(() => import('./chunks/2-BSUOMTet.js')),
			__memo(() => import('./chunks/3-DoGkxZup.js')),
			__memo(() => import('./chunks/4-B0fLbhto.js')),
			__memo(() => import('./chunks/5-Cdgd4b5O.js')),
			__memo(() => import('./chunks/6-CS35ueWf.js')),
			__memo(() => import('./chunks/7-R55H8Vn-.js')),
			__memo(() => import('./chunks/8-BI0I_Hvu.js')),
			__memo(() => import('./chunks/9-BTsuU1vT.js')),
			__memo(() => import('./chunks/10-Dxa5C1aI.js')),
			__memo(() => import('./chunks/11-CXYfhzS6.js')),
			__memo(() => import('./chunks/12-BoHkiZUR.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/auth/login",
				pattern: /^\/auth\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/auth/signup",
				pattern: /^\/auth\/signup\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/browse",
				pattern: /^\/browse\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/checkout",
				pattern: /^\/checkout\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/checkout/success",
				pattern: /^\/checkout\/success\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/checkout/[rental_id]",
				pattern: /^\/checkout\/([^/]+?)\/?$/,
				params: [{"name":"rental_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/list-gear",
				pattern: /^\/list-gear\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/listing/[id]",
				pattern: /^\/listing\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/messages",
				pattern: /^\/messages\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/my-rentals",
				pattern: /^\/my-rentals\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 12 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
