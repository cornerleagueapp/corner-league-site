'use client';
import { useState } from 'react';
import Animate from './Animate';

const Accordion = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Animate delay="3">
      <div className="border border-w-200 rounded-2xl dark:border-b-100">
        <div
          className="flex items-center justify-between p-4 cursor-pointer "
          onClick={toggleAccordion}
        >
          <div className="text-lg font-normal font-dm-sans text-b-400 dark:text-w-300">
            {title}
          </div>
          <div className="text-3xl font-normal font-dm-sans text-b-400 dark:text-w-300">
            {isOpen ? '-' : '+'}
          </div>
        </div>
        {isOpen && (
          <div className="p-4 pt-0 font-normal font-dm-sans text-w-700 dark:text-w-300">
            {content}
          </div>
        )}
      </div>
    </Animate>
  );
};

export default Accordion;
