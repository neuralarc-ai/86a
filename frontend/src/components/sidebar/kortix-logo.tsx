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
      src="/86/A.svg"
      alt="Kortix"
      width={46}
      height={35}
      className="flex-shrink-0"
      style={{ transform: 'rotate(0deg)' }}
    />
  );
}
