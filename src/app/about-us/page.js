"use client";
import Image from "next/image";
import HeaderTwo from "../components/HeaderTwo";
import SectionTitle from "../components/SectionTitle";
import Newsletter from "../components/Newsletter";
import DarkModeToggle from "../components/DarkModeToggle";
import Animate from "../components/Animate";
export default function About() {
  return (
    <>
      <HeaderTwo />
      <div className="bg-w-100 dark:bg-b-200">
        <div className="container px-5 pt-36 pb-20 text-center md:pt-[200px] md:pb-[120px] md:mx-auto">
          <Animate>
            <h2 className="mb-6 text-5xl font-normal leading-snug font-dm-serif md:text-8xl text-b-400 dark:text-w-100">
              The Ultimate Hub for Sports
            </h2>
          </Animate>
          <Animate delay="1">
            <p className="text-xl font-normal font-dm-sans text-w-700 dark:text-w-300">
              Redefining sports media with a dedicated social platform. Create,
              connect, engage.
            </p>
          </Animate>
        </div>
      </div>
      <div className="bg-body dark:bg-b-300">
        <div className="container px-5 py-16 md:py-24 md:mx-auto">
          <Animate delay="2">
            <Image
              src="/img/about-light.jpg"
              alt="about"
              width={1224}
              height={680}
              className="block w-full rounded-xl dark:hidden"
            />
            <Image
              src="/img/about-dark.jpg"
              alt="about"
              width={1224}
              height={680}
              className="hidden w-full rounded-xl dark:block"
            />
          </Animate>
          <Animate>
            <p className="pt-12 text-xl font-normal font-dm-sans text-w-700 md:max-w-4xl md:mx-auto dark:text-w-300">
              Corner League is set to transform the sports media realm with its
              groundbreaking social media platform dedicated solely to the
              sports community. Empowering athletes and enthusiasts, our
              platform fosters connections, engagement, and monetization
              opportunities. With a focus on user experience, we're crafting an
              intuitive interface for seamless content creation, community
              building, and live interactions, taking the sports experience to
              new heights.
            </p>
          </Animate>
        </div>
      </div>
      <div className="bg-w-100 dark:bg-b-200">
        <div className="container px-5 py-16 md:py-24 md:mx-auto">
          <SectionTitle
            title="Essential Features"
            content="Access live updates, connect with groups, and utilize AI for sports info."
          />
          <div className="grid gap-6">
            <Animate delay="3">
              <div className="grid items-center gap-10 rounded-lg md:gap-6 bg-w-800 md:grid-cols-2">
                <div className="p-12 pb-0 md:pb-12">
                  <h2 className="mb-4 text-3xl font-normal text-b-400 font-dm-serif">
                    Personalized Sports Clubs
                  </h2>
                  <p className="text-xl font-normal text-w-700 font-dm-sans">
                    Create personalized clubs to tailor your favorite sports and
                    team content. Engage with friends and community members in
                    your own dedicated clubs, fostering vibrant discussions and
                    connections.
                  </p>
                </div>
                <div className="p-12 pt-0 pb-0 md:pt-12 md:pl-0">
                  <Image
                    src="/img/essential/1.jpg"
                    alt="chat"
                    className="w-full rounded-b-none rounded-2xl"
                    width={504}
                    height={440}
                  />
                </div>
              </div>
            </Animate>
            <Animate delay="4">
              <div className="grid items-center gap-10 rounded-lg md:gap-6 bg-w-800 md:grid-cols-2">
                <div className="p-12 pb-0 md:pb-12">
                  <h2 className="mb-4 text-3xl font-normal text-b-400 font-dm-serif">
                    Live Multi-User Video Streams
                  </h2>
                  <p className="text-xl font-normal text-w-700 font-dm-sans">
                    Host multi-user video streams for podcasting, watch parties,
                    Q&A sessions, game discussions, and beyond, bringing your
                    audience together for dynamic live interactions.
                  </p>
                </div>
                <div className="p-12 pt-0 pb-0 md:pt-12 md:pl-0">
                  <Image
                    src="/img/essential/2.jpg"
                    alt="chat"
                    className="w-full rounded-b-none rounded-2xl"
                    width={504}
                    height={440}
                  />
                </div>
              </div>
            </Animate>
            <Animate delay="5">
              <div className="grid items-center gap-10 rounded-lg md:gap-6 bg-w-800 md:grid-cols-2">
                <div className="p-12 pb-0 md:pb-12">
                  <h2 className="mb-4 text-3xl font-normal text-b-400 font-dm-serif">
                    Customize Your Profile
                  </h2>
                  <p className="text-xl font-normal text-w-700 font-dm-sans">
                    Craft your personalized profile to highlight your sports
                    interests, content, and fantasy/betting data. Tailor your
                    profile to showcase your unique sports journey and engage
                    with like-minded enthusiasts.
                  </p>
                </div>
                <div className="p-12 pt-0 pb-0 md:pt-12 md:pl-0">
                  <Image
                    src="/img/essential/3.jpg"
                    alt="chat"
                    className="w-full rounded-b-none rounded-2xl"
                    width={504}
                    height={440}
                  />
                </div>
              </div>
            </Animate>
          </div>
        </div>
      </div>
      <div className="bg-body dark:bg-b-300">
        <div className="container px-5 py-16 mx-auto md:py-24">
          <SectionTitle
            title="What's Happening Globally"
            content="Stay updated on global events and trends."
          />
          <div className="grid items-stretch grid-cols-1 gap-6 lg:grid-cols-3">
            <Animate delay="3">
              <div className="relative z-10 flex flex-col justify-between h-full p-6 bg-center bg-no-repeat bg-cover group rounded-2xl bg-w-100 dark:bg-b-200 bg-aboutBlog1">
                <div className="absolute inset-0 transition-opacity duration-500 ease-in-out -z-10 opacity-95 bg-w-100 group-hover:opacity-0 dark:bg-b-200 rounded-2xl"></div>
                <div>
                  <a
                    href="#"
                    className="inline-block mb-4 text-2xl font-normal transition-opacity duration-500 ease-in-out hover:underline font-dm-serif text-b-100 dark:text-w-100 group-hover:text-w-100"
                  >
                    NBA playoffs tracker: Teams with postseason spots
                  </a>
                  <p className="mb-12 text-base font-normal font-dm-sans text-w-500 dark:text-w-700">
                    March 18, 2024
                  </p>
                </div>
                <div>
                  <a
                    href="#"
                    className="inline-block px-3 py-2 text-base uppercase border border-solid bg-w-100 me-2 font-dm-sans rounded-3xl border-w-200 text-w-600 hover:bg-w-800 dark:text-w-600 dark:border-b-100 dark:hover:bg-b-400 dark:bg-b-200"
                  >
                    NEWS
                  </a>
                  <a
                    href="#"
                    className="inline-block px-3 py-2 text-base uppercase border border-solid bg-w-100 me-2 font-dm-sans rounded-3xl border-w-200 text-w-600 hover:bg-w-800 dark:text-w-600 dark:border-b-100 dark:hover:bg-b-400 dark:bg-b-200"
                  >
                    basketball
                  </a>
                </div>
              </div>
            </Animate>
            <div className="flex flex-col gap-6">
              <Animate delay="4">
                <div className="relative z-10 p-6 bg-center bg-no-repeat bg-cover group rounded-2xl bg-w-100 dark:bg-b-200 bg-aboutBlog2">
                  <div className="absolute inset-0 transition-opacity duration-500 ease-in-out -z-10 opacity-95 bg-w-100 group-hover:opacity-0 dark:bg-b-200 rounded-2xl"></div>
                  <a
                    href="#"
                    className="inline-block mb-4 text-2xl font-normal transition-opacity duration-500 ease-in-out hover:underline font-dm-serif text-b-100 dark:text-w-100 group-hover:text-w-100"
                  >
                    NCAA gymnastics picks: Who will win SECs, Pac-12s ... and
                    nationals?
                  </a>
                  <p className="mb-12 text-base font-normal font-dm-sans text-w-500 dark:text-w-700">
                    March 18, 2024
                  </p>
                  <div>
                    <a
                      href="#"
                      className="inline-block px-3 py-2 text-base uppercase border border-solid bg-w-100 me-2 font-dm-sans rounded-3xl border-w-200 text-w-600 hover:bg-w-800 dark:text-w-600 dark:border-b-100 dark:hover:bg-b-400 dark:bg-b-200"
                    >
                      NEWS
                    </a>
                    <a
                      href="#"
                      className="inline-block px-3 py-2 text-base uppercase border border-solid bg-w-100 me-2 font-dm-sans rounded-3xl border-w-200 text-w-600 hover:bg-w-800 dark:text-w-600 dark:border-b-100 dark:hover:bg-b-400 dark:bg-b-200"
                    >
                      gymnastics
                    </a>
                  </div>
                </div>
              </Animate>
              <Animate delay="4">
                <div className="relative z-10 p-6 bg-center bg-no-repeat bg-cover group rounded-2xl bg-w-100 dark:bg-b-200 bg-aboutBlog3">
                  <div className="absolute inset-0 transition-opacity duration-500 ease-in-out -z-10 opacity-95 bg-w-100 group-hover:opacity-0 dark:bg-b-200 rounded-2xl"></div>
                  <a
                    href="#"
                    className="inline-block mb-4 text-2xl font-normal transition-opacity duration-500 ease-in-out hover:underline font-dm-serif text-b-100 dark:text-w-100 group-hover:text-w-100"
                  >
                    Divisional rankings: Zepeda solidifies spot at lightweight,
                    calls out Shakur, Gervonta
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
                      boxing
                    </a>
                  </div>
                </div>
              </Animate>
            </div>
            <Animate delay="5">
              <div className="relative z-10 flex flex-col justify-between h-full p-6 bg-center bg-no-repeat bg-cover group rounded-2xl bg-w-100 dark:bg-b-200 bg-aboutBlog4">
                <div className="absolute inset-0 transition-opacity duration-500 ease-in-out -z-10 opacity-95 bg-w-100 group-hover:opacity-0 dark:bg-b-200 rounded-2xl"></div>
                <div>
                  <a
                    href="#"
                    className="inline-block mb-4 text-2xl font-normal transition-opacity duration-500 ease-in-out hover:underline font-dm-serif text-b-100 dark:text-w-100 group-hover:text-w-100"
                  >
                    Expert picks and best bets: UFC Fight Night and Bellator
                  </a>
                  <p className="mb-12 text-base font-normal font-dm-sans text-w-500 dark:text-w-700">
                    March 19, 2024
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
                    UFC
                  </a>
                </div>
              </div>
            </Animate>
          </div>
        </div>
      </div>
      <div className="bg-w-100 dark:bg-b-200">
        <div className="container px-5 py-16 md:py-24 md:mx-auto">
          <SectionTitle
            title="AI-Powered Sports Data Retrieval"
            content="Engage in interactive chat for all your sports inquiries and needs."
          />
          <div className="p-12 rounded-lg bg-w-800">
            <div className="text-center">
              <Animate delay="3">
                <Image
                  src="/img/about-ico.svg"
                  alt="about ico"
                  width={48}
                  height={48}
                  className="mx-auto"
                />
              </Animate>
              <Animate delay="4">
                <h2 className="mt-4 mb-2 text-2xl font-normal font-dm-serif text-b-400">
                  CORNER LEAGUE AI
                </h2>
              </Animate>
              <Animate delay="5">
                <p className="text-base font-normal font-dm-sans text-w-700">
                  Here are a few suggested questions you might consider asking.
                </p>
              </Animate>
            </div>
            <div className="mt-[50px] md:mt-[142px] md:max-w-[900px] md:mx-auto">
              <ul className="grid gap-2 md:grid-cols-2">
                <Animate delay="6">
                  <li className="p-4 text-base font-normal border rounded-lg text-w-600 font-dm-sans border-w-900">
                    Which team leads in points per game?
                  </li>
                </Animate>
                <Animate delay="7">
                  <li className="p-4 text-base font-normal border rounded-lg text-w-600 font-dm-sans border-w-900">
                    What are the statistics of the top scorer?
                  </li>
                </Animate>
                <Animate delay="8">
                  <li className="p-4 text-base font-normal border rounded-lg text-w-600 font-dm-sans border-w-900">
                    Who stands out as the top player this month?
                  </li>
                </Animate>
                <Animate delay="9">
                  <li className="p-4 text-base font-normal border rounded-lg text-w-600 font-dm-sans border-w-900">
                    Who holds the highest batting average among players?
                  </li>
                </Animate>
              </ul>
              <Animate delay="10">
                <div className="relative mt-6">
                  <input
                    type="text"
                    className="w-full p-5 rounded-lg outline-none placeholder:text-w-500 focus:border-b-400 bg-body"
                    placeholder="Type Message..."
                  />
                  <div className="absolute flex items-center gap-5 -translate-y-1/2 right-4 top-1/2">
                    <Image
                      src="/img/about-form-attach.svg"
                      width={11.65}
                      height={19}
                      alt="attach"
                      className="cursor-pointer"
                    />
                    <Image
                      src="/img/about-form-send.svg"
                      width={17.21}
                      height={14.5}
                      alt="attach"
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </Animate>
            </div>
          </div>
        </div>
      </div>
      <Newsletter />
      <DarkModeToggle />
    </>
  );
}
