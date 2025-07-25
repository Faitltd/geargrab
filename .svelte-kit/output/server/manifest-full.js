export const manifest = (() => {
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
		client: {start:"_app/immutable/entry/start.YuS0le-W.js",app:"_app/immutable/entry/app.yF3Ud19f.js",imports:["_app/immutable/entry/start.YuS0le-W.js","_app/immutable/chunks/1Y5BuJXE.js","_app/immutable/chunks/DUQFgvH5.js","_app/immutable/chunks/BGQfL9Iz.js","_app/immutable/entry/app.yF3Ud19f.js","_app/immutable/chunks/BGQfL9Iz.js","_app/immutable/chunks/DUQFgvH5.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BhTDTBTo.js","_app/immutable/chunks/D8tCqQMt.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
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
				id: "/listing/[id]",
				pattern: /^\/listing\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
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
