/* MAGIA GLASS - Navigation fallback
 * Native browser navigation is intentional.
 *
 * The previous soft-navigation interceptor replaced <body> dynamically and
 * could leave production pages blank after clicking Home. These static HTML
 * pages are more reliable when normal links perform the navigation.
 */
(function () {
  'use strict';
  // Existing pages may still include this file. Keep it harmless.
})();
