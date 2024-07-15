"use client";
import Image from "next/image";
import Link from "next/link";
import Animate from "./Animate";
import Logo from '../../../public/img/CL-logo.jpg';

export default function Footer() {
  return (
    <>
      <footer className="bg-w-100 dark:bg-b-200">
        <div className="container px-5 mx-auto">
          <div className="flex flex-col justify-start py-24 md:flex-row md:justify-between">
            <div>
              <Animate>
                <Link href="/" className="inline-block">
                  <Image
                    src={Logo}
                    alt="logo"
                    width={50}
                    height={48}
                    className="block dark:hidden"
                  />
                  <Image
                    src={Logo}
                    alt="logo"
                    width={50}
                    height={48}
                    className="hidden dark:block"
                  />
                </Link>
              </Animate>
              <Animate delay="2">
                <p className="my-6 text-sm font-normal md:mb-0 font-dm-sans text-w-700 dark:text-w-300">
                  Dive into the excitement of the sports world <br />
                  with live updates and dynamic content!
                </p>
              </Animate>
            </div>
            <div className="flex flex-col items-start justify-start md:flex-row gap-11 md:gap-20 md:justify-end">
              <div>
                <ul>
                  <Animate>
                    <li>
                      <h3 className="inline-block mb-4 text-base font-medium capitalize font-dm-sans text-b-400 dark:text-w-100">
                        Company
                      </h3>
                    </li>
                  </Animate>
                  <Animate delay="1">
                    <li>
                      <Link
                        href="/"
                        className="inline-block mb-4 text-sm font-normal capitalize font-dm-sans text-w-700 hover:underline dark:text-w-300"
                      >
                        Home
                      </Link>
                    </li>
                  </Animate>
                  <Animate delay="2">
                    <li>
                      <Link
                        href="/about-us"
                        className="inline-block text-sm font-normal capitalize font-dm-sans text-w-700 hover:underline dark:text-w-300"
                      >
                        About us
                      </Link>
                    </li>
                  </Animate>
                </ul>
              </div>
              <div>
                <ul>
                  <Animate>
                    <li>
                      <h3 className="inline-block mb-4 text-base font-medium capitalize font-dm-sans text-b-400 dark:text-w-100">
                        Contact
                      </h3>
                    </li>
                  </Animate>
                  <Animate delay="1">
                    <li>
                      <a
                        href="mailto:support@cornerleague.com"
                        className="inline-block text-sm font-normal capitalize font-dm-sans text-w-700 hover:underline dark:text-w-300"
                      >
                        support@cornerleague.com
                      </a>
                    </li>
                  </Animate>
                </ul>
              </div>
              <div>
                <ul>
                  <Animate>
                    <li>
                      <h3 className="inline-block mb-4 text-base font-medium capitalize font-dm-sans text-b-400 dark:text-w-100">
                        Social
                      </h3>
                    </li>
                  </Animate>
                  <Animate delay="1">
                    <li>
                      <a
                        href="https://twitter.com/aircornerleague"
                        target="_blank"
                        className="inline-block mb-4 text-sm font-normal capitalize font-dm-sans text-w-700 hover:underline dark:text-w-300"
                      >
                        Twitter
                      </a>
                    </li>
                  </Animate>
                  <Animate delay="2">
                    <li>
                      <a
                        href="https://www.instagram.com/cornerleaguenetwork/"
                        target="_blank"
                        className="inline-block text-sm font-normal capitalize font-dm-sans text-w-700 hover:underline dark:text-w-300"
                      >
                        Instagram
                      </a>
                    </li>
                  </Animate>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <span className="inline-block w-full h-[1px] border border-t-solid border-w-200 dark:border-b-100"></span>
        <div className="container flex flex-col items-center justify-center gap-2 px-5 py-8 mx-auto md:gap-8 md:flex-row md:justify-between">
          <p className="text-sm font-normal font-dm-sans text-w-500 dark:text-w-700">
            &copy; Corner League Inc. All Rights Reserved.
          </p>
          <ul className="flex justify-center gap-8 md:justify-end">
            <li>
              <a
                href="#"
                className="inline-block text-sm capitalize font-dm-sans text-w-500 hover:underline dark:text-w-700"
              >
                privacy policy
              </a>
            </li>
            <li>
              <a
                href="#"
                className="inline-block text-sm font-dm-sans text-w-500 hover:underline dark:text-w-700"
              >
                Terms of Service
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </>
  );
}
