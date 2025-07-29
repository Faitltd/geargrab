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
		client: {start:"_app/immutable/entry/start.BlotS4f0.js",app:"_app/immutable/entry/app.DO5LWcpg.js",imports:["_app/immutable/entry/start.BlotS4f0.js","_app/immutable/chunks/5CZu6JCa.js","_app/immutable/chunks/_R8EZNUK.js","_app/immutable/chunks/BXL6jbj8.js","_app/immutable/entry/app.DO5LWcpg.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/BXL6jbj8.js","_app/immutable/chunks/_R8EZNUK.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CFP_NBt-.js","_app/immutable/chunks/CIIbUZqJ.js","_app/immutable/chunks/DFca-MAJ.js","_app/immutable/chunks/BtazKlE4.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-BGIplx7D.js')),
			__memo(() => import('./chunks/1-lzGuX4lS.js')),
			__memo(() => import('./chunks/2-D0SshSXb.js')),
			__memo(() => import('./chunks/3-CkF0BC1_.js')),
			__memo(() => import('./chunks/4-2w_Gokw2.js')),
			__memo(() => import('./chunks/5-C4mWgGha.js')),
			__memo(() => import('./chunks/6-CeJDbDXP.js')),
			__memo(() => import('./chunks/7-BwMsOO5Z.js')),
			__memo(() => import('./chunks/8-CwJwcp7h.js')),
			__memo(() => import('./chunks/9-G0xTPw2m.js')),
			__memo(() => import('./chunks/10-BVaLlhAK.js')),
			__memo(() => import('./chunks/11-Dfdx0zl8.js')),
			__memo(() => import('./chunks/12-bR6nR1aB.js'))
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
