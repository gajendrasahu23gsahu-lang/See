import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import Tts from 'react-native-tts';
import Markdown from 'react-native-markdown-display';
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  AlertCircle,
  Loader2,
  Languages,
  Check,
  Volume2,
  StopCircle,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { translateContent } from '../services/geminiService';
import SearchBar from './SearchBar';
import ArticleCard from './ArticleCard';
import FeedAd from './FeedAd';
import { SearchResult, Article } from '../types';

const { width } = Dimensions.get('window');

interface SearchResultViewProps {
  result: SearchResult | null;
  onBack: () => void;
  isLoading: boolean;
  onArticleClick?: (article: Article) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onSearch: (query: string) => void;
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

const SearchResultView: React.FC<SearchResultViewProps> = ({
  result,
  onBack,
  isLoading,
  onArticleClick,
  onLoadMore,
  hasMore,
  isLoadingMore,
  onSearch,
}) => {
  const { theme } = useTheme();

  // Content state
  const [displayContent, setDisplayContent] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingRef = useRef(false);

  // Reset content when result changes
  useEffect(() => {
    if (result) {
      const cleanText = result.text.replace(/\[\s*\d+(?:,\s*\d+)*\s*\]/g, '');
      setDisplayContent(cleanText);
      setCurrentLanguage('English');
      stopSpeaking();
    }
  }, [result]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const stopSpeaking = () => {
    speakingRef.current = false;
    Tts.stop();
    setIsSpeaking(false);
  };

  // Language change handler
  const handleLanguageChange = async (lang: string) => {
    if (lang === currentLanguage || !result) return;

    setShowLangMenu(false);
    setIsTranslating(true);
    stopSpeaking();

    try {
      if (lang === 'English') {
        const cleanText = result.text.replace(/\[\s*\d+(?:,\s*\d+)*\s*\]/g, '');
        setDisplayContent(cleanText);
      } else {
        const cleanText = result.text.replace(/\[\s*\d+(?:,\s*\d+)*\s*\]/g, '');
        const translated = await translateContent(cleanText, lang);
        setDisplayContent(translated);
      }
      setCurrentLanguage(lang);
    } catch (error) {
      console.error('Translation failed', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // TTS toggle
  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
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

      // Split into manageable chunks
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
            androidParams: {
              KEY_PARAM_PAN: 0,
              KEY_PARAM_VOLUME: 0.5,
              KEY_PARAM_STREAM: 'STREAM_MUSIC',
            },
            iosVoiceId: 'com.apple.ttsbundle.Samantha-compact',
            rate: 0.5,
          });
          index++;
          // Tts events are not perfectly sequential, but we'll use onDone callback
          // However, Tts.addEventListener can be used; we'll keep it simple and just speak all at once
          // But that's not ideal. Better to chain with onFinish event.
          // Let's use a more robust approach:
        } else {
          index++;
          speakNext();
        }
      };

      // Add listener for finish event
      const finishListener = Tts.addEventListener('finish', () => {
        index++;
        if (index < sentences.length) {
          const nextChunk = sentences[index].substring(0, 180).trim();
          if (nextChunk) {
            Tts.speak(nextChunk);
          } else {
            index++;
          }
        } else {
          setIsSpeaking(false);
          speakingRef.current = false;
        }
      });

      const errorListener = Tts.addEventListener('error', (err) => {
        console.warn('TTS error', err);
        setIsSpeaking(false);
        speakingRef.current = false;
      });

      // Start first chunk
      const firstChunk = sentences[0].substring(0, 180).trim();
      if (firstChunk) {
        Tts.speak(firstChunk);
      }

      // Clean up listeners on stop
      return () => {
        finishListener.remove();
        errorListener.remove();
      };
    }
  };

  const renderMarkdown = () => (
    <Markdown
      style={markdownStyles}
      rules={{
        heading1: (node, children, parent, styles) => (
          <Text key={node.key} style={[styles.heading1, { color: theme.text }]}>
            {children}
          </Text>
        ),
        heading2: (node, children, parent, styles) => (
          <Text key={node.key} style={[styles.heading2, { color: theme.text }]}>
            {children}
          </Text>
        ),
        heading3: (node, children, parent, styles) => (
          <Text key={node.key} style={[styles.heading3, { color: theme.text }]}>
            {children}
          </Text>
        ),
        paragraph: (node, children, parent, styles) => (
          <Text key={node.key} style={[styles.paragraph, { color: theme.secondaryText }]}>
            {children}
          </Text>
        ),
        list_item: (node, children, parent, styles) => (
          <Text key={node.key} style={[styles.list_item, { color: theme.secondaryText }]}>
            • {children}
          </Text>
        ),
      }}
    >
      {displayContent}
    </Markdown>
  );

  const renderSource = (source: { uri: string; title: string }) => (
    <TouchableOpacity
      key={source.uri}
      style={styles.sourceItem}
      onPress={() => Linking.openURL(source.uri)}
    >
      <Text style={[styles.sourceTitle, { color: '#60a5fa' }]} numberOfLines={1}>
        {source.title}
      </Text>
      <ExternalLink size={14} color="#9ca3af" />
    </TouchableOpacity>
  );

  const renderRelatedArticle = ({ item }: { item: Article }) => (
    <View style={styles.articleWrapper}>
      <ArticleCard article={item} onClick={() => onArticleClick && onArticleClick(item)} />
    </View>
  );

  const renderAd = (index: number) => (
    <View style={styles.adWrapper} key={`ad-${index}`}>
      <FeedAd index={index} />
    </View>
  );

  const isQuotaError = result?.text.includes('Quota Exceeded');

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.bg }]}>
        <View style={styles.loader} />
        <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
          Consulting the digital oracle...
        </Text>
      </View>
    );
  }

  if (!result) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} color="#9ca3af" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {!isQuotaError && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={toggleSpeech}
              style={[
                styles.actionButton,
                isSpeaking && styles.speakingButton,
              ]}
            >
              {isSpeaking ? (
                <StopCircle size={14} color="#ec4899" />
              ) : (
                <Volume2 size={14} color="#60a5fa" />
              )}
              <Text style={[styles.actionText, isSpeaking && styles.speakingText]}>
                {isSpeaking ? 'Stop' : 'Listen'}
              </Text>
            </TouchableOpacity>

            <View>
              <TouchableOpacity
                onPress={() => setShowLangMenu(true)}
                style={styles.languageButton}
              >
                {isTranslating ? (
                  <ActivityIndicator size="small" color="#60a5fa" />
                ) : (
                  <Languages size={14} color="#60a5fa" />
                )}
                <Text style={styles.languageText}>{currentLanguage}</Text>
              </TouchableOpacity>

              {/* Language Menu Modal */}
              <Modal visible={showLangMenu} transparent animationType="fade">
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowLangMenu(false)}
                >
                  <View style={[styles.langMenu, { backgroundColor: theme.modalBg }]}>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <TouchableOpacity
                        key={lang}
                        style={styles.langItem}
                        onPress={() => handleLanguageChange(lang)}
                      >
                        <Text
                          style={[
                            styles.langName,
                            currentLanguage === lang && styles.langSelected,
                          ]}
                        >
                          {lang}
                        </Text>
                        {currentLanguage === lang && <Check size={14} color="#3b82f6" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <SearchBar onSearch={onSearch} isSearching={isLoading} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Main result card */}
        <View
          style={[
            styles.resultCard,
            isQuotaError && styles.errorCard,
            { borderColor: theme.border },
          ]}
        >
          {isQuotaError && (
            <View style={styles.errorIcon}>
              <AlertCircle size={24} color="#f97316" />
            </View>
          )}

          {isTranslating ? (
            <View style={styles.translatingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={[styles.translatingText, { color: theme.secondaryText }]}>
                Translating to {currentLanguage}...
              </Text>
            </View>
          ) : (
            renderMarkdown()
          )}

          {result.sources && result.sources.length > 0 && (
            <View style={styles.sourcesContainer}>
              <View style={styles.sourcesHeader}>
                <Globe size={14} color="#6b7280" />
                <Text style={styles.sourcesTitle}>Sources</Text>
              </View>
              {result.sources.map(renderSource)}
            </View>
          )}
        </View>

        {/* Related Articles */}
        {result.relatedArticles && result.relatedArticles.length > 0 && (
          <View style={styles.relatedContainer}>
            <FlatList
              data={result.relatedArticles}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              renderItem={renderRelatedArticle}
              onEndReached={onLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isLoadingMore ? (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color="#3b82f6" />
                  </View>
                ) : !hasMore ? (
                  <View style={styles.footerEnd}>
                    <View style={styles.endLine} />
                    <Text style={styles.endText}>End of results</Text>
                  </View>
                ) : null
              }
              ListFooterComponentStyle={styles.footer}
              scrollEnabled={false} // nested in ScrollView
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const markdownStyles = {
  body: { color: '#fff' },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#fff',
  },
  heading2: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#60a5fa',
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 12,
    color: '#f97316',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  list_item: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderTopColor: '#ec4899',
    borderRightColor: '#3b82f6',
    borderBottomColor: '#f97316',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '45deg' }],
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 60,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  speakingButton: {
    borderColor: '#ec4899',
    backgroundColor: 'rgba(236,72,153,0.1)',
  },
  actionText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '500',
  },
  speakingText: {
    color: '#ec4899',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  languageText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  langMenu: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 160,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  langName: {
    fontSize: 14,
    color: '#d1d5db',
  },
  langSelected: {
    color: '#3b82f6',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
    zIndex: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  errorCard: {
    borderColor: 'rgba(249,115,22,0.3)',
  },
  errorIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    opacity: 0.5,
  },
  translatingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  translatingText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  sourcesContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sourcesTitle: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 6,
  },
  sourceTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  relatedContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  articleWrapper: {
    width: (width - 48) / 2, // two columns with 16px padding each side and gap
  },
  adWrapper: {
    width: '100%',
    marginVertical: 12,
  },
  footer: {
    paddingVertical: 20,
  },
  footerLoader: {
    alignItems: 'center',
  },
  footerEnd: {
    alignItems: 'center',
    gap: 6,
  },
  endLine: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'linear-gradient(90deg, #3b82f6, #a855f7)',
  },
  endText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default SearchResultView;