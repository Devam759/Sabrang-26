'use client';

import React from 'react';
import LogoLoop from '@/components/ui/LogoLoop';
import { PAST_SPONSORS } from '@/lib/constants';

export default function SponsorsClient() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 w-full space-y-12 overflow-hidden">
      <section className="text-center space-y-4 px-4">
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase">
          Past Partners
        </h1>
      </section>

      <section className="w-full overflow-hidden py-4">
        <LogoLoop
          logos={PAST_SPONSORS}
          speed={60}
          direction="left"
          logoHeight={64}
          gap={60}
          pauseOnHover={true}
          scaleOnHover={true}
          fadeOut={false}
          ariaLabel="Past Partners Showcase"
        />
      </section>
    </div>
  );
}
