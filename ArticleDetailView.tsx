import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
  Share,
  Clipboard,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons'; // fallback if lucide not available
// Using lucide-react-native icons
import {
  ArrowLeft,
  Clock,
  Share2,
  MoreVertical,
  Bookmark,
  MessageCircle,
  Link as LinkIcon,
  Flag,
  Ban,
  CheckCircle2,
  Mail,
  Send,
  ExternalLink,
  Sparkles,
  Loader2,
  Volume2,
  StopCircle,
  Languages,
  Check,
  Globe,
} from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import LinearGradient from 'react-native-linear-gradient';
import Tts from 'react-native-tts'; // or expo-speech if using Expo

import { Article, Comment } from '../types';
import { fetchArticleContent, fetchRelatedArticles, translateContent } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useShare } from '../context/ShareContext';
import ArticleCard from './ArticleCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface ArticleDetailViewProps {
  article: Article;
  onClose: () => void;
  onArticleSelect?: (article: Article) => void;
}

const SUPPORTED_LANGUAGES = [
  'English',
  'Hindi',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Chinese',
  'Russian',
  'Arabic',
  'Bengali',
];

// Native Ad Component
const NativeAd: React.FC<{ placement: 'mid' | 'end' }> = ({ placement }) => {
  const { theme } = useTheme();

  const adContent =
    placement === 'mid'
      ? {
          title: 'Future of Cloud Computing',
          desc: 'Experience quantum-speed processing for your data analysis needs.',
          cta: 'Start Free Trial',
          img: 'https://image.pollinations.ai/prompt/futuristic%20quantum%20cloud%20server%20room%20technology%204k?width=600&height=400&nologo=true',
        }
      : {
          title: 'Premium Tech Gear',
          desc: 'Upgrade your setup with the latest AI-integrated peripherals.',
          cta: 'Shop Now',
          img: 'https://image.pollinations.ai/prompt/high%20end%20gaming%20setup%20neon%20lights%20tech%20gadgets?width=600&height=400&nologo=true',
        };

  return (
    <View
      style={[
        styles.adContainer,
        { borderColor: theme.border, backgroundColor: theme.inputBg },
      ]}
    >
      <View style={styles.adBadge}>
        <Text style={styles.adBadgeText}>Sponsored</Text>
      </View>

      <View style={styles.adContent}>
        <Image source={{ uri: adContent.img }} style={styles.adImage} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'transparent']}
          style={styles.adImageGradient}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
        />
        <View style={styles.adTextContainer}>
          <Text style={styles.adTitle}>{adContent.title}</Text>
          <Text style={styles.adDesc}>
            {adContent.desc} <Text style={styles.adHashtag}>#sponsored</Text>
          </Text>
          <TouchableOpacity style={styles.adButton}>
            <Text style={styles.adButtonText}>{adContent.cta}</Text>
            <ExternalLink size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({
  article,
  onClose,
  onArticleSelect,
}) => {
  const [originalContent, setOriginalContent] = useState<string>(article.content || '');
  const [displayContent, setDisplayContent] = useState<string>(article.content || '');
  const [isLoading, setIsLoading] = useState(!article.content);
  const [isScrolled, setIsScrolled] = useState(false);

  // Comment State
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  // Related Articles State
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [isRelatedLoading, setIsRelatedLoading] = useState(false);

  // Interaction States
  const [isSaved, setIsSaved] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: '',
  });

  // Translation & Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [isTranslating, setIsTranslating] = useState(false);
  const speakingRef = useRef(false);

  const { theme, themeMode } = useTheme();
  const { openShare } = useShare();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Load Saved State
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const saved = await AsyncStorage.getItem('see_saved_articles');
        const savedArticles = saved ? JSON.parse(saved) : [];
        setIsSaved(savedArticles.includes(article.id));
      } catch (e) {
        console.error('Failed to load saved articles', e);
      }
    };
    loadSaved();
  }, [article.id]);

  // Load Content and Related Articles when Article changes
  useEffect(() => {
    // Reset scroll
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
    cancelSpeech();
    setCurrentLanguage('English');

    const loadData = async () => {
      setIsLoading(true);
      setOriginalContent('');
      setDisplayContent('');
      setIsRelatedLoading(true);

      // Parallel fetch
      const [text, related] = await Promise.all([
        article.content || fetchArticleContent(article.title, article.source),
        fetchRelatedArticles(article.title),
      ]);

      const cleanText = text.replace(/\[\s*\d+(?:,\s*\d+)*\s*\]/g, '');
      setOriginalContent(cleanText);
      setDisplayContent(cleanText);
      setRelatedArticles(related.slice(0, 4));

      setIsLoading(false);
      setIsRelatedLoading(false);
    };

    loadData();

    // Reset comments
    setComments([]);
    dbService.getComments(article.id).then(setComments);
  }, [article.id, article.title, article.source, article.content]);

  // Stop speaking on unmount
  useEffect(() => {
    return () => cancelSpeech();
  }, []);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleSave = async () => {
    try {
      const saved = await AsyncStorage.getItem('see_saved_articles');
      const savedArticles = saved ? JSON.parse(saved) : [];
      let newSaved;
      if (isSaved) {
        newSaved = savedArticles.filter((id: string) => id !== article.id);
        showToast('Removed from bookmarks');
      } else {
        newSaved = [...savedArticles, article.id];
        showToast('Saved to bookmarks');
      }
      await AsyncStorage.setItem('see_saved_articles', JSON.stringify(newSaved));
      setIsSaved(!isSaved);
    } catch (e) {
      console.error('Failed to save', e);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: article.title,
        message: `Read this amazing article on See: ${article.title}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // TTS Logic
  const cancelSpeech = () => {
    speakingRef.current = false;
    Tts.stop();
    setIsSpeaking(false);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      cancelSpeech();
    } else {
      const cleanText = displayContent
        .replace(/[#*`_~]/g, '')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/https?:\/\/[^\s]+/g, 'link')
        .replace(/\n+/g, '. ')
        .trim();

      if (!cleanText) return;

      setIsSpeaking(true);
      speakingRef.current = true;

      // Configure TTS
      const langMap: Record<string, string> = {
        Hindi: 'hi-IN',
        Spanish: 'es-ES',
        French: 'fr-FR',
        English: 'en-US',
      };
      Tts.setDefaultLanguage(langMap[currentLanguage] || 'en-US');

      // Split into sentences or chunks
      const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
      let index = 0;

      const speakNext = () => {
        if (!speakingRef.current || index >= sentences.length) {
          setIsSpeaking(false);
          speakingRef.current = false;
          return;
        }
        const chunk = sentences[index].substring(0, 180).trim();
        if (chunk) {
          Tts.speak(chunk, {
            onDone: () => {
              index++;
              speakNext();
            },
            onError: (err) => {
              console.warn(err);
              index++;
              speakNext();
            },
          });
        } else {
          index++;
          speakNext();
        }
      };

      speakNext();
    }
  };

  // Translation Logic
  const handleLanguageChange = async (lang: string) => {
    if (lang === currentLanguage) return;

    setShowLangMenu(false);
    setIsTranslating(true);
    cancelSpeech();

    try {
      if (lang === 'English') {
        setDisplayContent(originalContent);
      } else {
        const translated = await translateContent(originalContent, lang);
        setDisplayContent(translated);
      }
      setCurrentLanguage(lang);
    } catch (e) {
      showToast('Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !user) return;

    const comment: Comment = {
      id: `cmt_${Date.now()}`,
      articleId: article.id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      text: newComment.trim(),
      timestamp: 'Just now',
      timestampRaw: Date.now(),
    };

    await dbService.addComment(comment);
    setComments((prev) => [comment, ...prev]);
    setNewComment('');
    showToast('Comment posted');
  };

  const handleCopyLink = async () => {
    // In React Native, we don't have window.location.href; maybe use a deep link or just article id.
    // For simplicity, we'll copy article title + id
    await Clipboard.setString(`${article.title} - See Article`);
    showToast('Link Copied');
    setShowMenu(false);
  };

  // Render content with ads
  const renderContentWithAds = () => {
    if (!displayContent) return null;

    const markdownStyles = {
      body: { color: theme.text, fontSize: 16, lineHeight: 24 },
      heading1: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.text,
        marginVertical: 16,
      },
      heading2: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      },
      heading3: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginVertical: 8 },
      paragraph: { color: theme.secondaryText, fontSize: 16, lineHeight: 24, marginBottom: 16 },
      bullet_list: { marginBottom: 12 },
      bullet_list_item: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
      },
      blockquote: {
        borderLeftWidth: 4,
        borderLeftColor: '#f97316',
        paddingLeft: 12,
        fontStyle: 'italic',
        color: '#9ca3af',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 8,
        marginVertical: 16,
      },
    };

    const paragraphs = displayContent.split(/\n\n+/);

    if (paragraphs.length <= 4) {
      return (
        <>
          <Markdown style={markdownStyles}>{displayContent}</Markdown>
          <NativeAd placement="end" />
        </>
      );
    }

    const firstPart = paragraphs.slice(0, 3).join('\n\n');
    const secondPart = paragraphs.slice(3).join('\n\n');

    return (
      <>
        <Markdown style={markdownStyles}>{firstPart}</Markdown>
        <NativeAd placement="mid" />
        <Markdown style={markdownStyles}>{secondPart}</Markdown>
        <NativeAd placement="end" />
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Toast Notification */}
      {toast.show && (
        <Animated.View style={styles.toast}>
          <View style={styles.toastContent}>
            <CheckCircle2 size={16} color="#10b981" />
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}

      {/* Top Navigation Bar */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: isScrolled ? 'rgba(0,0,0,0.8)' : 'transparent',
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {/* Listen Button */}
          <TouchableOpacity
            onPress={toggleSpeech}
            style={[
              styles.headerButton,
              isSpeaking && { backgroundColor: '#10b981' },
            ]}
          >
            {isSpeaking ? (
              <StopCircle size={20} color="#fff" />
            ) : (
              <Volume2 size={20} color="#fff" />
            )}
          </TouchableOpacity>

          {/* Translate Dropdown */}
          <View style={styles.langMenuContainer}>
            <TouchableOpacity
              onPress={() => setShowLangMenu(!showLangMenu)}
              style={[
                styles.headerButton,
                (isTranslating || currentLanguage !== 'English') && {
                  backgroundColor: '#3b82f6',
                },
              ]}
            >
              {isTranslating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Languages size={20} color="#fff" />
              )}
            </TouchableOpacity>

            {showLangMenu && (
              <>
                <TouchableOpacity
                  style={styles.overlay}
                  activeOpacity={1}
                  onPress={() => setShowLangMenu(false)}
                />
                <View
                  style={[
                    styles.langMenu,
                    { backgroundColor: theme.modalBg, borderColor: theme.border },
                  ]}
                >
                  <View style={[styles.langMenuHeader, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.langMenuTitle, { color: theme.secondaryText }]}>
                      Translate to
                    </Text>
                  </View>
                  <ScrollView style={styles.langMenuList}>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <TouchableOpacity
                        key={lang}
                        onPress={() => handleLanguageChange(lang)}
                        style={[
                          styles.langMenuItem,
                          currentLanguage === lang && { backgroundColor: 'rgba(59,130,246,0.1)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.langMenuText,
                            { color: theme.text },
                            currentLanguage === lang && { color: '#3b82f6' },
                          ]}
                        >
                          {lang}
                        </Text>
                        {currentLanguage === lang && <Check size={14} color="#3b82f6" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.headerButton,
              isSaved && { backgroundColor: '#ec4899' },
            ]}
          >
            <Bookmark size={20} color="#fff" fill={isSaved ? '#fff' : 'none'} />
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Share2 size={20} color="#fff" />
          </TouchableOpacity>

          {/* Menu Button */}
          <View style={styles.menuContainer}>
            <TouchableOpacity
              onPress={() => setShowMenu(!showMenu)}
              style={[
                styles.headerButton,
                showMenu && { backgroundColor: '#fff' },
              ]}
            >
              <MoreVertical size={20} color={showMenu ? '#000' : '#fff'} />
            </TouchableOpacity>

            {showMenu && (
              <>
                <TouchableOpacity
                  style={styles.overlay}
                  activeOpacity={1}
                  onPress={() => setShowMenu(false)}
                />
                <View
                  style={[
                    styles.menu,
                    { backgroundColor: theme.modalBg, borderColor: theme.border },
                  ]}
                >
                  <TouchableOpacity
                    onPress={handleCopyLink}
                    style={[styles.menuItem, { borderBottomColor: theme.border }]}
                  >
                    <LinkIcon size={16} color={theme.text} />
                    <Text style={[styles.menuItemText, { color: theme.text }]}>Copy Link</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      showToast('Not Interested');
                      setShowMenu(false);
                    }}
                    style={[styles.menuItem, { borderBottomColor: theme.border }]}
                  >
                    <Ban size={16} color={theme.text} />
                    <Text style={[styles.menuItemText, { color: theme.text }]}>Not Interested</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      showToast('Reported');
                      setShowMenu(false);
                    }}
                    style={styles.menuItem}
                  >
                    <Flag size={16} color="#ef4444" />
                    <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Report Issue</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Animated.View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          listener: (event) => {
            const offsetY = event.nativeEvent.contentOffset.y;
            setIsScrolled(offsetY > 50);
          },
          useNativeDriver: false,
        })}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: article.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.heroGradient}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.tags}>
              {article.category && (
                <View style={styles.categoryTag}>
                  <Text style={styles.tagText}>{article.category}</Text>
                </View>
              )}
              <View style={styles.trendingTag}>
                <Text style={styles.tagText}>Trending</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>{article.title}</Text>

            <View style={styles.heroMeta}>
              <View style={styles.sourceContainer}>
                <View style={styles.avatar}>
                  <Image
                    source={{
                      uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        article.source
                      )}&background=000&color=fff`,
                    }}
                    style={styles.avatarImage}
                  />
                </View>
                <View>
                  <Text style={styles.sourceName}>{article.source}</Text>
                  <Text style={styles.verifiedText}>Verified Source</Text>
                </View>
              </View>
              <View style={styles.dot} />
              <View style={styles.timeContainer}>
                <Clock size={14} color="#fff" />
                <Text style={styles.timeText}>{article.timeAgo}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={[styles.contentBody, { backgroundColor: theme.bg }]}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <View style={[styles.skeleton, { backgroundColor: theme.inputBg }]} />
              <View style={[styles.skeleton, { backgroundColor: theme.inputBg, width: '98%' }]} />
              <View style={[styles.skeleton, { backgroundColor: theme.inputBg, width: '95%' }]} />
              <View style={[styles.skeleton, { backgroundColor: theme.inputBg, width: '70%', marginTop: 20 }]} />
              <View style={[styles.skeleton, { backgroundColor: theme.inputBg }]} />
              <View style={[styles.skeleton, { backgroundColor: theme.inputBg, width: '92%' }]} />
              <View style={[styles.skeleton, { backgroundColor: theme.inputBg, width: '96%' }]} />
            </View>
          ) : (
            <View>
              {isTranslating ? (
                <View style={styles.translatingContainer}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={[styles.translatingText, { color: theme.secondaryText }]}>
                    Translating article...
                  </Text>
                </View>
              ) : (
                renderContentWithAds()
              )}
            </View>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && !isLoading && (
            <View style={[styles.relatedContainer, { borderTopColor: theme.border }]}>
              <View style={styles.relatedHeader}>
                <Sparkles size={20} color="#f97316" />
                <Text style={[styles.relatedTitle, { color: theme.text }]}>Read Next</Text>
              </View>
              <FlatList
                data={relatedArticles}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.relatedCard}>
                    <ArticleCard
                      article={item}
                      onClick={() => onArticleSelect && onArticleSelect(item)}
                    />
                  </View>
                )}
              />
            </View>
          )}

          {/* Comments Section */}
          <View style={[styles.commentsContainer, { borderTopColor: theme.border }]}>
            <Text style={[styles.commentsTitle, { color: theme.text }]}>Discussion</Text>

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              <Image source={{ uri: user?.avatar }} style={styles.commentAvatar} />
              <View style={styles.commentInputWrapper}>
                <TextInput
                  style={[
                    styles.commentInput,
                    {
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Add a comment..."
                  placeholderTextColor={theme.secondaryText}
                  value={newComment}
                  onChangeText={setNewComment}
                  onSubmitEditing={handlePostComment}
                />
                {newComment.trim().length > 0 && (
                  <TouchableOpacity onPress={handlePostComment} style={styles.sendButton}>
                    <Send size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Comment List */}
            {comments.length > 0 ? (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Image source={{ uri: comment.userAvatar }} style={styles.commentAvatarSmall} />
                  <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                      <Text style={[styles.commentUserName, { color: theme.text }]}>
                        {comment.userName}
                      </Text>
                      <Text style={[styles.commentTime, { color: theme.secondaryText }]}>
                        {comment.timestamp}
                      </Text>
                    </View>
                    <Text style={[styles.commentText, { color: theme.text }]}>
                      {comment.text}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={[styles.emptyComments, { backgroundColor: theme.inputBg }]}>
                <MessageCircle size={24} color={theme.secondaryText} />
                <Text style={[styles.emptyCommentsText, { color: theme.secondaryText }]}>
                  No comments yet. Be the first to start the conversation!
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    zIndex: 70,
    alignItems: 'center',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    gap: 8,
  },
  toastText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langMenuContainer: {
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 30,
  },
  langMenu: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 200,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 40,
  },
  langMenuHeader: {
    padding: 12,
    borderBottomWidth: 1,
  },
  langMenuTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  langMenuList: {
    maxHeight: 240,
  },
  langMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  langMenuText: {
    fontSize: 14,
  },
  menuContainer: {
    position: 'relative',
  },
  menu: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 180,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: height * 0.5,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: 'rgba(37,99,235,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  trendingTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 12,
    fontFamily: 'serif',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 1,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  sourceName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  verifiedText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  contentBody: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    minHeight: height * 0.5,
  },
  loadingContainer: {
    gap: 12,
  },
  skeleton: {
    height: 16,
    borderRadius: 4,
  },
  translatingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  translatingText: {
    fontSize: 14,
  },
  adContainer: {
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  adBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#1f2937',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
    zIndex: 10,
  },
  adBadgeText: {
    color: '#9ca3af',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  adContent: {
    flexDirection: 'row',
    height: 180,
  },
  adImage: {
    width: '40%',
    height: '100%',
  },
  adImageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  adTextContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  adDesc: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  adHashtag: {
    color: '#60a5fa',
  },
  adButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  adButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  relatedContainer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  relatedCard: {
    width: width * 0.8,
    marginRight: 12,
  },
  commentsContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  commentInputWrapper: {
    flex: 1,
    position: 'relative',
  },
  commentInput: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 40,
    borderWidth: 1,
  },
  sendButton: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -12 }],
    backgroundColor: '#3b82f6',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  commentAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  commentUserName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyComments: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyCommentsText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ArticleDetailView;