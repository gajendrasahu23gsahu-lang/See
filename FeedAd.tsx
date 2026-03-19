import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ExternalLink, Sparkles } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface FeedAdProps {
  index?: number;
  style?: object; // for additional styling
}

const FeedAd: React.FC<FeedAdProps> = ({ index = 0, style }) => {
  const { theme } = useTheme();

  const ads = [
    {
      title: 'Future of AI',
      desc: 'Unlock the power of generative AI for your business today.',
      img: 'https://picsum.photos/600/400?random=ad1',
      cta: 'Get Started',
    },
    {
      title: 'Space Tourism',
      desc: 'Book your ticket to the moon. Limited seats available.',
      img: 'https://picsum.photos/600/400?random=ad2',
      cta: 'Book Now',
    },
    {
      title: 'Quantum Computing',
      desc: 'Solve impossible problems in seconds with our new Quantum cloud.',
      img: 'https://picsum.photos/600/400?random=ad3',
      cta: 'Learn More',
    },
    {
      title: 'Eco-Friendly Tech',
      desc: 'Sustainable gadgets for a greener planet. Shop the collection.',
      img: 'https://picsum.photos/600/400?random=ad4',
      cta: 'Shop Green',
    },
  ];

  const ad = ads[index % ads.length];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.cardBg, borderColor: 'rgba(234,179,8,0.2)' },
        style,
      ]}
    >
      {/* Ad Badge */}
      <View style={styles.badge}>
        <Sparkles size={10} color="#000" />
        <Text style={styles.badgeText}>Sponsored</Text>
      </View>

      <View style={styles.content}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: ad.img }} style={styles.image} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'transparent']}
            style={styles.gradient}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
          />
        </View>

        {/* Text Section */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.text }]}>{ad.title}</Text>
          <Text style={[styles.description, { color: theme.secondaryText }]}>{ad.desc}</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>{ad.cta}</Text>
            <ExternalLink size={14} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(234,179,8,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    zIndex: 20,
    gap: 4,
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    flexDirection: 'row',
    height: 180,
  },
  imageContainer: {
    width: '40%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  textContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#eab308',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default FeedAd;