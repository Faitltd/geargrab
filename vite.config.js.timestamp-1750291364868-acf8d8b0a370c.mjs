// vite.config.js
import { sveltekit } from "file:///Users/raymondkinneiii/Documents/augment-projects/GearGrab/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import { defineConfig } from "file:///Users/raymondkinneiii/Documents/augment-projects/GearGrab/node_modules/vite/dist/node/index.js";
var vite_config_default = defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    strictPort: false
  },
  optimizeDeps: {
    include: ["@stripe/stripe-js"]
  },
  build: {
    rollupOptions: {
      output: {
        // Add timestamp to chunk filenames to prevent caching
        chunkFileNames: "assets/js/[name]-[hash]-" + Date.now() + ".js",
        entryFileNames: "assets/js/[name]-[hash]-" + Date.now() + ".js",
        assetFileNames: "assets/[ext]/[name]-[hash]-" + Date.now() + ".[ext]"
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcmF5bW9uZGtpbm5laWlpL0RvY3VtZW50cy9hdWdtZW50LXByb2plY3RzL0dlYXJHcmFiXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvcmF5bW9uZGtpbm5laWlpL0RvY3VtZW50cy9hdWdtZW50LXByb2plY3RzL0dlYXJHcmFiL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9yYXltb25ka2lubmVpaWkvRG9jdW1lbnRzL2F1Z21lbnQtcHJvamVjdHMvR2VhckdyYWIvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBzdmVsdGVraXQgfSBmcm9tICdAc3ZlbHRlanMva2l0L3ZpdGUnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtzdmVsdGVraXQoKV0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDUxNzMsXG4gICAgc3RyaWN0UG9ydDogZmFsc2UsXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFsnQHN0cmlwZS9zdHJpcGUtanMnXVxuICB9LFxuICBidWlsZDoge1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICAvLyBBZGQgdGltZXN0YW1wIHRvIGNodW5rIGZpbGVuYW1lcyB0byBwcmV2ZW50IGNhY2hpbmdcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvanMvW25hbWVdLVtoYXNoXS0nICsgRGF0ZS5ub3coKSArICcuanMnLFxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLScgKyBEYXRlLm5vdygpICsgJy5qcycsXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tleHRdL1tuYW1lXS1baGFzaF0tJyArIERhdGUubm93KCkgKyAnLltleHRdJyxcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFnVyxTQUFTLGlCQUFpQjtBQUMxWCxTQUFTLG9CQUFvQjtBQUU3QixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsVUFBVSxDQUFDO0FBQUEsRUFDckIsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLEVBQ2Q7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxtQkFBbUI7QUFBQSxFQUMvQjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBO0FBQUEsUUFFTixnQkFBZ0IsNkJBQTZCLEtBQUssSUFBSSxJQUFJO0FBQUEsUUFDMUQsZ0JBQWdCLDZCQUE2QixLQUFLLElBQUksSUFBSTtBQUFBLFFBQzFELGdCQUFnQixnQ0FBZ0MsS0FBSyxJQUFJLElBQUk7QUFBQSxNQUMvRDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
