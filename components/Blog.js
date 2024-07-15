'use client';
import React from 'react';
import SectionTitle from './SectionTitle';
import Animate from './Animate';
export default function Blog() {
  return (
    <div className="bg-body dark:bg-b-300">
      <div className="container px-5 py-16 mx-auto md:py-24">
        <SectionTitle
          title=" What's Happening Globally"
          content="Stay updated on global events and trends."
        />
        <div className="grid items-stretch grid-cols-1 gap-6 lg:grid-cols-3">
          <Animate delay="3">
            <div className="relative z-10 flex flex-col justify-between h-full p-6 bg-center bg-no-repeat bg-cover group rounded-2xl bg-w-100 dark:bg-b-200 bg-blog1">
              <div className="absolute inset-0 transition-opacity duration-500 ease-in-out -z-10 opacity-95 bg-w-100 group-hover:opacity-0 dark:bg-b-200 rounded-2xl"></div>
              <div>
                <a
                  href="#"
                  className="inline-block mb-4 text-2xl font-normal transition-opacity duration-500 ease-in-out hover:underline font-dm-serif text-b-100 dark:text-w-100 group-hover:text-w-100"
                >
                  Still Want Drama? Five exciting European title races, from
                  Denmark to Bulgaria
                </a>
                <p className="mb-12 text-base font-normal font-dm-sans text-w-500 dark:text-w-700">
                  March 25, 2024
                </p>
              </div>
              <div>
                <a
                  href="#"
                  className="inline-block px-3 py-2 text-base uppercase border border-solid bg-w-100 me-2 font-dm-sans rounded-3xl border-w-200 text-w-600 hover:bg-w-800 dark:text-w-600 dark:border-b-100 dark:hover:bg-b-400 dark:bg-b-200"
                >
                  news
                </a>
                <a
                  href="#"
                  className="inline-block px-3 py-2 text-base uppercase border border-solid bg-w-100 me-2 font-dm-sans rounded-3xl border-w-200 text-w-600 hover:bg-w-800 dark:text-w-600 dark:border-b-100 dark:hover:bg-b-400 dark:bg-b-200"
                >
                  Soccer
                </a>
              </div>
            </div>
          </Animate>
          <div className="flex flex-col gap-6">
            <Animate delay="4">
              <div className="relative z-10 p-6 bg-center bg-no-repeat bg-cover group rounded-2xl bg-w-100 dark:bg-b-200 bg-blog2">
                <div className="absolute inset-0 transition-opacity duration-500 ease-in-out -z-10 opacity-95 bg-w-100 group-hover:opacity-0 dark:bg-b-200 rounded-2xl"></div>
                <a
                  href="#"
                  className="inline-block mb-4 text-2xl font-normal transition-opacity duration-500 ease-in-out hover:underline font-dm-serif text-b-100 dark:text-w-100 group-hover:text-w-100"
                >
                  Sources: Cowboys rework Dak Prescott’s contract to reduce cap
                  hit
                </a>
                <p className="mb-12 text-base font-normal font-dm-sans text-w-500 dark:text-w-700">
                  March 25, 2024
                </p>
                <div>
                  <a
                    href="#"
                    className="inline-block px-3 py-2 text-base uppercase border border-solid bg-w-100 me-2 font-dm-sans rounded-3xl border-w-200 text-w-600 hover:bg-w-800 dark:text-w-600 dark:border-b-100 dark:hover:bg-b-400 dark:bg-b-200"
                  >
                    news
                  </a>
                  <a
                    href="#"
                    className="inline-block px-3 py-2 text-base uppercase border border-solid bg-w-100 me-2 font-dm-sans rounded-3xl border-w-200 text-w-600 hover:bg-w-800 dark:text-w-600 dark:border-b-100 dark:hover:bg-b-400 dark:bg-b-200"
                  >
                    football
                  </a>
                </div>
              </div>
            </Animate>
            <Animate delay="4">
              <div className="relative z-10 p-6 bg-center bg-no-repeat bg-cover group rounded-2xl bg-w-100 dark:bg-b-200 bg-blog3">
                <div className="absolute inset-0 transition-opacity duration-500 ease-in-out -z-10 opacity-95 bg-w-100 group-hover:opacity-0 dark:bg-b-200 rounded-2xl"></div>
                <a
                  href="#"
                  className="inline-block mb-4 text-2xl font-normal transition-opacity duration-500 ease-in-out hover:underline font-dm-serif text-b-100 dark:text-w-100 group-hover:text-w-100"
                >
                  Where does Panthers-Lightning land in the ranking of current
                  NHL rivalries
                </a>
                <p className="mb-12 text-base font-normal font-dm-sans text-w-500 dark:text-w-700">
                  March 19, 2024
                </p>
                <div>
                  <a
                    href="#"
                    className="inline-block px-3 py-2 text-base uppercase border border-solid bg-w-100 me-2 font-dm-sans rounded-3xl border-w-200 text-w-600 hover:bg-w-800 dark:text-w-600 dark:border-b-100 dark:hover:bg-b-400 dark:bg-b-200"
                  >
                    news
                  </a>
                  <a
                    href="#"
                    className="inline-block px-3 py-2 text-base uppercase border border-solid bg-w-100 me-2 font-dm-sans rounded-3xl border-w-200 text-w-600 hover:bg-w-800 dark:text-w-600 dark:border-b-100 dark:hover:bg-b-400 dark:bg-b-200"
                  >
                    Hockey
                  </a>
                </div>
              </div>
            </Animate>
          </div>
          <Animate delay="5">
            <div className="relative z-10 flex flex-col justify-between h-full p-6 bg-center bg-no-repeat bg-cover group rounded-2xl bg-w-100 dark:bg-b-200 bg-blog4">
              <div className="absolute inset-0 transition-opacity duration-500 ease-in-out -z-10 opacity-95 bg-w-100 group-hover:opacity-0 dark:bg-b-200 rounded-2xl"></div>
              <div>
                <a
                  href="#"
                  className="inline-block mb-4 text-2xl font-normal transition-opacity duration-500 ease-in-out hover:underline font-dm-serif text-b-100 dark:text-w-100 group-hover:text-w-100"
                >
                  The Kohli & Karthik show takes RCB over the line
                </a>
                <p className="mb-12 text-base font-normal font-dm-sans text-w-500 dark:text-w-700">
                  March 25, 2024
                </p>
              </div>
              <div>
                <a
                  href="#"
                  className="inline-block px-3 py-2 text-base uppercase border border-solid bg-w-100 me-2 font-dm-sans rounded-3xl border-w-200 text-w-600 hover:bg-w-800 dark:text-w-600 dark:border-b-100 dark:hover:bg-b-400 dark:bg-b-200"
                >
                  news
                </a>
                <a
                  href="#"
                  className="inline-block px-3 py-2 text-base uppercase border border-solid bg-w-100 me-2 font-dm-sans rounded-3xl border-w-200 text-w-600 hover:bg-w-800 dark:text-w-600 dark:border-b-100 dark:hover:bg-b-400 dark:bg-b-200"
                >
                  Cricket
                </a>
              </div>
            </div>
          </Animate>
        </div>
      </div>
    </div>
  );
}
