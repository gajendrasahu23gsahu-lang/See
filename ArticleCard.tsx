import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Share,
} from 'react-native';
import { Clock, Share2 } from 'lucide-react-native';
import { Article } from '../types';
import { useShare } from '../context/ShareContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface ArticleCardProps {
  article: Article;
  onClick?: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  const { openShare } = useShare();
  const { theme, themeMode } = useTheme();

  // For parallax effect – in React Native, this would require a scrollY value from the parent ScrollView.
  // Since we don't have direct access, we can use a static animated value or a simple scale on press.
  // For now, we'll keep the image static, but leave a comment for future implementation.
  // If you need full parallax, consider using a library like react-native-parallax-scroll-view
  // or pass scrollY as a prop and use Animated.

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this article: ${article.title}\nSource: ${article.source}`,
        title: article.title,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onClick}
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: article.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Gradient Overlay - approximated with a semi-transparent view */}
        <View
          style={[
            styles.gradientOverlay,
            {
              backgroundColor:
                themeMode === 'light' ? 'rgba(0,0,0,0.6)' : '#000',
              opacity: 0.8,
            },
          ]}
        />
        {/* Category Badge */}
        {article.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{article.category}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.timeContainer}>
          <Clock size={14} color={theme.secondaryText} />
          <Text style={[styles.timeText, { color: theme.secondaryText }]}>
            {article.timeAgo}
          </Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          {article.title}
        </Text>

        {/* Action strip */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          {/* Profile Section */}
          <View style={styles.profileContainer}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    article.source
                  )}&background=000&color=fff`,
                }}
                style={styles.avatar}
              />
            </View>
            <Text
              style={[
                styles.sourceName,
                { color: theme.secondaryText },
              ]}
            >
              {article.source}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleShare}
            style={styles.shareButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Share2 size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 400,
    width: width - 32, // approximate from original (max-w-2xl mx-auto with padding)
    marginBottom: 16,
    alignSelf: 'center',
  },
  imageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    opacity: 0.6,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#2563eb',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    zIndex: 10,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    padding: 1,
    backgroundColor: 'linear-gradient(135deg, #ec4899, #f97316)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '500',
  },
  shareButton: {
    padding: 8,
  },
});

export default ArticleCard;