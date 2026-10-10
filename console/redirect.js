// SEC-36 (2026-10-09). The console is served from https://org.nostia.io/console/, same-origin with
// the API, where it gets the response headers GitHub Pages cannot send: frame-ancestors (so no site
// can frame it) and a header CSP. This copy on nostia.io still has to exist, because org.nostia.io
// serves it by proxying nostia.io, but anyone who opens it here is sent there.
//
// A classic script in <head>, so it runs before anything renders, and same-origin under either
// host's policy. On org.nostia.io the hostname check is false and it does nothing.
(function () {
  var host = location.hostname;
  if (host === 'nostia.io' || host === 'www.nostia.io') {
    location.replace('https://org.nostia.io/console/' + location.search + location.hash);
  }
}());
