export type ThemeMode = 'dark' | 'dim' | 'light' | 'auto';

export interface ThemeColors {
  bg: string;
  text: string;
  secondaryText: string;
  border: string;
  hover: string;
  cardBg: string;
  buttonPrimary: string;
  buttonSecondary: string;
  navBg: string;
  tabBg: string;
  modalBg: string;
  cutout: string;
  cutoutBorder: string;
  inputBg: string;
  iconColor: string;
}

export const themes: Record<ThemeMode, ThemeColors> = {
  dark: {
    bg: 'bg-black',
    text: 'text-white',
    secondaryText: 'text-gray-500',
    border: 'border-white/15',
    hover: 'hover:bg-white/10',
    cardBg: 'bg-[#111]',
    buttonPrimary: 'bg-white text-black hover:bg-gray-200',
    buttonSecondary: 'bg-transparent border border-white/30 text-white',
    navBg: 'bg-black/80',
    tabBg: 'bg-black/80',
    modalBg: 'bg-[#161616]',
    cutout: 'bg-black',
    cutoutBorder: 'border-black',
    inputBg: 'bg-white/5',
    iconColor: 'text-white'
  },
  dim: {
    bg: 'bg-[#15202b]',
    text: 'text-white',
    secondaryText: 'text-[#8899a6]',
    border: 'border-[#38444d]',
    hover: 'hover:bg-[#192734]',
    cardBg: 'bg-[#192734]',
    buttonPrimary: 'bg-white text-black hover:bg-gray-200',
    buttonSecondary: 'bg-transparent border border-gray-600 text-white',
    navBg: 'bg-[#15202b]/90',
    tabBg: 'bg-[#15202b]/90',
    modalBg: 'bg-[#192734]',
    cutout: 'bg-[#15202b]',
    cutoutBorder: 'border-[#15202b]',
    inputBg: 'bg-[#253341]',
    iconColor: 'text-white'
  },
  light: {
    bg: 'bg-white',
    text: 'text-black',
    secondaryText: 'text-gray-500',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-100',
    cardBg: 'bg-gray-50',
    buttonPrimary: 'bg-black text-white hover:bg-gray-800',
    buttonSecondary: 'bg-transparent border border-gray-300 text-black',
    navBg: 'bg-white/90',
    tabBg: 'bg-white/90',
    modalBg: 'bg-white',
    cutout: 'bg-white',
    cutoutBorder: 'border-white',
    inputBg: 'bg-gray-100',
    iconColor: 'text-black'
  },
  auto: { 
    // Default fallback to dark
    bg: 'bg-black',
    text: 'text-white',
    secondaryText: 'text-gray-500',
    border: 'border-white/15',
    hover: 'hover:bg-white/10',
    cardBg: 'bg-[#111]',
    buttonPrimary: 'bg-white text-black hover:bg-gray-200',
    buttonSecondary: 'bg-transparent border border-white/30 text-white',
    navBg: 'bg-black/80',
    tabBg: 'bg-black/80',
    modalBg: 'bg-[#161616]',
    cutout: 'bg-black',
    cutoutBorder: 'border-black',
    inputBg: 'bg-white/5',
    iconColor: 'text-white'
  }
};