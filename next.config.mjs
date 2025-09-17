/** @type {import('next').NextConfig} */
const nextConfig = {
    // Remove export config for development server
    // output: 'export',
    // distDir: 'dist',
    
    // External packages for server components (moved from experimental)
    serverExternalPackages: ['colyseus', '@colyseus/ws-transport'],
    
    // Ensure proper WebSocket handling
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Externalize Colyseus dependencies for server-side
            config.externals.push('colyseus', '@colyseus/ws-transport');
        }
        return config;
    },
};

export default nextConfig;
