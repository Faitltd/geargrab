<!-- Instead of this: -->
<div on:click={handleClick}>Click me</div>

<!-- Do this: -->
<button on:click={handleClick}>Click me</button>

<!-- Or if you must use a div: -->
<div 
  role="button"
  tabindex="0"
  on:click={handleClick}
  on:keydown={e => e.key === 'Enter' && handleClick()}
>
  Click me
</div>