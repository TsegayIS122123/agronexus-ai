import { AUTH_TRANSLATIONS } from './auth';

/**
 * Languages the product currently offers.
 *
 * Amharic is the working language of the intended audience, so it is a first-class
 * locale rather than a future promise: every key defined here has an Amharic
 * translation and `tests/i18n-parity.test.ts` fails the build if one is missing.
 *
 * Earlier drafts also carried Oromo and Tigrinya. Those were removed to keep the
 * interface to the two languages actually being maintained. Re-adding a language
 * means adding it to this union, to LOCALE_LABELS, LOCALE_NAMES and
 * SUPPORTED_LOCALES, and to BASE_TRANSLATIONS in this file plus AUTH_TRANSLATIONS
 * in ./auth — the parity test then reports every key still needing a translation.
 */
export type Locale = 'en' | 'am';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  am: 'አማርኛ',
};

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  am: 'Amharic',
};

export const DEFAULT_LOCALE: Locale = 'en';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'am'];

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  const candidate = value.toLowerCase().slice(0, 2);
  if (isSupportedLocale(candidate as Locale)) return candidate as Locale;
  return DEFAULT_LOCALE;
}

const BASE_TRANSLATIONS: Record<Locale, Record<string, string> | undefined> = {
  en: {
    appName: 'AgroNexus AI',
    tagline: 'AI Operating System for Ethiopia\'s Agricultural Value Chain',
    taglineShort: 'From Soil to Shelf — Powered by AI',
    skipToContent: 'Skip to main content',
    home: 'Home',
    about: 'About',
    solutions: 'Solutions',
    marketplace: 'Marketplace',
    contact: 'Contact',
    signIn: 'Sign in',
    signUp: 'Sign up',
    dashboard: 'Dashboard',
    logout: 'Log out',
    welcome: 'Welcome, {name}',
    solutionsForFarmers: 'For Farmers',
    solutionsForProcessors: 'For Processors',
    solutionsForConsumers: 'For Consumers',
    languages: 'Languages',
    quickLinks: 'Quick Links',
    forUsers: 'For Users',
    connect: 'Connect',
    agricultureToIndustry: 'Connecting Ethiopian Agriculture to Industry',
    description:
      'AI-powered platform for disease detection, price prediction, and direct market access for farmers, processors, and consumers.',
    howItWorks: 'How AgroNexus AI Works',
    step1: '1. Farmers Grow',
    step1Desc: 'Farmers grow crops and use AI to detect diseases, predict prices, and get expert advice.',
    step2: '2. Processors Transform',
    step2Desc: 'Processors buy raw materials, use AI for quality control, and manufacture finished products.',
    step3: '3. Consumers Access',
    step3Desc: 'Consumers discover and buy local products, supporting Ethiopian agriculture and industry.',
    farmersEmpowered: 'Farmers Empowered',
    processorsEnabled: 'Processors Enabled',
    importSubstitution: 'Import Substitution',
    jobsCreated: 'Jobs Created',
    joinAsFarmer: 'Join as Farmer',
    joinAsProcessor: 'Join as Processor',
    joinAsConsumer: 'Join as Consumer',
    allRightsReserved: 'All rights reserved.',
    searchPlaceholder: 'Search...',
    company: 'Company',
    email: 'Email',
    fullName: 'Full name',
    password: 'Password',
    phone: 'Phone',
    role: 'Role',
    language: 'Language',
    iAmA: 'I am a...',
    createAccount: 'Create Account',
    welcomeBack: 'Welcome back',
    signInSubtitle: 'Sign in to your AgroNexus AI account',
    alreadyHaveAccount: 'Already have an account?',
    signInLink: 'Sign in',
    noAccount: "Don't have an account?",
    createOneNow: 'Create one now',
    creatingAccount: 'Creating account...',
    signingIn: 'Signing in...',
    loading: 'Loading...',
    loadingYourDashboard: 'Loading your dashboard...',
    loadingChat: 'Loading chat...',
    loadingListings: 'Loading listings...',
    loadingOrders: 'Loading orders...',
    noListingsFound: 'No listings found',
    noOrdersFound: 'No orders found',
    beTheFirst: 'Be the first to list a product!',
    startBuyingSelling: 'Start buying or selling on the marketplace',
    browseMarketplace: 'Browse Marketplace',
    backToDashboard: 'Back to Dashboard',
    backToMarketplace: 'Back to Marketplace',
    listingNotFound: 'Listing not found',
  },
  am: {
    appName: 'AgroNexus AI',
    tagline: 'የኢትዮጵያ የግበር ለውጥ እሴት የአርቴፊስያል ኢንተሊጅንስ መድረክ',
    taglineShort: 'ከመሬት እስከ ወረራ — በአርቴፊስያል ኢንተሊጅንስ',
    skipToContent: 'ወደ ዋናው ይዘት ዝለል',
    home: 'መጀመሪያ',
    about: 'ስለ እኛ',
    solutions: 'መፍትሔዎች',
    marketplace: 'የግበር ለውጥ',
    contact: 'አግኙኝ',
    signIn: 'ግባት',
    signUp: 'ተመዝገብ',
    dashboard: 'ዳሽበርድ',
    logout: 'ውጣ',
    welcome: 'እንኳን ደህና መጡ፣ {name}',
    solutionsForFarmers: 'ለሰሃራዎች',
    solutionsForProcessors: 'ለአሽላቶች',
    solutionsForConsumers: 'ለተጠቃሚዎች',
    languages: 'ቋንቋዎች',
    quickLinks: 'ፈጣን አጣቀሮች',
    forUsers: 'ለተጠቃሚዎች',
    connect: 'ያገናኝ',
    agricultureToIndustry: 'የኢትዮጵያን ግበር ከኢንደስትሪያው ጋር የሚያገናኝ',
    description:
      'ለሰሃራዎች፣ አሽላቶችና ተጠቃሚዎች የበሽታ ማለት፣ የዋጋ ትክክለኛ ምልከታና ቀጥተኛ የድረስ ተደራሽነት የሚያቀርብ በአርቴፊስያል ኢንተሊጅንስ መድረክ።',
    howItWorks: 'AgroNexus AI እንዴት ይሠራል',
    step1: '1. ሰሃራዎች ያሳጥራሉ',
    step1Desc:
      'ሰሃራዎች ሰብስ ያሳጥራሉና በአርቴፊስያል የበሽታ ማለትን፣ የዋጋ ትክክለኛ ምልከታንና የባለሙያ ምክር ያግኛሉ።',
    step2: '2. አሽላቶች ያሽረጃራሉ',
    step2Desc:
      'አሽላቶች የጥን ንጽች ይገዛሉ፣ በአርቴፊስያል የጥራት ቁጥጥር ያደርጋሉና ዝርጅት የተጠናቀቁ ምርቶችን ይሠራሉ።',
    step3: '3. ተጠቃሚዎች ይገኛሉ',
    step3Desc:
      'ተጠቃሚዎች የአገር ውስጥ ምርቶችን በመፈለግ ይገዛሉ፤ ይህም የኢትዮጵያን ግበርና ኢንደስትሪያ ይደግፋል።',
    farmersEmpowered: 'ሰሃራዎች ተመርምረዋል',
    processorsEnabled: 'አሽላቶች ተከታታይ ደረጃ ላይ ናቸው',
    importSubstitution: 'የምስም ምትን መተካት',
    jobsCreated: 'የተፈጠሩ ሥራዎች',
    joinAsFarmer: 'እንደ ሰሃራ ይግቡ',
    joinAsProcessor: 'እንደ አሽላት ይግቡ',
    joinAsConsumer: 'እንደ ተጠቃሚ ይግቡ',
    allRightsReserved: 'መብቱ በሕግ የተጠበቀ።',
    searchPlaceholder: 'ይፈልጉ...',
    company: 'ድርጅት',
    email: 'ኢሜይል',
    fullName: 'ሙሉ ስም',
    password: 'የይለፍ ቃል',
    phone: 'ስልክ',
    role: 'ድርሻ',
    language: 'ቋንቋ',
    iAmA: 'እኔ ነኝ...',
    createAccount: 'መለያ ይፍጠሩ',
    welcomeBack: 'እንኳን ደህና መጡ',
    signInSubtitle: 'ወደ AgroNexus AI መለያዎ ይግቡ',
    alreadyHaveAccount: 'መለያ ይዎታል?',
    signInLink: 'ግባት',
    noAccount: 'መለያ የለዎት?',
    createOneNow: 'አሁን ይፍጠሩ',
    creatingAccount: 'መለያ በመፍጠር ላይ...',
    signingIn: 'በመግባት ላይ...',
    loading: 'በመጫን ላይ...',
    loadingYourDashboard: 'ዳሽበርድዎ በመጫን ላይ...',
    loadingChat: 'ውይይት በመጫን ላይ...',
    loadingListings: 'ዝርዝሮች በመጫን ላይ...',
    loadingProducts: 'ምርቶች በመጫን ላይ...',
    browseCatalog: 'ካታሎጁን ይመልከቱ',
    noProductsFound: 'ምርት አልተገኘም',
    createListing: 'ዝርዝር ይፍጠሩ',
    searchProducts: 'ምርቶችን ይፈልጉ',
    placeOrder: 'ትዕዛዝ ይሰጡ',
    myOrders: 'የእኔ ትዕዛዞች',
    viewDetails: 'ዝርዝር ይመልከቱ',
    contactSeller: 'ከሺሪያው ያግኙ',
    price: 'ዋጋ',
    quantity: 'መጠን',
    seller: 'ሺሪያ',
    product: 'ምርት',
    loadingOrders: 'ትዕዛዞች በመጫን ላይ...',
    noListingsFound: 'ምንም ዝርዝር አልተገኘም',
    noOrdersFound: 'ምንም ትዕዛዝ አልተገኘም',
    beTheFirst: 'የመጀመሪያውን ምርት ይላኩ!',
    startBuyingSelling: 'በድረስ ለውጥ መግዛትና መሸጣት ይጀምሩ',
    browseMarketplace: 'የግበር ለውጥን ይመልከቱ',
    backToDashboard: 'ወደ ዳሽበርድ ተመለስ',
    backToMarketplace: 'ወደ የግበር ለውጥ ተመለስ',
    listingNotFound: 'ዝርዝሩ አልተገኘም',
  },

};

/**
 * The merged table. English is the reference: every key defined here must exist
 * in Amharic, which `tests/i18n-parity.test.ts` enforces. `t()` falls
 * back to English for a missing key, so without that test an incomplete
 * translation would look complete on screen.
 */
export const TRANSLATIONS: Record<Locale, Record<string, string>> = SUPPORTED_LOCALES.reduce(
  (accumulator, locale) => {
    accumulator[locale] = { ...AUTH_TRANSLATIONS[locale], ...BASE_TRANSLATIONS[locale] };
    return accumulator;
  },
  {} as Record<Locale, Record<string, string>>,
);
