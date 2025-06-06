<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { authStore } from '$lib/stores/auth';
  import { auth } from '$lib/firebase/client';
  import { onAuthStateChanged } from 'firebase/auth';
  import Navbar from '$lib/components/layout/Navbar.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import PageTransition from '$lib/components/layout/PageTransition.svelte';
  import type { User } from '$lib/stores/auth';

  // Initialize auth state listener
  onMount(() => {
    if (browser) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || ''
          };

          authStore.set({
            user,
            loading: false,
            error: null
          });
        } else {
          authStore.set({
            user: null,
            loading: false,
            error: null
          });
        }
      });

      // Cleanup subscription on component destroy
      return () => {
        unsubscribe();
      };
    }
  });
</script>

<Navbar />

<PageTransition>
  <main class="relative pt-16 content-container">
    <slot />
  </main>
</PageTransition>

<Footer />