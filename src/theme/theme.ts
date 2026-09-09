import { ActivityLevel } from '../types';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: {
    bg: string;
    bgGradient: [string, string];
    card: string;
    cardMuted: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryDark: string;
    primarySoft: string;
    onPrimary: string;
    aqua: string;
    aquaSoft: string;
    success: string;
    successSoft: string;
    warning: string;
    danger: string;
    dangerSoft: string;
    overlay: string;
    track: string;
    shadow: string;
  };
  spacing: (n: number) => number;
  radius: { sm: number; md: number; lg: number; xl: number; pill: number };
  font: {
    h1: number;
    h2: number;
    h3: number;
    body: number;
    small: number;
    tiny: number;
    mega: number;
  };
  shadow: (elevation?: number) => object;
}

const spacing = (n: number) => n * 4;

const radius = { sm: 10, md: 16, lg: 22, xl: 30, pill: 999 };

const font = {
  mega: 60,
  h1: 32,
  h2: 24,
  h3: 19,
  body: 15,
  small: 13,
  tiny: 11,
};

const lightColors = {
  bg: '#EEF6FD',
  bgGradient: ['#E8F3FD', '#F6FBFF'] as [string, string],
  card: '#FFFFFF',
  cardMuted: '#F4FAFF',
  border: '#DCEAF8',
  text: '#0B2545',
  textSecondary: '#4C6E8E',
  textMuted: '#8CA6BE',
  primary: '#1E90E6',
  primaryDark: '#0E6BB8',
  primarySoft: '#D9EDFD',
  onPrimary: '#FFFFFF',
  aqua: '#38C6D9',
  aquaSoft: '#D6F5F8',
  success: '#1FB57A',
  successSoft: '#D6F3E7',
  warning: '#F5A524',
  danger: '#F0596B',
  dangerSoft: '#FDE2E6',
  overlay: 'rgba(11, 37, 69, 0.42)',
  track: '#E3EEF9',
  shadow: '#0B2545',
};

const darkColors = {
  bg: '#08131F',
  bgGradient: ['#0B1B2B', '#071120'] as [string, string],
  card: '#10212F',
  cardMuted: '#16293B',
  border: '#1F374B',
  text: '#E9F3FB',
  textSecondary: '#A5C0D6',
  textMuted: '#6C88A2',
  primary: '#4FB0FF',
  primaryDark: '#2A8FE0',
  primarySoft: '#123149',
  onPrimary: '#04121F',
  aqua: '#4FD9E8',
  aquaSoft: '#0E3540',
  success: '#35D199',
  successSoft: '#0E3A2C',
  warning: '#FBBF4B',
  danger: '#FF7486',
  dangerSoft: '#3D1A21',
  overlay: 'rgba(2, 8, 14, 0.62)',
  track: '#1B3145',
  shadow: '#000000',
};

function makeShadow(color: string, mode: ThemeMode) {
  return (elevation = 4) => {
    const opacity = mode === 'dark' ? 0.5 : Math.min(0.06 + elevation * 0.035, 0.28);
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: elevation / 1.6 },
      shadowOpacity: opacity,
      shadowRadius: elevation * 1.6,
      elevation,
    };
  };
}

export function createTheme(mode: ThemeMode): Theme {
  const colors = mode === 'dark' ? darkColors : lightColors;
  return {
    mode,
    colors,
    spacing,
    radius,
    font,
    shadow: makeShadow(colors.shadow, mode),
  };
}

export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');

export const ACTIVITY_LEVELS: {
  key: ActivityLevel;
  label: string;
  hint: string;
  factor: number;
  icon: string;
}[] = [
  { key: 'sedentary', label: 'Sedentary', hint: 'Desk job, little exercise', factor: 1.0, icon: 'bed-outline' },
  { key: 'light', label: 'Light', hint: '1–2 workouts a week', factor: 1.1, icon: 'walk-outline' },
  { key: 'moderate', label: 'Moderate', hint: '3–4 workouts a week', factor: 1.2, icon: 'fitness-outline' },
  { key: 'active', label: 'Active', hint: 'Daily training / physical job', factor: 1.35, icon: 'barbell-outline' },
  { key: 'athlete', label: 'Athlete', hint: 'Intense multi-day training', factor: 1.5, icon: 'flame-outline' },
];
