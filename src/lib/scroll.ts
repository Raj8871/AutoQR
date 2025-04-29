'use client'; // This function interacts with the DOM, so it needs to be client-side

/**
 * Smoothly scrolls to an element with the given ID.
 * Returns an event handler function for use with onClick.
 * @param id The ID of the element to scroll to.
 */
export const scrollToSection = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault(); // Prevent default anchor link behavior
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth', // Enable smooth scrolling
      block: 'start',     // Align the top of the element to the top of the viewport
    });
  } else {
    console.warn(`Element with ID "${id}" not found for scrolling.`);
  }
};