/* Runs before first paint; no request, cookie, or account data is used. */
(function () {
  var preference = null;
  try { preference = localStorage.getItem('corner-league-color-mode'); } catch (_) {}
  var dark = preference !== 'light';
  document.documentElement.dataset.colorMode = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
})();
