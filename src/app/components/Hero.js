"use client";
import Image from "next/image";
import Animate from "./Animate";

export default function Hero() {
  return (
    <div className="bg-center bg-no-repeat bg-cover bg-lightHero dark:bg-darkHero">
      <div className="container md:mx-auto">
        <div className="pb-16 pt-36 md:pt-[200px] md:pb-[200px] text-center md:max-w-[1220px] md:mx-auto px-5">
          <Animate>
            <div
              className="flex items-center gap-2 px-3 py-2 m-auto mb-6 text-sm font-medium border text-w-100 border-w-100 border-opacity-20 rounded-3xl w-fit font-dm-sans"
              data-aos="fade-up"
              data-aos-delay="700"
            >
              <p>10K+ Of Fans Actively Involved</p>
              <Image width={45} height={20} src="/img/user.png" alt="user" />
            </div>
          </Animate>
          <Animate delay="1">
            <h2 className="text-5xl font-normal leading-snug md:leading-[1.16] md:text-8xl text-w-100 font-dm-serif">
              The Premier Sports Media App with AI ASSISTANCE
            </h2>
          </Animate>
          <Animate delay="2">
            <p className="mt-8 mb-10 text-xl font-dm-sans text-w-100 md:max-w-3xl md:mx-auto">
              Fully customize your sports feed to get the latest sports news,
              updates, scores, and media that is tailored to your preference!
            </p>
          </Animate>
          <Animate delay="3">
            <div className="flex justify-center gap-4">
              <a
                href="#newsletter"
                className="flex items-center px-8 py-3 text-base font-bold rounded-3xl font-dm-sans bg-w-100 text-b-400 hover:bg-w-800"
              >
                Join Waitlist
              </a>
              <a
                href="#"
                className="flex items-center px-8 py-3 text-base font-bold border rounded-3xl font-dm-sans border-w-100 text-w-100 hover:bg-w-800 hover:text-b-400"
              >
                Learn More
              </a>
            </div>
          </Animate>
        </div>
      </div>
    </div>
  );
}
