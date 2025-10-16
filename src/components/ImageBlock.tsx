import React from "react";

export type ImageBlockProps = {
  src: string;
  alt?: string;
  caption?: string;
  widthPercent?: number; // 40..100
  align?: "center" | "left" | "right";
  className?: string;
};

const ImageBlock: React.FC<ImageBlockProps> = ({
  src,
  alt = "",
  caption,
  widthPercent = 80,
  align = "center",
  className,
}) => {
  const alignClass =
    align === "left"
      ? "ml-0 mr-auto"
      : align === "right"
      ? "ml-auto mr-0"
      : "mx-auto";

  const safeWidth = Math.min(100, Math.max(30, widthPercent));

  return (
    <figure className={`my-6 ${alignClass} ${className || ""}`} style={{ width: `${safeWidth}%` }}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img
        src={src}
        alt={alt}
        className="block w-full h-auto object-contain rounded-md shadow"
        loading="lazy"
        crossOrigin="anonymous"
      />
      {caption ? (
        <figcaption className="mt-2 text-sm text-gray-600 text-center">{caption}</figcaption>
      ) : null}
    </figure>
  );
};

export default ImageBlock;