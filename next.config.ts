import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "export"
};

export default nextConfig;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
});

module.exports = withPWA({
    reactStrictMode: true,
});