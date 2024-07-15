'use client';
import { useEffect } from 'react';
import '@glidejs/glide/src/assets/sass/glide.core.scss';
import '@glidejs/glide/src/assets/sass/glide.theme.scss';
import Glide from '@glidejs/glide';

import SectionTitle from './SectionTitle';
import NewsSliderItem from './NewsSliderItem';
export default function NewsSlider() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const glideMulti1 = new Glide('.glide', {
        type: 'carousel',
        autoplay: 3500,
        peek: 84,
        perView: 4,
        hoverpause: true,
        gap: 24,
        breakpoints: {
          1920: {
            perView: 3,
          },
          1440: {
            perView: 2,
          },
          768: {
            perView: 1,
            peek: 0,
          },
        },
      });

      glideMulti1.mount();
    }
  }, []);
  return (
    <div className="px-5 py-16 md:px-0 md:py-24 bg-w-100 dark:bg-b-200">
      <SectionTitle
        title="Which Sports Are Supported"
        content="We aim to encompass every sport imaginable!"
      />
      <div className="glide">
        <div className="glide__track" data-glide-el="track">
          <ul className="glide__slides">
            <NewsSliderItem
              title="Baseball"
              content="Swing for the fences, throw heat - playing the long game to round the bases and chalk up runs."
              img="baseball"
            />
            <NewsSliderItem
              title="Basketball"
              content="Combining skill, teamwork, and strategy - ballin' out in a showcase of hoops, alley-oops, and ankle breakers."
              img="basketball"
            />
            <NewsSliderItem
              title="Boxing"
              content="Trading jabs and uppercuts in the squared circle - aiming to land that knockout punch."
              img="boxing"
            />
            <NewsSliderItem
              title="College"
              content="Student-athletes hustle, grind, and showcase their skills on the field, court, or track - chasing glory and rivalry wins."
              img="college"
            />
            <NewsSliderItem
              title="cricket"
              content="Spinning magic with the ball - the gentleman's game of tactical duel."
              img="cricket"
            />
            <NewsSliderItem
              title="Football"
              content="High-level execution on the gridiron - the hard-hitting spectacle of strategy and athleticism."
              img="football"
            />
            <NewsSliderItem
              title="golf"
              content="Avoiding the rough - a serene yet strategic quest to conquer the course."
              img="golf"
            />
            <NewsSliderItem
              title="hockey"
              content="Blazing across the ice - battling it out in the chilly arena to light the lamp."
              img="hockey"
            />
            <NewsSliderItem
              title="Horse Racing"
              content="Thoroughbreds thundering down the track - an exhilarating dash of speed and stamina."
              img="horse-racing"
            />
            <NewsSliderItem
              title="MMA"
              content="Throwing down in the cage - clash of martial arts mastery and sheer grit.
"
              img="mma"
            />
            <NewsSliderItem
              title="nascar"
              content="Racing at breakneck speeds - a high-octane dance of strategy, skill, and sheer nerve."
              img="nascar"
            />
            <NewsSliderItem
              title="Olympics"
              content="Athletes from around the globe - vying for gold and etching their names in the annals of history."
              img="olympics"
            />
            <NewsSliderItem
              title="Soccer"
              content="Fancy footwork, threading passes and netting goals - a global dance of teamwork, strategy, and the relentless pursuit of scoring."
              img="soccer"
            />
            <NewsSliderItem
              title="Tennis"
              content="Serve up aces - intense matches of skill and strategy."
              img="tennis"
            />
            <NewsSliderItem
              title="X-games"
              content="Fearless stunts, grinding rails, and catching air - high-flying display of extreme sports mastery."
              img="x-games"
            />
          </ul>
        </div>
      </div>
    </div>
  );
}
