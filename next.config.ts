import type { NextConfig } from "next";
import { copyFileSync } from 'fs';
import { join } from 'path';

// Copy PDF.js worker to public directory
const pdfWorkerPath = join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js');
const publicWorkerPath = join(process.cwd(), 'public', 'pdf.worker.min.js');

try {
  copyFileSync(pdfWorkerPath, publicWorkerPath);
  console.log('PDF.js worker file copied successfully');
} catch (error) {
  console.error('Error copying PDF.js worker file:', error);
}

const nextConfig: NextConfig = {
  /* config options here */
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: "https",
  //       hostname: "ik.imagekit.io",
  //       port: "",
  //     },
  //   ],
  // },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
