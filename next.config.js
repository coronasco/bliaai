/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com', 'firebasestorage.googleapis.com'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { "firebase-admin": "firebase-admin" }];
    return config;
  },
  // Folosim serverExternalPackages în loc de experimental.serverComponentsExternalPackages
  serverExternalPackages: ['firebase-admin']
}

module.exports = nextConfig 