<script>
  import '../index.css';
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <a href="/" class="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-lg">G</span>
          </div>
          <span class="text-xl font-bold text-gray-900">GearGrab</span>
        </a>

        <nav class="hidden md:flex items-center space-x-6">
          <a href="/" class="text-gray-600 hover:text-blue-600 transition-colors">Home</a>
          <a href="/browse" class="text-gray-600 hover:text-blue-600 transition-colors">Browse</a>
          <a href="/list" class="text-gray-600 hover:text-blue-600 transition-colors">List Gear</a>
        </nav>

        <div class="flex items-center space-x-4">
          <button class="text-gray-600 hover:text-blue-600 transition-colors">Sign In</button>
          <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Sign Up</button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main>
    <slot />
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #f9fafb; /* bg-gray-50 */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
</style>
