import React from "react";
import { motion } from "framer-motion";

type Props = {
  size?: number; // size of the album cover
  spinning?: boolean; // should the cover spin
  speed?: number; // seconds per full rotation
  title?: string; // track title
  coverUrl?: string; // album cover image URL
};

export default function AlbumCoverPlayer({
  size = 150,
  spinning = true,
  speed = 3,
  title,
  coverUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23222' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='%23999' text-anchor='middle' dy='.3em'%3EAlbum Cover%3C/text%3E%3C/svg%3E",
}: Props) {
  const coverStyle: React.CSSProperties = {
    width: size,
    height: size,
    backgroundImage: `url(${coverUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    borderRadius: "50%", // make it circular
  };

  const spinClass = spinning ? "animate-spin" : "animate-none";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`relative overflow-hidden shadow-2xl ${spinClass}`}
        style={{ ...coverStyle, animationDuration: `${speed}s` }}
      >
        {/* Add subtle overlay gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent rounded-full" />
      </div>

     
      {title && <div className="text-sm text-center text-gray-300">{title}</div>}
    </div>
  );
}