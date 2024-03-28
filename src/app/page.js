import NewsSlider from './components/NewsSlider';
import Feature from './components/Feature';
import Counter from './components/Counter';
import JoinClub from './components/JoinClub';
import AccordionArea from './components/AccordionArea';
import Newsletter from './components/Newsletter';
import Hero from './components/Hero';
import AppPreview from './components/AppPreview';
import AIChat from './components/AIChat';
import Blog from './components/Blog';
import DarkModeToggle from './components/DarkModeToggle';
import Header from './components/Header';

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <AppPreview />
      <NewsSlider />
      <Counter />
      <AIChat />
      <Blog />
      <Feature />
      <JoinClub />
      <AccordionArea />
      <Newsletter />
      <DarkModeToggle />
    </>
  );
}
