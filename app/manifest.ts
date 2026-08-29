import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Verdikt",
    short_name: "Verdikt",
    description: "The crowd's verdict, settled on-chain. Live on Monad testnet.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f3",
    theme_color: "#f6f5f3",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
