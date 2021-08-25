function FindProxyForURL (url, host) {
  // our local URLs from the domains below example.com don't need a proxy:
  if (shExpMatch(host, '*.scopus.com', '*.elsevier.com')) {
    return 'PROXY 164.41.91.97:7003; DIRECT';
  }
  return 'DIRECT';
}
