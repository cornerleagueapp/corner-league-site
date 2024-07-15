"use client";
import React from "react";
import Animate from "./Animate";
export default function SectionTitle({ title, content }) {
  return (
    <div className="mb-16 text-center">
      <Animate>
        <h2 className="mb-5 text-5xl font-normal leading-snug font-dm-serif text-b-400 dark:text-w-100">
          {title}
        </h2>
      </Animate>
      <Animate delay="1">
        <p className="text-xl font-normal font-dm-sans text-w-700 dark:text-w-300">
          {content}
        </p>
      </Animate>
    </div>
  );
}
