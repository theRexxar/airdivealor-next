import { Inter, Playfair_Display, Roboto } from "next/font/google";
import localFont from "next/font/local";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600"], variable: "--ff-playfair", display: "swap" });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--ff-roboto", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--ff-inter", display: "swap" });
// The design system's Lucide icon font: one glyph per icon, drawn in currentColor.
const lucide = localFont({ src: "./fonts/lucide.woff2", variable: "--ff-lucide", display: "block", preload: false });

/** Font variables for the <html> element of each root layout (website and CMS). */
export const fontClasses = `${playfair.variable} ${roboto.variable} ${inter.variable} ${lucide.variable}`;
