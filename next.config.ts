import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // このリポジトリを単独のワークスペース root として扱う。
  // 親ディレクトリに別の lockfile があるとき、Next.js が root を誤検出するのを防ぐ。
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
