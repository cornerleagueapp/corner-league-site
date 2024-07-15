"use client";
import React, { useState } from "react";
import Accordion from "../components/Accordion";
import SectionTitle from "./SectionTitle";

const AccordionArea = () => {
  const [openAccordion, setOpenAccordion] = useState(null);

  return (
    <div className="px-5 py-16 md:py-24 bg-w-100 dark:bg-b-200">
      <div className="container mx-auto md:max-w-2xl">
        <SectionTitle
          title="Everything You Need to Know"
          content="Explore our answers to commonly asked questions."
        />
        <Accordion
          id={1}
          title="When do you launch?"
          content="We are still in development and we plan to launch soon! Join the waitlist to get updates and more."
          open={openAccordion === 1}
          setOpen={() => setOpenAccordion(1)}
        />
        <Accordion
          id={2}
          title="Will it cost?"
          content="Absolutely not! It is free to download and will give you the opportunities to create and monetize your own content."
          open={openAccordion === 2}
          setOpen={() => setOpenAccordion(2)}
        />
        <Accordion
          id={3}
          title="How can I download the app?"
          content="The app will be available for download through the Apple Store and Google Play Store"
          open={openAccordion === 3}
          setOpen={() => setOpenAccordion(3)}
        />
      </div>
    </div>
  );
};

export default AccordionArea;
