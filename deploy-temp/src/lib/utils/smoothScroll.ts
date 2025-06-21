/**
 * Smooth scroll utility functions
 * Adapted from EZGear's smooth scrolling functionality
 */

export function smoothScrollTo(elementId: string, offset: number = 0): void {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

export function smoothScrollToElement(element: HTMLElement, offset: number = 0): void {
  if (element) {
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

export function smoothScrollToTop(): void {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// For navbar offset (accounting for fixed navbar height)
export function smoothScrollWithNavOffset(elementId: string): void {
  smoothScrollTo(elementId, 80); // 80px for navbar height
}
