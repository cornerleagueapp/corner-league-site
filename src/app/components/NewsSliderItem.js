import React from "react";
import Image from "next/image";
export default function NewsSliderItem({ title, content, img }) {
  return (
    <li className="glide__slide">
      <Image
        src={`/img/sports/${img}.jpg`}
        alt="sport"
        className="w-full rounded-2xl"
        width={600}
        height={400}
      />
      <a
        href="#"
        className="inline-block mt-6 mb-2 text-3xl font-normal capitalize font-dm-serif hover:underline text-b-400 dark:text-w-100"
      >
        {title}
      </a>
      <p className="text-xl font-normal font-dm-sans text-w-700 dark:text-w-300">
        {content}
      </p>
    </li>
  );
}
