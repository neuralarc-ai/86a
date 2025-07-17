'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface KortixLogoProps {
  size?: number;
}
export function KortixLogo() {
  return (
    <Image
      src="/full-logo.svg"
      alt="Kortix"
      width={32}
      height={32}
      className="object-contain flex-shrink-0"
      style={{ transform: 'rotate(0deg)' }}
    />
  );
}
