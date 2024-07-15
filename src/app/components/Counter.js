"use client";
import CountUp from "react-countup";
import SectionTitle from "./SectionTitle";

const Counter = () => {
  return (
    <div className="container px-5 py-16 mx-auto text-center md:py-24 lg:mb-44">
      <SectionTitle
        title=" Analyzing the Numbers"
        content="Let's delve into the data and see what the numbers reveal."
      />
      <div className="grid grid-cols-1 gap-5 text-center lg:grid-cols-4 md:grid-cols-2 lg:text-start md:text-center">
        <div>
          <h3 className="mb-6 text-6xl font-normal lg:text-7xl xl:text-8xl font-dm-serif dark:text-w-100">
            + <CountUp scrollSpyOnce enableScrollSpy={true} end={99} />M
          </h3>
          <span className="text-xl font-normal font-dm-sans text-w-700 dark:text-w-300">
            Engaged Sports Enthusiasts
          </span>
        </div>
        <div className="lg:translate-y-[170px] md:translate-y-[0] sm:translate-y-[0]  md:mb-0 mb-0">
          <h3 className="mb-6 text-6xl font-normal lg:text-7xl xl:text-8xl font-dm-serif md:block lg:mt-0 md:mt-0 dark:text-w-100">
            + <CountUp scrollSpyOnce enableScrollSpy={true} end={10} />K
          </h3>
          <span className="text-xl font-normal font-dm-sans text-w-700 dark:text-w-300">
            Sports Broadcasting Platforms
          </span>
        </div>

        <div>
          <h3 className="mb-6 text-6xl font-normal lg:text-7xl xl:text-8xl font-dm-serif dark:text-w-100">
            + <CountUp scrollSpyOnce enableScrollSpy={true} end={40} />
          </h3>
          <span className="text-xl font-normal font-dm-sans text-w-700 dark:text-w-300">
            Diverse Sporting Disciplines
          </span>
        </div>
        <div className="lg:translate-y-[170px] md:translate-y-[0] sm:translate-y-[0]  md:mb-0 mb-0">
          <h3 className="mb-6 text-6xl font-normal lg:text-7xl xl:text-8xl font-dm-serif md:block lg:mt-0 md:mt-0 dark:text-w-100">
            + <CountUp scrollSpyOnce enableScrollSpy={true} end={10} />M
          </h3>
          <span className="text-xl font-normal font-dm-sans text-w-700 dark:text-w-300">
            Daily Sports Content Uploads
          </span>
        </div>
      </div>
    </div>
  );
};

export default Counter;
