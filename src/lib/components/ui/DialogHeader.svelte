<script lang="ts">
  import { cn } from '$lib/utils.js';

  export let className = '';
</script>

<div
  class={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
  {...$$restProps}
>
  <slot />
</div>
