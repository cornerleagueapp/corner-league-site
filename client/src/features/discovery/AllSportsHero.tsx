import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import logo from '@/assets/CL_Logo.png';
import sportsPhoto from '@/assets/all-sports-hero.webp';
import { SportIcon } from '@/components/navigation/SportIcon';
import './hero.css';

export function AllSportsHero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    const visibility = () => setVisible(!document.hidden);
    update(); visibility();
    media.addEventListener('change', update);
    document.addEventListener('visibilitychange', visibility);
    return () => { media.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (paused || hovered || focused || !visible || reduced) return;
    const timer = window.setInterval(() => setActive(value => (value + 1) % 2), 15000);
    return () => window.clearInterval(timer);
  }, [paused, hovered, focused, visible, reduced, active]);
  return <section className="all-sports-hero" aria-label="Welcome to Corner League" aria-roledescription="carousel"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false); }}>
    <div className="hero-stage">
      <div className="hero-slide hero-community" data-active={active === 0} aria-hidden={active !== 0} role="group" aria-roledescription="slide" aria-label="1 of 2: Community spotlight">
        <div className="hero-court" aria-hidden="true"/>
        <img className="hero-logo" src={logo} alt="" width="88" height="76"/>
        <span className="hero-wordmark">Corner League</span>
        <div className="hero-heading" aria-hidden="true"><span>All sports.</span><span>One community.</span></div>
        <p>Discover athletes, follow organizations, find events, and catch the latest stories.</p>
        <div className="hero-sports" aria-hidden="true">{['jet-ski','basketball','american-football','baseball','golf','soccer','motocross'].map(sport => <SportIcon key={sport} sport={sport}/>)}</div>
      </div>
      <div className="hero-slide hero-across" data-active={active === 1} aria-hidden={active !== 1} role="group" aria-roledescription="slide" aria-label="2 of 2: Across every sport">
        <div className="hero-across-copy"><div className="hero-brand"><img className="hero-logo" src={logo} alt="" width="88" height="76"/><span className="hero-wordmark">Corner League</span></div>
          <div className="hero-heading" aria-hidden="true"><span>All sports.</span><span>One community.</span></div>
          <p>Your next event. Your favorite athletes. Your community—all in one place.</p>
        </div>
        <div className="hero-photo-panels" role="img" aria-label="Jet ski racing, basketball, and soccer">
          {[0, 1, 2].map(panel => <div className={`hero-photo-panel hero-photo-panel-${panel}`} key={panel} aria-hidden="true">
            <img src={sportsPhoto} alt="" width="1536" height="1024" decoding="async"/>
          </div>)}
        </div>
      </div>
    </div>
    <h1 className="sr-only">All sports. One community.</h1>
    <div className="hero-actions"><a href="#all-sports-directory" onClick={() => document.getElementById('all-sports-directory')?.focus({preventScroll:true})}>Explore sports <span aria-hidden="true">→</span></a><Link href="/search_results?kind=organizations">Find an organization</Link></div>
    <div className="hero-controls">
      <button type="button" aria-label="Previous hero slide" onClick={() => setActive(value => 1-value)}>‹</button>
      {[0,1].map(index => <button key={index} className="hero-dot" type="button" aria-label={index===0?'Show Community spotlight':'Show Across every sport'} aria-pressed={active===index} onClick={() => setActive(index)}><span/></button>)}
      <button type="button" aria-label="Next hero slide" onClick={() => setActive(value => 1-value)}>›</button>
      {!reduced && <button className="hero-pause" type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused?'Play':'Pause'}</button>}
      <span className="sr-only" aria-live={paused||focused?'polite':'off'}>Slide {active+1} of 2</span>
    </div>
  </section>;
}
