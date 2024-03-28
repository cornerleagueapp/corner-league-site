'use client';
import Image from 'next/image';
import SectionTitle from './SectionTitle';
import Animate from './Animate';
export default function AIChat() {
  return (
    <div className="px-5 py-16 md:py-24 bg-w-100 dark:bg-b-200">
      <div className="container md:mx-auto">
        <SectionTitle
          title="AI-Powered Chatbot Assistant"
          content="Hook your audience with Fantasy Sports, fostering long-term fan
              engagement."
        />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="overflow-hidden bg-w-800 rounded-2xl md:grid md:justify-between">
            <div className="p-12 text-center">
              <Animate delay="2">
                <h2 className="flex items-center justify-center text-3xl font-medium font-dm-serif text-b-400">
                  Sports-Focused Language Model
                </h2>
              </Animate>
              <Animate delay="3">
                <p className="mt-4 text-base font-normal text-center font-dm-sans text-w-700 md:text-xl">
                  A language model designed to provide comprehensive sports data
                  analytics, statistics, historical information, and beyond,
                  tailored to your needs.
                </p>
              </Animate>
            </div>
            <div className="px-12">
              <Animate delay="4">
                <Image
                  src="/img/power-sports.jpg"
                  alt="chat-assistant"
                  className="w-full rounded-t-2xl"
                  width={504}
                  height={326}
                />
              </Animate>
            </div>
          </div>
          <div className="overflow-hidden bg-w-800 rounded-2xl md:grid md:justify-between">
            <div className="p-12 text-center">
              <Animate delay="2">
                <h2 className="flex items-center justify-center text-3xl font-normal font-dm-serif text-b-400">
                  AI-Enhanced Sports Dataset
                </h2>
              </Animate>
              <Animate delay="3">
                <p className="mt-4 text-base font-normal text-center font-dm-sans text-w-700 md:text-xl">
                  AI assists in generating data content by providing optimized
                  graphs, tables, and other data layouts, enhancing your sports
                  content creation process.
                </p>
              </Animate>
            </div>
            <div className="px-12">
              <Animate delay="4">
                <Image
                  src="/img/power-ai.jpg"
                  alt="chat-assistant"
                  className="w-full rounded-t-2xl"
                  width={504}
                  height={326}
                />
              </Animate>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
