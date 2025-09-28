(function () {
  // Get the current pathname, removing the base path
  const pathname = window.location.pathname.replace(/^\/tidy-ts/, '') || '/';
  
  // Construct the redirect URL with the currentRoute parameter
  const redirectUrl = `/tidy-ts/${
    pathname && pathname !== '/' 
      ? `?currentRoute=${encodeURIComponent(pathname.startsWith('/') ? pathname.slice(1) : pathname)}`
      : ''
  }`;
  
  // Redirect to the root with the current route as a parameter
  window.location.href = redirectUrl;
})();