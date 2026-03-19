import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Audio } from 'expo-av'; // for audio playback
import { Video } from 'expo-av'; // for video playback
import {
  MessageCircle,
  Repeat2,
  Heart,
  BarChart2,
  Share,
  BadgeCheck,
  MapPin,
  MoreHorizontal,
  Link as LinkIcon,
  Ban,
  Flag,
  Mic,
  Trash2,
} from 'lucide-react-native';
import { useShare } from '../context/ShareContext';
import { useTheme } from '../context/ThemeContext';
import { RepostSheet, ViewsSheet } from './InteractionSheets';
import { ReplyModal } from './ReplyModal';
import { MiniBlogPost } from '../types';

const { width } = Dimensions.get('window');

// Helper functions (same as original)
const parseCount = (str: string): number => {
  if (!str) return 0;
  const s = str.toLowerCase().replace(/,/g, '');
  if (s.includes('k')) return parseFloat(s) * 1000;
  if (s.includes('m')) return parseFloat(s) * 1000000;
  return parseFloat(s) || 0;
};

const formatCount = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

interface MiniBlogCardProps {
  post: MiniBlogPost;
  isOwner?: boolean;
  onDelete?: () => void;
}

const MiniBlogCard: React.FC<MiniBlogCardProps> = ({ post, isOwner, onDelete }) => {
  const { theme, themeMode } = useTheme();
  // Counts state
  const [likes, setLikes] = useState(parseCount(post.likes));
  const [reposts, setReposts] = useState(parseCount(post.reposts));
  const [replies, setReplies] = useState(parseCount(post.replies));
  const [views] = useState(parseCount(post.views));

  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [isReplied, setIsReplied] = useState(false);

  // UI States
  const [showMenu, setShowMenu] = useState(false);
  const [activeSheet, setActiveSheet] = useState<'repost' | 'views' | 'reply' | 'delete_confirm' | null>(null);

  const { openShare } = useShare();

  // Swipe to delete (left swipe)
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isOwner,
      onMoveShouldSetPanResponder: (_, gestureState) => isOwner && Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx < 80) {
          translateX.setValue(gestureState.dx);
        } else if (gestureState.dx >= 80) {
          translateX.setValue(80);
        } else {
          translateX.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 60) {
          // Snap open
          Animated.spring(translateX, {
            toValue: 80,
            useNativeDriver: true,
          }).start();
        } else {
          // Snap closed
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleDeleteTrigger = () => {
    setActiveSheet('delete_confirm');
  };

  const confirmDelete = () => {
    if (onDelete) onDelete();
    setActiveSheet(null);
  };

  const handleLike = () => {
    if (isLiked) {
      setLikes(prev => Math.max(0, prev - 1));
      setIsLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setIsLiked(true);
    }
  };

  const handleRepostClick = () => {
    setActiveSheet('repost');
  };

  const performRepost = () => {
    if (isReposted) {
      setReposts(prev => Math.max(0, prev - 1));
      setIsReposted(false);
    } else {
      setReposts(prev => prev + 1);
      setIsReposted(true);
    }
    setActiveSheet(null);
  };

  const handleReplyClick = () => {
    setActiveSheet('reply');
  };

  const submitReply = (text: string) => {
    setReplies(prev => prev + 1);
    setIsReplied(true);
    setActiveSheet(null);
  };

  const handleViewsClick = () => {
    setActiveSheet('views');
  };

  const handleShare = () => {
    openShare({
      title: `Post by ${post.authorName}`,
      text: `${post.authorName} (${post.authorHandle}): ${post.content}`,
    });
  };

  const handleCopyLink = () => {
    // In React Native, we can't copy arbitrary link, but we can use Clipboard
    // We'll assume the share URL is something like a deep link; for simplicity, just alert.
    Alert.alert('Link copied to clipboard');
    setShowMenu(false);
  };

  // Audio component
  const AudioMessage = ({ uri }: { uri: string }) => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = async () => {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri });
        setSound(newSound);
        await newSound.playAsync();
        setIsPlaying(true);
      }
    };

    return (
      <View style={styles.audioContainer}>
        <TouchableOpacity onPress={togglePlay} style={[styles.audioButton, { backgroundColor: '#ec4899' }]}>
          <Mic size={16} color="#fff" />
        </TouchableOpacity>
        {/* We could add progress bar, but for simplicity just a play button */}
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* Background delete layer */}
      {isOwner && (
        <View style={styles.deleteBackground}>
          <TouchableOpacity onPress={handleDeleteTrigger} style={styles.deleteButton}>
            <Trash2 size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Main card content */}
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.bg,
            borderBottomColor: theme.border,
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.row}>
          {/* Avatar */}
          <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />

          {/* Content */}
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.authorInfo}>
                <Text style={[styles.authorName, { color: theme.text }]} numberOfLines={1}>
                  {post.authorName}
                </Text>
                {post.isVerified && <BadgeCheck size={18} color="#1D9BF0" />}
                <Text style={[styles.authorHandle, { color: theme.secondaryText }]} numberOfLines={1}>
                  {post.authorHandle}
                </Text>
                <Text style={[styles.dot, { color: theme.secondaryText }]}>·</Text>
                <Text style={[styles.timestamp, { color: theme.secondaryText }]}>
                  {post.timestamp}
                </Text>
              </View>

              <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuButton}>
                <MoreHorizontal size={18} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>

            {/* Location */}
            {post.location && (
              <View style={styles.locationContainer}>
                <MapPin size={12} color="#60a5fa" />
                <Text style={styles.locationText}>{post.location}</Text>
              </View>
            )}

            {/* Text content */}
            <Text style={[styles.contentText, { color: theme.text }]}>
              {post.content}
            </Text>

            {/* Audio */}
            {post.audioUrl && (
              <View style={styles.audioWrapper}>
                <AudioMessage uri={post.audioUrl} />
              </View>
            )}

            {/* Image */}
            {post.imageUrl && (
              <View style={[styles.mediaContainer, { borderColor: theme.border }]}>
                <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />
              </View>
            )}

            {/* Video */}
            {post.videoUrl && (
              <View style={[styles.mediaContainer, { borderColor: theme.border }]}>
                <Video
                  source={{ uri: post.videoUrl }}
                  style={styles.video}
                  useNativeControls
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Action Bar */}
            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.actionButton} onPress={handleReplyClick}>
                <MessageCircle size={18} color={isReplied ? '#60a5fa' : theme.secondaryText} />
                <Text style={[styles.actionCount, { color: theme.secondaryText }]}>
                  {formatCount(replies)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleRepostClick}>
                <Repeat2 size={18} color={isReposted ? '#10b981' : theme.secondaryText} />
                <Text style={[styles.actionCount, { color: theme.secondaryText }]}>
                  {formatCount(reposts)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                <Heart size={18} color={isLiked ? '#ec4899' : theme.secondaryText} fill={isLiked ? '#ec4899' : 'none'} />
                <Text style={[styles.actionCount, { color: theme.secondaryText }]}>
                  {formatCount(likes)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleViewsClick}>
                <BarChart2 size={18} color={theme.secondaryText} />
                <Text style={[styles.actionCount, { color: theme.secondaryText }]}>
                  {formatCount(views)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Share size={18} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuContainer, { backgroundColor: theme.modalBg, borderColor: theme.border }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleCopyLink}>
              <LinkIcon size={14} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>Copy Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
              <Ban size={14} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>Not Interested</Text>
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  handleDeleteTrigger();
                }}
              >
                <Trash2 size={14} color="#ef4444" />
                <Text style={[styles.menuText, { color: '#ef4444' }]}>Delete Post</Text>
              </TouchableOpacity>
            )}
            {!isOwner && (
              <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
                <Flag size={14} color="#ef4444" />
                <Text style={[styles.menuText, { color: '#ef4444' }]}>Report Post</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sheets & Modals */}
      <Modal visible={activeSheet === 'delete_confirm'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModal, { backgroundColor: theme.modalBg, borderColor: theme.border }]}>
            <Text style={[styles.deleteTitle, { color: theme.text }]}>Delete Post?</Text>
            <Text style={[styles.deleteDescription, { color: theme.secondaryText }]}>
              This can't be undone and it will be removed from your profile, the timeline of any accounts that follow you, and from search results.
            </Text>
            <TouchableOpacity style={styles.deleteConfirmButton} onPress={confirmDelete}>
              <Text style={styles.deleteConfirmText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteCancelButton} onPress={() => setActiveSheet(null)}>
              <Text style={[styles.deleteCancelText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {activeSheet === 'repost' && (
        <RepostSheet
          visible={activeSheet === 'repost'}
          onClose={() => setActiveSheet(null)}
          onRepost={performRepost}
          onQuote={() => {
            performRepost();
          }}
        />
      )}

      {activeSheet === 'views' && (
        <ViewsSheet
          visible={activeSheet === 'views'}
          onClose={() => setActiveSheet(null)}
          viewsCount={formatCount(views)}
        />
      )}

      {activeSheet === 'reply' && (
        <ReplyModal
          visible={activeSheet === 'reply'}
          post={post}
          onClose={() => setActiveSheet(null)}
          onReply={submitReply}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 80,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  authorName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  authorHandle: {
    fontSize: 13,
    marginLeft: 2,
  },
  dot: {
    fontSize: 13,
  },
  timestamp: {
    fontSize: 13,
  },
  menuButton: {
    padding: 4,
    marginRight: -4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    color: '#60a5fa',
    fontSize: 12,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 8,
  },
  audioWrapper: {
    marginVertical: 8,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginTop: 8,
  },
  image: {
    width: '100%',
    height: undefined,
    aspectRatio: 16 / 9,
  },
  video: {
    width: '100%',
    height: undefined,
    aspectRatio: 16 / 9,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingRight: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    position: 'absolute',
    top: 100, // approximate position based on touch
    right: 16,
    width: 160,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  menuText: {
    fontSize: 14,
  },
  deleteModal: {
    width: width - 64,
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteConfirmButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 999,
    marginBottom: 8,
  },
  deleteConfirmText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteCancelButton: {
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#374151',
  },
  deleteCancelText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MiniBlogCard;