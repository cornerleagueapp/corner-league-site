'use client';

import { useState } from 'react';
import SectionTitle from './SectionTitle';
import Animate from './Animate';

export default function Newsletter() {
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = input;

    if (!email) return;

    const res = await fetch('/api/addSubscription', {
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const data = await res.json();

    if (data.error) {
      setMessage('Hey, you are already subscribed!');
    } else {
      setMessage(
        `We've added you to our Waitlist. We'll let you know when we launch!`
      );
    }
    setShowMessage(true);
    // Clear the message after 8 seconds
    setTimeout(() => {
      setShowMessage(false);
      setMessage('');
    }, 5000);
  };

  return (
    <>
      <div className="dark:bg-b-300 bg-body" id="newsletter">
        <div className="container px-5 py-16 mx-auto md:py-24">
          <SectionTitle
            title="Sign Up for Our Waitlist"
            content="Join our Waitlist to be notified when our platform becomes available."
          />
          <Animate delay="3">
            <form onSubmit={handleSubmit}>
              <div className="relative md:max-w-xl md:mx-auto">
                <input
                  type="email"
                  placeholder="Your e-mail address"
                  className="w-full px-6 py-5 border rounded-full outline-none border-w-200 focus:border-b-400 placeholder:text-w-500 dark:bg-b-300 dark:border-b-100 dark:placeholder:text-w-700"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  required
                />
                <button
                  disabled={!input}
                  type="submit"
                  className="absolute px-8 py-3 rounded-full right-3 bg-b-400 text-w-100 top-[50%] translate-y-[-50%] font-dm-sans font-bold hover:bg-w-800 hover:text-b-400 dark:bg-w-100 dark:text-b-300 dark:hover:bg-w-800"
                >
                  Get Started
                </button>
              </div>
            </form>
            {showMessage && (
              <p
                className={`p-2 px-4 mt-8 text-sm font-normal text-center font-dm-sans text-w-300 bg-b-200 rounded-xl md:max-w-max md:mx-auto transition-all duration-2000 ease-in-out ${
                  showMessage ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {message}
              </p>
            )}
          </Animate>
        </div>
      </div>
    </>
  );
}
