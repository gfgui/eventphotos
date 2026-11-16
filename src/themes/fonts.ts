import localFont from "next/font/local";

// The display and body fonts of the themes. Bundled with the app, like Inter, because local
// mode must work without internet access. None is preloaded: a phone only downloads the fonts
// of the theme it shows. Each theme picks its fonts by these variables, in src/themes/<id>.css.

const newsreader = localFont({
  src: "../fonts/newsreader-latin-opsz-normal.woff2",
  variable: "--font-newsreader",
  weight: "200 800",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});

const cormorantGaramond = localFont({
  src: [
    {
      path: "../fonts/cormorant-garamond-latin-wght-normal.woff2",
      style: "normal",
    },
    {
      path: "../fonts/cormorant-garamond-latin-wght-italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-cormorant-garamond",
  weight: "300 700",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});

const jost = localFont({
  src: "../fonts/jost-latin-wght-normal.woff2",
  variable: "--font-jost",
  weight: "100 900",
  display: "swap",
  preload: false,
});

const fraunces = localFont({
  src: "../fonts/fraunces-latin-opsz-normal.woff2",
  variable: "--font-fraunces",
  weight: "100 900",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});

const nunitoSans = localFont({
  src: "../fonts/nunito-sans-latin-wght-normal.woff2",
  variable: "--font-nunito-sans",
  weight: "200 1000",
  display: "swap",
  preload: false,
});

// The app's own font, under a name of its own: some themes change --font-sans, and a host who
// picks Inter for the titles means Inter. Same file as in the layout, so it downloads once.
const inter = localFont({
  src: "../fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
  preload: false,
});

/** Classes for <html> that define every font variable above. */
export const themeFontVariables = [
  newsreader,
  cormorantGaramond,
  jost,
  fraunces,
  nunitoSans,
  inter,
]
  .map((font) => font.variable)
  .join(" ");
