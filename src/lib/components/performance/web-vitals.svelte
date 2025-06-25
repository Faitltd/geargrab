<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let vitals = {
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0
  };
  
  let showVitals = false;
  
  onMount(() => {
    if (!browser) return;
    
    // Only show in development or with ?debug=true
    const urlParams = new URLSearchParams(window.location.search);
    showVitals = import.meta.env.DEV || urlParams.get('debug') === 'true';
    
    if (!showVitals) return;
    
    // Measure Web Vitals
    measureWebVitals();
  });
  
  function measureWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.lcp = Math.round(lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            vitals.fcp = Math.round(entry.startTime);
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      
      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        vitals.cls = Math.round(clsValue * 1000) / 1000;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      
      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          vitals.fid = Math.round(entry.processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    }
    
    // Time to First Byte (TTFB)
    if (performance.timing) {
      vitals.ttfb = performance.timing.responseStart - performance.timing.requestStart;
    }
  }
  
  function getVitalColor(metric: string, value: number): string {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 }
    };
    
    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'text-gray-400';
    
    if (value <= threshold.good) return 'text-green-400';
    if (value <= threshold.poor) return 'text-yellow-400';
    return 'text-red-400';
  }
</script>

{#if showVitals}
  <div class="fixed bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg text-xs font-mono z-50">
    <div class="text-white font-bold mb-2">Web Vitals</div>
    <div class="space-y-1">
      <div class="flex justify-between">
        <span>LCP:</span>
        <span class={getVitalColor('lcp', vitals.lcp)}>{vitals.lcp}ms</span>
      </div>
      <div class="flex justify-between">
        <span>FID:</span>
        <span class={getVitalColor('fid', vitals.fid)}>{vitals.fid}ms</span>
      </div>
      <div class="flex justify-between">
        <span>CLS:</span>
        <span class={getVitalColor('cls', vitals.cls)}>{vitals.cls}</span>
      </div>
      <div class="flex justify-between">
        <span>FCP:</span>
        <span class={getVitalColor('fcp', vitals.fcp)}>{vitals.fcp}ms</span>
      </div>
      <div class="flex justify-between">
        <span>TTFB:</span>
        <span class={getVitalColor('ttfb', vitals.ttfb)}>{vitals.ttfb}ms</span>
      </div>
    </div>
  </div>
{/if}
