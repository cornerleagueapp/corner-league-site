"use client";
import { useState } from "react";
import Image from "next/image";

import SectionTitle from "./SectionTitle";
import Animate from "./Animate";
export default function Feature() {
  const [activeTab, setActiveTab] = useState("live");
  const getImageSource = () => {
    switch (activeTab) {
      case "live":
        return "/img/fea-chat.png";
      case "groups":
        return "/img/fea-chat.png";
      case "chat":
        return "/img/fea-chat.png";
      default:
        return "/img/fea-chat.png";
    }
  };
  return (
    <div className="py-16 md:py-24 bg-w-100 dark:bg-b-200">
      <div className="container px-5 mx-auto">
        <SectionTitle
          title="Core Features Highlight"
          content="Get live updates, customize user groups, and access AI chat for
            instant sports info."
        />
        <div className="flex flex-col items-center gap-6 lg:flex-row">
          <div className="flex flex-col w-full gap-6 lg:w-1/2">
            <div
              onClick={() => setActiveTab("live")}
              className={`flex items-start gap-6 p-6 rounded-2xl cursor-pointer ${
                activeTab === "live" ? "bg-white dark:bg-b-300" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-center w-12 h-12 text-white rounded-full bg-b-400 dark:bg-w-100 dark:text-b-400">
                  <svg
                    width="20"
                    height="18"
                    viewBox="0 0 20 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13.2881 12.8457C13.0497 12.8457 12.849 12.7643 12.6862 12.6015C12.5234 12.4387 12.442 12.238 12.442 11.9996V7.99959C12.442 7.76114 12.5234 7.56049 12.6862 7.39766C12.849 7.23484 13.0497 7.15344 13.2881 7.15344H15.7881C16.0266 7.15344 16.2272 7.23484 16.39 7.39766C16.5529 7.56049 16.6343 7.76114 16.6343 7.99959V11.9996C16.6343 12.238 16.5529 12.4387 16.39 12.6015C16.2272 12.7643 16.0266 12.8457 15.7881 12.8457H13.2881ZM13.6343 11.6534H15.442V8.34574H13.6343V11.6534ZM3.36507 12.8457V10.4419C3.36507 10.2034 3.45289 9.99639 3.62854 9.82074C3.80418 9.6451 4.01123 9.55729 4.24969 9.55729H6.36507V8.34574H3.36507V7.15344H6.71122C6.94969 7.15344 7.15033 7.23484 7.31314 7.39766C7.47596 7.56049 7.55737 7.76114 7.55737 7.99959V9.55729C7.55737 9.79574 7.46954 10.0028 7.29389 10.1784C7.11826 10.3541 6.91122 10.4419 6.67277 10.4419H4.55737V11.6534H7.55737V12.8457H3.36507ZM9.40352 8.93226V7.73999H10.5958V8.93226H9.40352ZM9.40352 12.3169V11.1246H10.5958V12.3169H9.40352ZM2.28814 17.3938C1.78303 17.3938 1.35547 17.2188 1.00547 16.8688C0.655469 16.5188 0.480469 16.0912 0.480469 15.5861V4.47079C0.480469 3.96565 0.655469 3.53809 1.00547 3.18809C1.35547 2.83809 1.78303 2.66309 2.28814 2.66309H5.24969V0.663086H6.74964V2.66309H13.2497V0.663086H14.7496V2.66309H17.7112C18.2163 2.66309 18.6439 2.83809 18.9939 3.18809C19.3439 3.53809 19.5189 3.96565 19.5189 4.47079V15.5861C19.5189 16.0912 19.3439 16.5188 18.9939 16.8688C18.6439 17.2188 18.2163 17.3938 17.7112 17.3938H2.28814ZM2.28814 15.8938H9.40352V14.5092H10.5958V15.8938H17.7112C17.7881 15.8938 17.8586 15.8618 17.9227 15.7976C17.9868 15.7335 18.0189 15.663 18.0189 15.5861V4.47079C18.0189 4.39385 17.9868 4.32333 17.9227 4.25921C17.8586 4.19511 17.7881 4.16306 17.7112 4.16306H10.5958V5.54766H9.40352V4.16306H2.28814C2.21123 4.16306 2.14071 4.19511 2.07659 4.25921C2.01249 4.32333 1.98044 4.39385 1.98044 4.47079V15.5861C1.98044 15.663 2.01249 15.7335 2.07659 15.7976C2.14071 15.8618 2.21123 15.8938 2.28814 15.8938Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="mb-4 text-2xl font-normal font-dm-serif text-b-400 dark:text-w-100">
                  Live Scoring and News Updates
                </h3>
                <p className="text-base font-normal font-dm-sans text-w-700 dark:text-w-300">
                  Stay engaged and informed with live updates on games, player
                  stats, scoring, trade news, injuries, and more.
                </p>
              </div>
            </div>
            <div
              onClick={() => setActiveTab("groups")}
              className={`flex items-start gap-6 p-6 rounded-2xl cursor-pointer ${
                activeTab === "groups" ? "bg-white dark:bg-b-300" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-center w-12 h-12 text-white rounded-full bg-b-400 dark:bg-w-100 dark:text-b-400">
                  <svg
                    width="24"
                    height="11"
                    viewBox="0 0 24 11"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0.500025 10.7885V9.56931C0.500025 8.90393 0.847458 8.35745 1.54233 7.92989C2.23719 7.50232 3.14295 7.28854 4.2596 7.28854C4.44422 7.28854 4.63012 7.29431 4.8173 7.30586C5.00448 7.31739 5.19294 7.33983 5.38268 7.37316C5.18781 7.68469 5.04326 8.00809 4.94903 8.34334C4.85481 8.67859 4.8077 9.02249 4.8077 9.37506V10.7885H0.5H0.500025ZM6.5 10.7885V9.41354C6.5 8.94535 6.63142 8.51741 6.89425 8.12971C7.15707 7.74201 7.53591 7.40393 8.03077 7.11546C8.52564 6.82701 9.11025 6.61067 9.7846 6.46644C10.459 6.3222 11.1961 6.25009 11.9961 6.25009C12.8115 6.25009 13.5564 6.3222 14.2307 6.46644C14.9051 6.61067 15.4897 6.82701 15.9846 7.11546C16.4794 7.40393 16.8557 7.74201 17.1134 8.12971C17.3711 8.51741 17.5 8.94535 17.5 9.41354V10.7885H6.5ZM19.1923 10.7885V9.37794C19.1923 9.00179 19.1477 8.64734 19.0586 8.31459C18.9695 7.98184 18.8359 7.66803 18.6577 7.37316C18.8538 7.33983 19.0413 7.31739 19.2202 7.30586C19.399 7.29431 19.5756 7.28854 19.75 7.28854C20.8666 7.28854 21.7708 7.49975 22.4625 7.92219C23.1541 8.34462 23.5 8.89366 23.5 9.56931V10.7885H19.1923ZM8.0769 9.28854H15.9385V9.18276C15.8359 8.77891 15.4102 8.43917 14.6615 8.16354C13.9128 7.88789 13.0256 7.75006 12 7.75006C10.9743 7.75006 10.0871 7.88789 9.33842 8.16354C8.58971 8.43917 8.1692 8.77891 8.0769 9.18276V9.28854ZM4.25705 6.31739C3.78568 6.31739 3.38302 6.1498 3.04905 5.81464C2.71508 5.47947 2.5481 5.07655 2.5481 4.60589C2.5481 4.12897 2.71568 3.72609 3.05085 3.39724C3.38602 3.06839 3.78893 2.90396 4.2596 2.90396C4.73652 2.90396 5.141 3.06839 5.47305 3.39724C5.8051 3.72609 5.97113 4.12992 5.97113 4.60874C5.97113 5.07349 5.80686 5.47445 5.47832 5.81164C5.14979 6.1488 4.7427 6.31739 4.25705 6.31739ZM19.75 6.31739C19.2833 6.31739 18.8814 6.1488 18.5442 5.81164C18.207 5.47445 18.0385 5.07349 18.0385 4.60874C18.0385 4.12992 18.207 3.72609 18.5442 3.39724C18.8814 3.06839 19.2839 2.90396 19.7518 2.90396C20.2339 2.90396 20.6394 3.06839 20.9682 3.39724C21.2971 3.72609 21.4615 4.12897 21.4615 4.60589C21.4615 5.07655 21.2975 5.47947 20.9694 5.81464C20.6414 6.1498 20.2349 6.31739 19.75 6.31739ZM12.0034 5.50009C11.2832 5.50009 10.6699 5.24769 10.1635 4.74289C9.65705 4.23809 9.40385 3.62511 9.40385 2.90396C9.40385 2.16839 9.65625 1.55182 10.161 1.05424C10.6658 0.556653 11.2788 0.307861 12 0.307861C12.7355 0.307861 13.3521 0.556327 13.8497 1.05326C14.3473 1.55019 14.5961 2.16597 14.5961 2.90059C14.5961 3.62079 14.3476 4.23409 13.8507 4.74049C13.3538 5.24689 12.738 5.50009 12.0034 5.50009ZM12.0048 4.00014C12.3106 4.00014 12.5689 3.89309 12.7798 3.67899C12.9907 3.46487 13.0961 3.20493 13.0961 2.89916C13.0961 2.59339 12.9911 2.33506 12.781 2.12416C12.5709 1.91326 12.3106 1.80781 12 1.80781C11.6974 1.80781 11.4391 1.91286 11.225 2.12296C11.0109 2.33306 10.9038 2.59339 10.9038 2.90396C10.9038 3.20653 11.0109 3.46487 11.225 3.67899C11.4391 3.89309 11.699 4.00014 12.0048 4.00014Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="mb-4 text-2xl font-normal font-dm-serif text-b-400 dark:text-w-100">
                  Personalized User Groups
                </h3>
                <p className="text-base font-normal font-dm-sans text-w-700 dark:text-w-300">
                  Create custom sports news and content groups where you can get
                  updated scores and news that is tailored to you and your
                  communities preference and engage with them within your group
                  chat.
                </p>
              </div>
            </div>
            <div
              onClick={() => setActiveTab("chat")}
              className={`flex items-start gap-6 p-6 rounded-2xl cursor-pointer ${
                activeTab === "chat" ? "bg-white dark:bg-b-300" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-center w-12 h-12 text-white rounded-full bg-b-400 dark:bg-w-100 dark:text-b-400">
                  <svg
                    width="20"
                    height="19"
                    viewBox="0 0 20 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.11543 15.1153C4.86478 15.1153 4.65468 15.0305 4.48513 14.861C4.31558 14.6914 4.23081 14.4813 4.23081 14.2307V12.7307H16.6058L16.9231 13.0481V3.99998H18.4231C18.6737 3.99998 18.8838 4.08475 19.0534 4.2543C19.2229 4.42385 19.3077 4.63394 19.3077 4.88457V18.6537L15.7693 15.1153H5.11543ZM0.692383 14.2691V1.38463C0.692383 1.13398 0.777158 0.923876 0.946708 0.754326C1.11626 0.584776 1.32636 0.5 1.57701 0.5H14.0385C14.2891 0.5 14.4992 0.584776 14.6688 0.754326C14.8383 0.923876 14.9231 1.13398 14.9231 1.38463V9.84613C14.9231 10.0968 14.8383 10.3069 14.6688 10.4764C14.4992 10.646 14.2891 10.7307 14.0385 10.7307H4.23081L0.692383 14.2691ZM13.4231 9.23075V1.99998H2.19236V9.92313L2.88471 9.23075H13.4231Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="mb-4 text-2xl font-normal font-dm-serif text-b-400 dark:text-w-100">
                  AI-Powered Chat
                </h3>
                <p className="text-base font-normal font-dm-sans text-w-700 dark:text-w-300">
                  Users can utilize AI for seamless access to statistics,
                  scores, news updates, and enhancing their overall experience.
                </p>
              </div>
            </div>
          </div>
          <div className="w-full p-12 pb-0 overflow-hidden rounded-2xl lg:w-1/2 bg-w-800">
            <Animate delay="3">
              <Image
                src="/img/fea-light.jpg"
                alt="logo"
                className="block w-full dark:hidden rounded-t-2xl"
                width={504}
                height={516}
              />
              <Image
                src="/img/fea-dark.jpg"
                alt="logo"
                className="hidden w-full dark:block rounded-t-2xl"
                width={504}
                height={516}
              />
            </Animate>
          </div>
        </div>
      </div>
    </div>
  );
}
