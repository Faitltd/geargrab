/**
 * Animation utilities for UI interactions
 */

// Shake animation for modal panels
export const shakeModal = (element: HTMLElement, options?: {
  duration?: number;
  intensity?: number;
}): Promise<void> => {
  return new Promise((resolve) => {
    const duration = options?.duration || 500;
    const intensity = options?.intensity || 10;
    
    // Add shake animation class
    element.style.animation = `shake ${duration}ms ease-in-out`;
    
    // Remove animation after completion
    setTimeout(() => {
      element.style.animation = '';
      resolve();
    }, duration);
  });
};

// Pulse animation for elements
export const pulseElement = (element: HTMLElement, options?: {
  duration?: number;
  scale?: number;
}): Promise<void> => {
  return new Promise((resolve) => {
    const duration = options?.duration || 300;
    const scale = options?.scale || 1.05;
    
    element.style.transition = `transform ${duration}ms ease-in-out`;
    element.style.transform = `scale(${scale})`;
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
      setTimeout(() => {
        element.style.transition = '';
        resolve();
      }, duration);
    }, duration / 2);
  });
};

// Bounce animation for buttons or interactive elements
export const bounceElement = (element: HTMLElement, options?: {
  duration?: number;
  height?: number;
}): Promise<void> => {
  return new Promise((resolve) => {
    const duration = options?.duration || 400;
    const height = options?.height || -5;
    
    element.style.animation = `bounce ${duration}ms ease-in-out`;
    
    setTimeout(() => {
      element.style.animation = '';
      resolve();
    }, duration);
  });
};

// Fade in animation
export const fadeIn = (element: HTMLElement, options?: {
  duration?: number;
  from?: number;
  to?: number;
}): Promise<void> => {
  return new Promise((resolve) => {
    const duration = options?.duration || 300;
    const from = options?.from || 0;
    const to = options?.to || 1;
    
    element.style.opacity = from.toString();
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    
    // Force reflow
    element.offsetHeight;
    
    element.style.opacity = to.toString();
    
    setTimeout(() => {
      element.style.transition = '';
      resolve();
    }, duration);
  });
};

// Fade out animation
export const fadeOut = (element: HTMLElement, options?: {
  duration?: number;
  from?: number;
  to?: number;
}): Promise<void> => {
  return new Promise((resolve) => {
    const duration = options?.duration || 300;
    const from = options?.from || 1;
    const to = options?.to || 0;
    
    element.style.opacity = from.toString();
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    
    // Force reflow
    element.offsetHeight;
    
    element.style.opacity = to.toString();
    
    setTimeout(() => {
      element.style.transition = '';
      resolve();
    }, duration);
  });
};

// Slide down animation
export const slideDown = (element: HTMLElement, options?: {
  duration?: number;
}): Promise<void> => {
  return new Promise((resolve) => {
    const duration = options?.duration || 300;
    
    element.style.maxHeight = '0';
    element.style.overflow = 'hidden';
    element.style.transition = `max-height ${duration}ms ease-in-out`;
    
    // Force reflow
    element.offsetHeight;
    
    element.style.maxHeight = element.scrollHeight + 'px';
    
    setTimeout(() => {
      element.style.maxHeight = '';
      element.style.overflow = '';
      element.style.transition = '';
      resolve();
    }, duration);
  });
};

// Slide up animation
export const slideUp = (element: HTMLElement, options?: {
  duration?: number;
}): Promise<void> => {
  return new Promise((resolve) => {
    const duration = options?.duration || 300;
    
    element.style.maxHeight = element.scrollHeight + 'px';
    element.style.overflow = 'hidden';
    element.style.transition = `max-height ${duration}ms ease-in-out`;
    
    // Force reflow
    element.offsetHeight;
    
    element.style.maxHeight = '0';
    
    setTimeout(() => {
      element.style.maxHeight = '';
      element.style.overflow = '';
      element.style.transition = '';
      resolve();
    }, duration);
  });
};

// CSS keyframes for animations (to be added to global styles)
export const animationKeyframes = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-10px);
    }
  }
`;

// Utility to add keyframes to document if not already present
export const ensureAnimationKeyframes = (): void => {
  const styleId = 'animation-keyframes';
  
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = animationKeyframes;
    document.head.appendChild(style);
  }
};
