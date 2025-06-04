<!-- Instead of this: -->
<input type="text" bind:value={name} />

<!-- Do this: -->
<label for="name-input">Name</label>
<input id="name-input" type="text" bind:value={name} />

<!-- Or use this pattern: -->
<label>
  Name
  <input type="text" bind:value={name} />
</label>