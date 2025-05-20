<script lang="ts">
  export let gear: {
    id: string;
    image: string;
    title: string;
    price: number;
    condition: 'New' | 'Good' | 'Used';
    rating: number;
    location: string;
  };
</script>

<a href={`/gear/${gear.id}`} class="block rounded-2xl shadow hover:shadow-lg transition bg-white overflow-hidden">
  <div class="relative">
    <img src={gear.image} alt={gear.title} class="w-full h-48 object-cover" />
    <span class="absolute top-2 right-2 text-sm bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">{gear.condition}</span>
  </div>
  <div class="p-4 space-y-2">
    <h2 class="text-lg font-semibold line-clamp-1">{gear.title}</h2>
    <div class="text-sm text-gray-500">{gear.location}</div>
    <div class="flex justify-between items-center mt-2">
      <span class="text-green-600 font-bold">${gear.price}/day</span>
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span class="ml-1 text-sm">{gear.rating}</span>
      </div>
    </div>
  </div>
</a>