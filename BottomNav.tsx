import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Home, BookOpen, PlusCircle, User } from 'lucide-react-native';
import { Tab } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const { width } = Dimensions.get('window');

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const insets = useSafeAreaInsets();
  const { theme, themeMode } = useTheme();
  const { t } = useLanguage();

  const navItems = [
    { id: Tab.HOME, icon: Home, label: t('home') },
    { id: Tab.ARTICLE, icon: BookOpen, label: t('article') },
    { id: Tab.UPLOAD, icon: PlusCircle, label: t('upload') },
    { id: Tab.PROFILE, icon: User, label: t('profile') },
  ];

  // Determine colors based on theme
  const activeColor = themeMode === 'light' ? '#000' : '#fff';
  const inactiveColor = themeMode === 'light' ? '#9ca3af' : '#6b7280';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.navBg,
          borderTopColor: theme.border,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.inner}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.tab}
              onPress={() => onTabChange(item.id)}
              activeOpacity={0.7}
            >
              {/* Glow for active state (gradient) */}
              {isActive && (
                <LinearGradient
                  colors={
                    themeMode === 'light'
                      ? ['rgba(236,72,153,0.1)', 'rgba(59,130,246,0.1)']
                      : ['rgba(236,72,153,0.2)', 'rgba(59,130,246,0.2)']
                  }
                  style={styles.glow}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}

              <Icon
                size={24}
                color={isActive ? activeColor : inactiveColor}
                strokeWidth={isActive ? 2.5 : 2}
                style={isActive ? styles.activeIcon : styles.inactiveIcon}
              />

              {/* Small dot indicator for active */}
              {isActive && (
                <View style={styles.dot}>
                  <LinearGradient
                    colors={['#ec4899', '#3b82f6']}
                    style={styles.dotGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 8,
    zIndex: 50,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  tab: {
    position: 'relative',
    padding: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    opacity: 0.5,
  },
  activeIcon: {
    transform: [{ scale: 1.1 }],
  },
  inactiveIcon: {
    transform: [{ scale: 1 }],
  },
  dot: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  dotGradient: {
    width: '100%',
    height: '100%',
  },
});

export default BottomNav;