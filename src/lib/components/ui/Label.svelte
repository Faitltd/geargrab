<script lang="ts">
  import { cn } from '$lib/utils.js';

  export let className = '';
  export let htmlFor: string | undefined = undefined;
</script>

<label
  for={htmlFor}
  class={cn(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    className
  )}
  {...$$restProps}
>
  <slot />
</label>
