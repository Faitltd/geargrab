# Tailwind CSS Configuration

## Overview
This project uses Tailwind CSS with the following plugins:
- `@tailwindcss/forms` - Better form styling
- `@tailwindcss/typography` - Typography utilities

## Custom Configuration

### Colors
- **Primary**: Green-600 (#16a34a)
- **Green palette**: Extended green color scale
- **Teal palette**: Extended teal color scale

### Shadows
- **Top shadow**: `shadow-t` for top-facing shadows

## Usage Examples

### Forms
```html
<input class="form-input rounded-md border-gray-300" type="text" />
<select class="form-select rounded-md border-gray-300">
  <option>Option 1</option>
</select>
```

### Typography
```html
<article class="prose prose-lg">
  <h1>Article Title</h1>
  <p>Article content...</p>
</article>
```

### Custom Colors
```html
<div class="bg-primary text-white">Primary background</div>
<div class="bg-green-500 text-white">Green background</div>
<div class="bg-teal-400 text-white">Teal background</div>
```

## Build Process
Tailwind CSS is processed through PostCSS with autoprefixer for vendor prefixes.

## Troubleshooting
If you encounter issues:
1. Run `node scripts/fix-tailwind.js`
2. Check that all plugins are installed
3. Verify PostCSS configuration
4. Test compilation with `npm run build`
