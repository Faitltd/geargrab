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
  import ToastNotifications from '$lib/components/ui/ToastNotifications.svelte';
  import type { User } from '$lib/stores/auth';

  // Initialize auth state listener
  onMount(() => {
    if (browser) {
      console.log('🔐 Initializing auth state listener...');
      console.log('🔐 Auth object:', auth);
      console.log('🔐 Browser environment:', browser);

      // Immediate check of current user
      const currentUser = auth?.currentUser;
      console.log('🔐 Current user on mount:', currentUser?.email || 'null');

      // Set a shorter timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        console.warn('⚠️ Auth state loading timeout - forcing resolution');
        const currentUser = auth?.currentUser;

        if (currentUser) {
          const user: User = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || ''
          };
          authStore.set({ user, loading: false, error: null });
        } else {
          authStore.set({ user: null, loading: false, error: null });
        }
      }, 3000); // Reduced to 3 seconds

      // Set up auth state listener
      let unsubscribe: (() => void) | null = null;

      try {
        if (auth) {
          unsubscribe = onAuthStateChanged(auth,
            (firebaseUser) => {
              console.log('🔐 Auth state changed:', firebaseUser ? firebaseUser.email : 'null');
              clearTimeout(loadingTimeout);

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
            },
            (error) => {
              console.error('🔐 Auth state error:', error);
              clearTimeout(loadingTimeout);
              authStore.set({
                user: null,
                loading: false,
                error: error.message
              });
            }
          );

          console.log('🔐 Auth listener set up successfully');
        } else {
          console.warn('⚠️ Auth object not available');
          clearTimeout(loadingTimeout);
          authStore.set({ user: null, loading: false, error: 'Auth not initialized' });
        }
      } catch (error) {
        console.error('🔐 Failed to set up auth listener:', error);
        clearTimeout(loadingTimeout);
        authStore.set({
          user: null,
          loading: false,
          error: 'Failed to initialize authentication'
        });
      }

      // Cleanup subscription on component destroy
      return () => {
        clearTimeout(loadingTimeout);
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } else {
      // Not in browser - set to not loading immediately
      console.log('🔐 Not in browser environment - setting auth to not loading');
      authStore.set({ user: null, loading: false, error: null });
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

<!-- Toast Notifications -->
<ToastNotifications />