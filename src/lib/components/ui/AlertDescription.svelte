<script lang="ts">
  import { cn } from '$lib/utils.js';

  export let className = '';
</script>

<div
  class={cn('text-sm [&_p]:leading-relaxed', className)}
  {...$$restProps}
>
  <slot />
</div>
