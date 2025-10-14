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
      ...(process.env.NEXT_PUBLIC_S3_ENDPOINT
        ? [
            {
              protocol: new URL(
                process.env.NEXT_PUBLIC_S3_ENDPOINT
              ).protocol.replace(':', ''),
              hostname: new URL(process.env.NEXT_PUBLIC_S3_ENDPOINT).hostname,
              port: new URL(process.env.NEXT_PUBLIC_S3_ENDPOINT).port || '',
              search: '',
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
