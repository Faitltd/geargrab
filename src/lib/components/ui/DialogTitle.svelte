<script lang="ts">
  import { cn } from '$lib/utils.js';

  export let className = '';
</script>

<h2
  class={cn('text-lg font-semibold leading-none tracking-tight', className)}
  {...$$restProps}
>
  <slot />
</h2>
