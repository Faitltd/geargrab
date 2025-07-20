import { goto } from '$app/navigation';

// Smooth page transition with animation
export const navigateWithTransition = async (
  url: string, 
  options: {
    delay?: number;
    replaceState?: boolean;
    noScroll?: boolean;
    keepFocus?: boolean;
    invalidateAll?: boolean;
  } = {}
) => {
  const { delay = 0, ...gotoOptions } = options;
  
  // Add a slight delay for smooth transition
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  // Navigate to the new page
  await goto(url, gotoOptions);
};

// Create a slide-out effect before navigation
export const slideOutAndNavigate = async (
  url: string,
  element?: HTMLElement,
  options: {
    direction?: 'left' | 'right' | 'up' | 'down';
    duration?: number;
    distance?: number;
  } = {}
) => {
  const { direction = 'left', duration = 300, distance = 100 } = options;
  
  if (element) {
    // Apply slide-out animation
    element.style.transition = `transform ${duration}ms ease-in-out, opacity ${duration}ms ease-in-out`;
    
    switch (direction) {
      case 'left':
        element.style.transform = `translateX(-${distance}px)`;
        break;
      case 'right':
        element.style.transform = `translateX(${distance}px)`;
        break;
      case 'up':
        element.style.transform = `translateY(-${distance}px)`;
        break;
      case 'down':
        element.style.transform = `translateY(${distance}px)`;
        break;
    }
    
    element.style.opacity = '0';
    
    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, duration));
  }
  
  // Navigate to the new page
  await goto(url);
};

// Success animation with GearGrab colors
export const showSuccessAnimation = (element: HTMLElement, message: string = 'Success!') => {
  // Create success overlay
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-primary-500 bg-opacity-90 flex items-center justify-center z-50';
  overlay.style.animation = 'fadeIn 0.3s ease-out';
  
  // Create success content
  const content = document.createElement('div');
  content.className = 'text-center text-white';
  content.innerHTML = `
    <div class="mb-4">
      <svg class="w-16 h-16 mx-auto text-white animate-bounce" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
    </div>
    <h2 class="text-2xl font-bold mb-2">${message}</h2>
    <p class="text-lg opacity-90">Redirecting to dashboard...</p>
  `;
  
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  
  // Remove overlay after animation
  setTimeout(() => {
    overlay.style.animation = 'fadeOut 0.3s ease-in';
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 300);
  }, 2000);
};

// Add CSS animations if not already present
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutLeft {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(-100%); opacity: 0; }
    }
    
    .slide-in-right {
      animation: slideInRight 0.5s ease-out;
    }
    
    .slide-out-left {
      animation: slideOutLeft 0.3s ease-in;
    }
  `;
  
  if (!document.head.querySelector('style[data-transitions]')) {
    style.setAttribute('data-transitions', 'true');
    document.head.appendChild(style);
  }
}
