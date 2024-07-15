import React from 'react';
import Image from 'next/image';

export default function LogoSlider() {
  return (
    <div className="pt-12">
      <div className="container mx-auto">
        <div className="grid items-center justify-center gap-1 md:flex md:gap-6">
          <Image
            src="/img/brand-logo/light/FuboTV.svg"
            width={184}
            height={96}
            alt="FanaticsImg"
            className="block dark:hidden"
          />
          <Image
            src="/img/brand-logo/dark/FuboTV.svg"
            width={184}
            height={96}
            alt="FanaticsImg"
            className="hidden dark:block"
          />
          <Image
            src="/img/brand-logo/light/Fanatics.svg"
            width={184}
            height={96}
            alt="FanaticsImg"
            className="block dark:hidden"
          />
          <Image
            src="/img/brand-logo/dark/Fanatics.svg"
            width={184}
            height={96}
            alt="FanaticsImg"
            className="hidden dark:block"
          />
          <Image
            src="/img/brand-logo/light/Malbon.svg"
            width={184}
            height={96}
            alt="FanaticsImg"
            className="block dark:hidden"
          />
          <Image
            src="/img/brand-logo/dark/Malbon.svg"
            width={184}
            height={96}
            alt="FanaticsImg"
            className="hidden dark:block"
          />
          <Image
            src="/img/brand-logo/light/UFC.svg"
            width={184}
            height={96}
            alt="FanaticsImg"
            className="block dark:hidden"
          />
          <Image
            src="/img/brand-logo/dark/UFC.svg"
            width={184}
            height={96}
            alt="FanaticsImg"
            className="hidden dark:block"
          />
        </div>
      </div>
    </div>
  );
}
