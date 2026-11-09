export const ROUTES = {
  home: "/",
  diveSites: "/dive-sites",
  facilities: "/facilities-and-rates",
  courses: "/dive-courses",
  about: "/about-us",
  blog: "/blog",
  book: "/#b-book",
  prices: "/#b-prices",
  faq: "/#b-faq",
  /** All questions, with a page for those that need a longer answer. */
  faqPages: "/faq",
} as const;

export const WA_DEFAULT = "hi! airdive i'would like to check diving slot";
export const waLink = (msg: string = WA_DEFAULT) =>
  `https://api.whatsapp.com/send/?phone=6281395505313&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`;

export const SOCIAL = {
  instagram: "https://www.instagram.com/air.dive/",
  facebook: "https://www.facebook.com/airdivealor",
  youtube: "https://www.youtube.com/channel/UCohArteebJ5YhEMnfE8rq-w",
  tripadvisor: "https://www.tripadvisor.com/Attraction_Review-g1600794-d12343022-Reviews-Air_Dive_Alor-Alor_Island_East_Nusa_Tenggara.html",
  airdivex: "https://www.airdivex.com/",
} as const;
