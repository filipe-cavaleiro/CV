import localFont from "next/font/local";

export const serif = localFont({
  variable: "--font-serif",
  display: "swap",
  src: [
    { path: "../fonts/newsreader-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/newsreader-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/newsreader-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/newsreader-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
});

export const sans = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    { path: "../fonts/instrument-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/instrument-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/instrument-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
});

export const mono = localFont({
  variable: "--font-mono",
  display: "swap",
  src: [
    { path: "../fonts/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
});

export const fontVars = `${serif.variable} ${sans.variable} ${mono.variable}`;
