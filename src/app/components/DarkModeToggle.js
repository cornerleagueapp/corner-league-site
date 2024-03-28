'use client';
import { useTheme } from 'next-themes';
import Image from 'next/image';

export default function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  return (
    <div>
      <button
        onClick={toggleTheme}
        className="fixed z-10 flex items-center justify-center w-12 h-12 rounded-full bottom-6 right-6 bg-w-800"
      >
        <Image
          src={`/img/dark.svg`}
          className="theme-dark"
          alt="sun"
          width={22}
          height={22}
        />
        <Image
          src={`/img/light.svg`}
          className="theme-light"
          alt="sun"
          width={22}
          height={22}
        />
      </button>
    </div>
  );
}
