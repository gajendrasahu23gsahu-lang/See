import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../utils/translations';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('English');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('see_app_language');
        if (savedLang) {
          setLanguageState(savedLang);
        }
      } catch (error) {
        console.error('Failed to load language preference', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLanguage();
  }, []);

  // Save language when it changes
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('see_app_language', language).catch((error) =>
        console.error('Failed to save language preference', error)
      );
    }
  }, [language, isLoading]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const langData = translations[language] || translations['English'];
    return langData[key] || key; // Fallback to key if translation missing
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};