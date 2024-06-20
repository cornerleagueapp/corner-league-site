import Image from 'next/image';
import Link from 'next/link';
export default function Header() {
  return (
    <header className="absolute w-full border-b border-w-100 border-opacity-20">
      <div className="container p-5 md:mx-auto">
        <div className="flex items-center justify-between ">
          <Link href="/">
            <Image src="/img/cl-logo.jpg" alt="logo" width={50} height={48} />
          </Link>

          <nav>
            <ul className="flex items-center gap-8">
              <li>
                <Link
                  href="/"
                  className="text-base font-medium text-w-100 font-dm-sans hover:text-w-400 hover:underline"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about-us"
                  className="text-base font-normal text-w-100 font-dm-sans hover:text-w-400 hover:underline"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </nav>
          <a
            href="#newsletter"
            className="hidden px-6 py-2 text-base font-bold md:inline-block rounded-3xl font-dm-sans bg-w-100 text-b-400 hover:bg-w-800"
          >
            Join Waitlist
          </a>
        </div>
      </div>
    </header>
  );
}
