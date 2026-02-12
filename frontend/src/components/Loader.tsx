/**
 * Loader Component
 * Provides a full-screen centered spinning animation for loading states.
 * Uses the theme's primary-light color for visual consistency.
 */
export const Loader = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-light"></div>
    </div>
  );
};
