import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_QUOTE_KEY = 'daily_quote_';
const MOTIVATION_TIPS_KEY = 'motivation_tips';

interface DailyQuote {
  quote: string;
  author: string;
  category: 'motivation' | 'strength' | 'mindset' | 'fitness';
}

interface MotivationTip {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'form' | 'nutrition' | 'recovery' | 'mindset';
}

const QUOTES: DailyQuote[] = [
  {
    quote: 'The only bad workout is the one that did not happen.',
    author: 'Unknown',
    category: 'motivation',
  },
  {
    quote: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
    category: 'mindset',
  },
  {
    quote: 'Your body can stand almost anything. It is your mind that you need to convince.',
    author: 'A.P.J. Abdul Kalam',
    category: 'mindset',
  },
  {
    quote: 'The pain you feel today is the strength you feel tomorrow.',
    author: 'Unknown',
    category: 'strength',
  },
  {
    quote: 'No pain, no gain. But every pain does give a gain.',
    author: 'Unknown',
    category: 'fitness',
  },
  {
    quote: 'You do not have to be great to start, but you have to start to be great.',
    author: 'Zig Ziglar',
    category: 'motivation',
  },
  {
    quote: 'Discipline is choosing what you want most over what you want now.',
    author: 'Unknown',
    category: 'mindset',
  },
  {
    quote: 'Wake up with determination. Go to bed with satisfaction.',
    author: 'Unknown',
    category: 'motivation',
  },
  {
    quote: 'Great things never came from comfort zones.',
    author: 'Unknown',
    category: 'motivation',
  },
  {
    quote: 'The mind is everything. What you think, you become.',
    author: 'Buddha',
    category: 'mindset',
  },
  {
    quote: 'It is not about how bad you want it. It is about how hard you are willing to work for it.',
    author: 'Unknown',
    category: 'fitness',
  },
  {
    quote: 'Push yourself. Because no one else is going to do it for you.',
    author: 'Unknown',
    category: 'motivation',
  },
  {
    quote: 'Your limitation only exists in your mind.',
    author: 'Unknown',
    category: 'mindset',
  },
  {
    quote: 'Sweat is just your fat crying.',
    author: 'Unknown',
    category: 'fitness',
  },
  {
    quote: 'The only impossible journey is the one you never begin.',
    author: 'Tony Robbins',
    category: 'motivation',
  },
];

const TIPS: MotivationTip[] = [
  {
    id: 'form_importance',
    title: 'Perfect Your Form',
    description: 'Focus on proper form over heavy weight. Quality reps beat quantity every time.',
    icon: '🎯',
    category: 'form',
  },
  {
    id: 'rest_days',
    title: 'Rest Days Matter',
    description: 'Rest days are when your muscles grow. Take at least 1-2 days off per week.',
    icon: '😴',
    category: 'recovery',
  },
  {
    id: 'progressive_overload',
    title: 'Progressive Overload',
    description: 'Gradually increase weight, reps, or sets each week to keep seeing progress.',
    icon: '📈',
    category: 'form',
  },
  {
    id: 'hydration',
    title: 'Stay Hydrated',
    description: 'Drink at least 2-3 liters of water daily. More on workout days.',
    icon: '💧',
    category: 'nutrition',
  },
  {
    id: 'protein_intake',
    title: 'Protein is Key',
    description: 'Aim for 0.8-1g of protein per pound of body weight daily.',
    icon: '🥚',
    category: 'nutrition',
  },
  {
    id: 'sleep_recovery',
    title: 'Sleep for Recovery',
    description: 'Get 7-9 hours of quality sleep for optimal muscle recovery and growth.',
    icon: '🌙',
    category: 'recovery',
  },
  {
    id: 'warm_up',
    title: 'Warm Up Properly',
    description: 'Spend 5-10 minutes warming up to prevent injuries and improve performance.',
    icon: '🔥',
    category: 'form',
  },
  {
    id: 'track_progress',
    title: 'Track Everything',
    description: 'Log your workouts, weight, and how you feel. Data drives better decisions.',
    icon: '📊',
    category: 'form',
  },
  {
    id: 'consistency',
    title: 'Consistency Beats Intensity',
    description: 'Regular moderate training beats sporadic intense training.',
    icon: '⏰',
    category: 'mindset',
  },
  {
    id: 'stretching',
    title: 'Stretch After Workouts',
    description: 'Spend 10 minutes stretching to improve flexibility and reduce soreness.',
    icon: '🤸',
    category: 'recovery',
  },
];

/**
 * Get today's daily quote
 */
export async function getTodayQuote(): Promise<DailyQuote> {
  try {
    const today = new Date().toDateString();
    const cacheKey = `${DAILY_QUOTE_KEY}${today}`;

    // Check cache
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get new quote
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    await AsyncStorage.setItem(cacheKey, JSON.stringify(quote));

    return quote;
  } catch (error) {
    console.warn('Failed to get daily quote:', error);
    return QUOTES[0];
  }
}

/**
 * Get a random quote
 */
export function getRandomQuote(): DailyQuote {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

/**
 * Get quotes by category
 */
export function getQuotesByCategory(category: DailyQuote['category']): DailyQuote[] {
  return QUOTES.filter(q => q.category === category);
}

/**
 * Get all motivation tips
 */
export function getAllTips(): MotivationTip[] {
  return TIPS;
}

/**
 * Get tips by category
 */
export function getTipsByCategory(category: MotivationTip['category']): MotivationTip[] {
  return TIPS.filter(t => t.category === category);
}

/**
 * Get a random tip
 */
export function getRandomTip(): MotivationTip {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}

/**
 * Get daily tip (different each day)
 */
export async function getDailyTip(): Promise<MotivationTip> {
  try {
    const today = new Date().toDateString();
    const cacheKey = `${MOTIVATION_TIPS_KEY}_${today}`;

    // Check cache
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get new tip
    const tip = getRandomTip();
    await AsyncStorage.setItem(cacheKey, JSON.stringify(tip));

    return tip;
  } catch (error) {
    console.warn('Failed to get daily tip:', error);
    return TIPS[0];
  }
}
