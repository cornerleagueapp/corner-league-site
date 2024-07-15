import React from 'react';
import Link from 'next/link';
import HeaderTwo from './components/HeaderTwo';
export default function NotFoundPage() {
  return (
    <>
      <HeaderTwo />
      <div className="bg-w-100 dark:bg-b-200">
        <div className="container px-5 pt-36 pb-20 text-center md:pt-[200px] md:pb-[120px] md:mx-auto">
          <h2 className="mb-6 font-normal leading-snug text-9xl font-dm-serif text-b-400 dark:text-w-100">
            404
          </h2>
          <Link
            href="/"
            className="px-6 py-2 text-base font-bold md:inline-block rounded-3xl font-dm-sans bg-b-400 text-w-100 hover:bg-w-800 hover:text-b-400 dark:bg-w-100 dark:text-b-200 dark:hover:bg-w-800"
          >
            Back to home
          </Link>
        </div>
      </div>
    </>
  );
}
