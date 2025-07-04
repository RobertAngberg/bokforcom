/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enkel konfiguration för bättre hot reload
    reactStrictMode: true,

    // Förbättra webpack watch
    webpack: (config, { dev, isServer }) => {
        if (dev && !isServer) {
            config.watchOptions = {
                poll: 1000,
                aggregateTimeout: 300,
            };
        }
        return config;
    },
};

module.exports = nextConfig;
