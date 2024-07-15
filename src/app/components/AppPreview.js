"use client";
import Image from "next/image";
import Animate from "./Animate";

export default function AppPreview() {
  return (
    <div className="px-5">
      <div className="container p-8 my-16 overflow-hidden bg-top bg-no-repeat bg-cover rounded-2xl md:mx-auto md:my-12 bg-lightPlayer dark:bg-darkPlayer dark:bg-b-300">
        <Animate>
          <Image
            className="w-full md:w-auto rounded-2xl mx:p-8 md:max-w-[410px]"
            src="/img/chating.jpg"
            alt="chatting"
            width={820}
            height={1232}
          />
        </Animate>
      </div>
    </div>
  );
}
