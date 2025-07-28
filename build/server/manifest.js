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
		client: {start:"_app/immutable/entry/start.DylWpPrr.js",app:"_app/immutable/entry/app.BiVZXsqZ.js",imports:["_app/immutable/entry/start.DylWpPrr.js","_app/immutable/chunks/BvVrJY9g.js","_app/immutable/chunks/_R8EZNUK.js","_app/immutable/chunks/BXL6jbj8.js","_app/immutable/entry/app.BiVZXsqZ.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/BXL6jbj8.js","_app/immutable/chunks/_R8EZNUK.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CFP_NBt-.js","_app/immutable/chunks/CIIbUZqJ.js","_app/immutable/chunks/DFca-MAJ.js","_app/immutable/chunks/BtazKlE4.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-BGIplx7D.js')),
			__memo(() => import('./chunks/1-C9InrJzr.js')),
			__memo(() => import('./chunks/2-amFiRnaK.js')),
			__memo(() => import('./chunks/3-DVEcu7QY.js')),
			__memo(() => import('./chunks/4-Dc02xBLO.js')),
			__memo(() => import('./chunks/5-Ce5qT06W.js')),
			__memo(() => import('./chunks/6-DY2yn6wV.js')),
			__memo(() => import('./chunks/7-DsXC4Gll.js')),
			__memo(() => import('./chunks/8-BjRGT8XF.js')),
			__memo(() => import('./chunks/9-BKtufNOm.js')),
			__memo(() => import('./chunks/10-Cse0BY89.js')),
			__memo(() => import('./chunks/11-Bj6CNyon.js')),
			__memo(() => import('./chunks/12-kgyf-XiF.js'))
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
