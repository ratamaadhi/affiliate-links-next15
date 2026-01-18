import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
        port: '',
        search: '',
      },
      // Add S3 endpoint from environment variable if available
      ...(process.env.S3_ENDPOINT
        ? [
            {
              protocol: new URL(process.env.S3_ENDPOINT).protocol.replace(
                ':',
                ''
              ),
              hostname: new URL(process.env.S3_ENDPOINT).hostname,
              port: new URL(process.env.S3_ENDPOINT).port || '',
              search: '',
            },
          ]
        : []),
    ],
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Configure compression
  compress: true,
};

export default process.env.ANALYZE === 'true'
  ? withBundleAnalyzer(nextConfig)
  : nextConfig;
