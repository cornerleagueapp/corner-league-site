import { ThemeProvider } from "./components/ThemeProvider";
import { DM_Sans, DM_Serif_Display } from "next/font/google";

import "./globals.css";
import Footer from "./components/Footer";

export const metadata = {
  title: "Corner League",
  description: "The Center of All Things Sports",
};

export const dm_sans_init = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const dm_serif_init = DM_Serif_Display({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-dm-serif",
});
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dm_sans_init.variable} ${dm_serif_init.variable}`}>
        <link rel="icon" href="/img/favicon.ico" sizes="any" />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Footer />
      </body>
    </html>
  );
}
