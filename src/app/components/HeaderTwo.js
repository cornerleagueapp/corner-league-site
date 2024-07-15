import React from "react";
import Image from "next/image";
import Link from "next/link";
export default function HeaderTwo() {
  return (
    <header className="absolute w-full border-b border-w-200 dark:border-b-100">
      <div className="container p-5 md:mx-auto">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-block">
            <Image
              src="/img/footer-logo.svg"
              alt="logo"
              width={169}
              height={48}
              className="block dark:hidden"
            />
            <Image
              src="/img/logo.svg"
              alt="logo"
              width={169}
              height={48}
              className="hidden dark:block"
            />
          </Link>

          <nav>
            <ul className="flex items-center gap-8">
              <li>
                <Link
                  href="/"
                  className="text-base font-normal text-b-400 font-dm-sans hover:underline dark:text-w-100"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about-us"
                  className="text-base font-medium text-b-400 font-dm-sans hover:underline dark:text-w-100"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </nav>
          <a
            href="#newsletter"
            className="hidden px-6 py-2 text-base font-bold md:inline-block rounded-3xl font-dm-sans bg-b-400 text-w-100 hover:bg-w-800 hover:text-b-400 dark:bg-w-100 dark:text-b-200 dark:hover:bg-w-800"
          >
            Join Waitlist
          </a>
        </div>
      </div>
    </header>
  );
}
