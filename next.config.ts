import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self'",
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests"
  ].join('; ') },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },

  async redirects() {
    return [
      { source: '/pages/servicos.html', destination: '/servicos', permanent: true },
      { source: '/pages/galeria.html', destination: '/galeria', permanent: true },
      { source: '/pages/contato.html', destination: '/contato', permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: '/favicon.ico', destination: '/favicon' },
      { source: '/', destination: '/index.html' },
      { source: '/servicos', destination: '/pages/servicos.html' },
      { source: '/galeria', destination: '/pages/galeria.html' },
      { source: '/contato', destination: '/pages/contato.html' },
    ];
  },
};

export default nextConfig;
