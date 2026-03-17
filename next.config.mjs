/** @type {import('next').NextConfig} */
const nextConfig = {
  // d3-geo and d3-delaunay are pure ESM — ensure they are transpiled for
  // compatibility across all deployment targets.
  transpilePackages: ["d3-geo", "d3-delaunay"],
};

export default nextConfig;
