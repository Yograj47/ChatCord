import { useState } from 'react';

export function Avatar({
  src,
  initials,
  className,
}: {
  src?: string;
  initials: string;
  className: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string>();
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
    >
      {src && src !== failedSrc ? (
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          className="size-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}
