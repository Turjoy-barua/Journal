import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    remotePatterns: [
      {protocol: 'https', hostname: 'images.unsplash.com'},
      {protocol: 'https', hostname: 'images.contentstack.io'},
      {protocol: 'https', hostname: 'eu-images.contentstack.com'},
      {protocol: 'https', hostname: 'au-images.contentstack.com'},
      {protocol: 'https', hostname: 'azure-na-images.contentstack.com'},
      {protocol: 'https', hostname: 'azure-eu-images.contentstack.com'},
    ],
  },
};

export default config;
