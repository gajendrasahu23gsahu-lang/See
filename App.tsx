import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  FlatList,
  Alert,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Menu,
  Moon,
  Globe,
  Shield,
  FileText,
  FileEdit,
  Settings,
  Search,
  Loader2,
  Bell,
  Clock,
  ChevronRight,
  LogOut,
  Zap,
  CheckCircle2,
} from 'lucide-react-native';
import { useAuth, AuthProvider } from './context/AuthContext';
import { useTheme, ThemeProvider } from './context/ThemeContext';
import { useLanguage, LanguageProvider } from './context/LanguageContext';
import { ShareProvider } from './context/ShareContext';
import { Tab, Article, MiniBlogPost, SearchResult, Conversation, DraftPost, User, NotificationItem } from './types';
import { fetchTrendingFeed, performSearch, fetchMiniBlogs, fetchRelatedArticles } from './services/geminiService';
import { dbService } from './services/dbService';

// Components (must be converted to React Native versions)
import AuthView from './components/AuthView';
import BottomNav from './components/BottomNav';
import SearchBar from './components/SearchBar';
import ArticleCard from './components/ArticleCard';
import MiniBlogCard from './components/MiniBlogCard';
import ArticleDetailView from './components/ArticleDetailView';
import SearchResultView from './components/SearchResultView';
import UploadView from './components/UploadView';
import ProfileView from './components/ProfileView';
import ChatView from './components/ChatView';
import InboxView from './components/InboxView';
import FeedAd from './components/FeedAd';
import DisplaySettings from './components/DisplaySettings';
import LanguageSettings from './components/LanguageSettings';
import PrivacyPolicyView from './components/PrivacyPolicyView';
import TermsAndConditionsView from './components/TermsAndConditionsView';
import DraftsView from './components/DraftsView';
import ChatSettingsView from './components/ChatSettingsView';
import Logo from './components/Logo';
import NotificationsView from './components/NotificationsView';
import HistoryView from './components/HistoryView';

const { width } = Dimensions.get('window');

const AppContent = () => {
  const { user, isLoading: authLoading, logout, updateProfile } = useAuth();
  const { theme, themeMode } = useTheme();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  
  // Data
  const [articles, setArticles] = useState<Article[]>([]);
  const [miniBlogs, setMiniBlogs] = useState<MiniBlogPost[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreSearch, setHasMoreSearch] = useState(true);

  // View States
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  
  // Menu/Modals
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isArticleMenuOpen, setIsArticleMenuOpen] = useState(false);
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsAndConditions, setShowTermsAndConditions] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [initialDraft, setInitialDraft] = useState<DraftPost | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  // Notifications Mock Data
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', type: 'system', content: 'Welcome to See! The future of search is here.', time: 'Now', isRead: false },
    { id: '2', type: 'like', user: 'Alex Chen', userAvatar: 'https://i.pravatar.cc/150?u=alex', time: '2h ago', isRead: true },
  ]);

  // Pagination & Loading
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [isLoadingMoreBlogs, setIsLoadingMoreBlogs] = useState(false);
  const [blogPage, setBlogPage] = useState(1);
  const [hasMoreBlogs, setHasMoreBlogs] = useState(true);
  
  // Other
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  // Initial Data Fetch
  useEffect(() => {
    if (user) {
      loadArticles();
      loadBlogs();
      loadConversations();
    }
  }, [user]);

  const loadArticles = async () => {
    setIsLoadingArticles(true);
    const data = await fetchTrendingFeed(1);
    setArticles(data);
    setIsLoadingArticles(false);
  };

  const loadBlogs = async (page = 1) => {
    if (page === 1) setIsLoadingMoreBlogs(true);
    const data = await fetchMiniBlogs(page);
    if (page === 1) {
      setMiniBlogs(data);
    } else {
      setMiniBlogs(prev => [...prev, ...data]);
    }
    if (data.length === 0) setHasMoreBlogs(false);
    setIsLoadingMoreBlogs(false);
  };

  const loadConversations = async () => {
    if (user) {
      const chats = await dbService.getConversations(user.id);
      setConversations(chats);
    }
  };

  // Load more blogs when FlatList reaches end
  const handleLoadMoreBlogs = () => {
    if (hasMoreBlogs && !isLoadingMoreBlogs && activeTab === Tab.ARTICLE) {
      const nextPage = blogPage + 1;
      setBlogPage(nextPage);
      loadBlogs(nextPage);
    }
  };

  // Search Handler
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    setSearchPage(1);
    setHasMoreSearch(true);
    
    // Save to history using AsyncStorage
    const historyKey = 'see_search_history';
    try {
      const rawHistory = await AsyncStorage.getItem(historyKey);
      let history: { query: string; timestamp: number }[] = rawHistory ? JSON.parse(rawHistory) : [];
      history = history.filter(item => item.query.toLowerCase() !== query.toLowerCase());
      history.unshift({ query: query.trim(), timestamp: Date.now() });
      if (history.length > 50) history = history.slice(0, 50);
      await AsyncStorage.setItem(historyKey, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save search history', error);
    }

    const result = await performSearch(query);
    setSearchResult(result);
    setIsSearching(false);
    setShowHistory(false);
  };

  const handlePost = async (data: any) => {
    if (!user) return;
    const newPost: any = {
      authorName: user.name,
      authorHandle: user.handle,
      authorAvatar: user.avatar,
      content: data.content,
      imageUrl: data.image,
      videoUrl: data.video,
      audioUrl: data.audio,
      location: data.location,
      isVerified: user.isVerified,
      user_id: user.id
    };
    await dbService.createPost(newPost);
    // Refresh blogs locally
    setMiniBlogs(prev => [{...newPost, id: `new_${Date.now()}`, timestamp: 'Just now', likes: '0', replies: '0', reposts: '0', views: '0'}, ...prev]);
    setShowUpload(false);
    setActiveTab(Tab.ARTICLE);
  };

  // Toast effect
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  if (authLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  // --- Render Logic ---

  // Full screen overlays (Modals)
  if (showUpload) {
    return (
      <UploadView
        onClose={() => { setShowUpload(false); setInitialDraft(null); }}
        onPost={handlePost}
        currentUserAvatar={user.avatar}
        initialDraft={initialDraft}
      />
    );
  }

  if (selectedArticle) {
    return (
      <ArticleDetailView
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onArticleSelect={setSelectedArticle}
      />
    );
  }

  if (searchQuery) {
    return (
      <SearchResultView
        result={searchResult}
        isLoading={isSearching}
        onBack={() => { setSearchQuery(''); setSearchResult(null); }}
        onSearch={handleSearch}
        onArticleClick={setSelectedArticle}
      />
    );
  }

  if (viewingProfile) {
    return (
      <ProfileView
        currentUserId={user.id}
        userData={viewingProfile}
        isOwnProfile={viewingProfile.id === user.id}
        onBack={() => setViewingProfile(null)}
        onUploadClick={() => setShowUpload(true)}
        onMessageClick={() => {
          setViewingProfile(null);
          const existing = conversations.find(c => c.id === viewingProfile.id);
          if (existing) setSelectedChat(existing);
          else {
            setSelectedChat({
              id: viewingProfile.id,
              name: viewingProfile.name,
              avatar: viewingProfile.avatar,
              handle: viewingProfile.handle,
              isVerified: viewingProfile.isVerified,
              lastMessage: '',
              time: ''
            });
          }
          setActiveTab(Tab.CHAT);
        }}
        onUpdateProfile={viewingProfile.id === user.id ? async (data) => {
          try {
            await updateProfile(data);
            setViewingProfile(prev => prev ? ({...prev, ...data}) : null);
            setToast({ show: true, message: 'Profile updated!' });
          } catch (e) {
            setToast({ show: true, message: 'Failed to update profile.' });
          }
        } : undefined}
      />
    );
  }

  if (selectedChat) {
    return (
      <ChatView
        conversation={selectedChat}
        currentUserId={user.id}
        currentUserAvatar={user.avatar}
        onBack={() => { setSelectedChat(null); loadConversations(); }}
        onBlockToggle={() => {
          // Toggle block logic implementation
        }}
      />
    );
  }

  // Settings Modals
  const renderSettingsModals = () => (
    <>
      <Modal visible={showDisplaySettings} animationType="slide" onRequestClose={() => setShowDisplaySettings(false)}>
        <DisplaySettings onClose={() => setShowDisplaySettings(false)} />
      </Modal>
      <Modal visible={showLanguageSettings} animationType="slide" onRequestClose={() => setShowLanguageSettings(false)}>
        <LanguageSettings onClose={() => setShowLanguageSettings(false)} />
      </Modal>
      <Modal visible={showPrivacyPolicy} animationType="slide" onRequestClose={() => setShowPrivacyPolicy(false)}>
        <PrivacyPolicyView onClose={() => setShowPrivacyPolicy(false)} />
      </Modal>
      <Modal visible={showTermsAndConditions} animationType="slide" onRequestClose={() => setShowTermsAndConditions(false)}>
        <TermsAndConditionsView onClose={() => setShowTermsAndConditions(false)} />
      </Modal>
      <Modal visible={showDrafts} animationType="slide" onRequestClose={() => setShowDrafts(false)}>
        <DraftsView onClose={() => setShowDrafts(false)} onSelectDraft={(d) => { setInitialDraft(d); setShowDrafts(false); setShowUpload(true); }} />
      </Modal>
      <Modal visible={showChatSettings} animationType="slide" onRequestClose={() => setShowChatSettings(false)}>
        <ChatSettingsView onClose={() => setShowChatSettings(false)} userHandle={user.handle} />
      </Modal>
      <Modal visible={showHistory} animationType="slide" onRequestClose={() => setShowHistory(false)}>
        <HistoryView onClose={() => setShowHistory(false)} onSelectQuery={handleSearch} />
      </Modal>
      <Modal visible={showNotifications} animationType="slide" onRequestClose={() => setShowNotifications(false)}>
        <NotificationsView onClose={() => setShowNotifications(false)} notifications={notifications} onClear={() => setNotifications([])} />
      </Modal>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      {renderSettingsModals()}
      
      {/* Toast */}
      {toast.show && (
        <View style={styles.toastContainer}>
          <View style={[styles.toast, { backgroundColor: 'white' }]}>
            <CheckCircle2 size={16} color="#10b981" />
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        </View>
      )}

      {/* Bottom Navigation Padding */}
      <View style={styles.content}>
        
        {/* TAB: HOME (News Feed) */}
        {activeTab === Tab.HOME && (
          <View style={styles.tabContainer}>
             
             {/* Side Menu Drawer */}
             {isSideMenuOpen && (
               <>
                 <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsSideMenuOpen(false)} />
                 <View style={[styles.sideMenu, { backgroundColor: theme.bg, borderRightColor: theme.border }]}>
                   <View style={[styles.sideMenuHeader, { borderBottomColor: theme.border }]}>
                     <Image source={{ uri: user.avatar }} style={styles.avatar} />
                     <View>
                       <Text style={[styles.userName, { color: theme.text }]}>{user.name}</Text>
                       <Text style={[styles.userHandle, { color: theme.secondaryText }]}>{user.handle}</Text>
                     </View>
                   </View>
                   <ScrollView style={styles.sideMenuContent}>
                     <TouchableOpacity onPress={() => { setShowHistory(true); setIsSideMenuOpen(false); }} style={styles.menuItem}>
                       <View style={styles.menuItemLeft}>
                         <Clock size={20} color="#60a5fa" />
                         <Text style={[styles.menuItemText, { color: theme.text }]}>History</Text>
                       </View>
                       <ChevronRight size={16} color={theme.secondaryText} />
                     </TouchableOpacity>
                     <TouchableOpacity onPress={() => { setShowDrafts(true); setIsSideMenuOpen(false); }} style={styles.menuItem}>
                       <View style={styles.menuItemLeft}>
                         <FileEdit size={20} color="#fb923c" />
                         <Text style={[styles.menuItemText, { color: theme.text }]}>Drafts</Text>
                       </View>
                       <ChevronRight size={16} color={theme.secondaryText} />
                     </TouchableOpacity>
                     <TouchableOpacity onPress={() => { setShowDisplaySettings(true); setIsSideMenuOpen(false); }} style={styles.menuItem}>
                       <View style={styles.menuItemLeft}>
                         <Moon size={20} color="#c084fc" />
                         <Text style={[styles.menuItemText, { color: theme.text }]}>{t('dark_mode')}</Text>
                       </View>
                       <ChevronRight size={16} color={theme.secondaryText} />
                     </TouchableOpacity>
                     <TouchableOpacity onPress={() => { setShowLanguageSettings(true); setIsSideMenuOpen(false); }} style={styles.menuItem}>
                       <View style={styles.menuItemLeft}>
                         <Globe size={20} color="#4ade80" />
                         <Text style={[styles.menuItemText, { color: theme.text }]}>{t('language')}</Text>
                       </View>
                       <ChevronRight size={16} color={theme.secondaryText} />
                     </TouchableOpacity>
                     <View style={[styles.divider, { backgroundColor: theme.border }]} />
                     <TouchableOpacity onPress={() => { logout(); setIsSideMenuOpen(false); }} style={styles.menuItemLogout}>
                       <LogOut size={20} color="#ef4444" />
                       <Text style={styles.logoutText}>{t('sign_out')}</Text>
                     </TouchableOpacity>
                   </ScrollView>
                 </View>
               </>
             )}

            {/* Menu Button (Top Left) */}
            <TouchableOpacity
              onPress={() => setIsSideMenuOpen(true)}
              style={[styles.menuButton, { backgroundColor: theme.bg, borderColor: theme.border }]}
            >
              <Menu size={24} color="#9ca3af" />
            </TouchableOpacity>

            {/* Notifications Button (Top Right) */}
            <TouchableOpacity
              onPress={() => setShowNotifications(true)}
              style={[styles.notificationButton, { backgroundColor: theme.bg, borderColor: theme.border }]}
            >
              <Bell size={24} color="#9ca3af" />
              {notifications.some(n => !n.isRead) && (
                <View style={styles.notificationBadge} />
              )}
            </TouchableOpacity>

            {/* Main Header Content */}
            <Logo />
            <SearchBar onSearch={handleSearch} isSearching={isSearching} />
            
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.homeScrollContent}
            >
              <View style={styles.discoverHeader}>
                <Zap size={18} color="#f97316" />
                <Text style={[styles.discoverText, { color: theme.text }]}>{t('discover')}</Text>
              </View>
              {articles.map((article, idx) => (
                <View key={article.id}>
                  <View style={styles.articleCardContainer}>
                    <ArticleCard article={article} onClick={() => setSelectedArticle(article)} />
                  </View>
                  {(idx + 1) % 5 === 0 && <FeedAd index={idx} />}
                </View>
              ))}
              {isLoadingArticles && (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={theme.text} />
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* TAB: ARTICLE (Social Feed / Mini Blogs) */}
        {activeTab === Tab.ARTICLE && (
          <View style={[styles.articleTabContainer, { borderColor: theme.border }]}>
            {isArticleMenuOpen && (
              <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsArticleMenuOpen(false)} />
            )}
            <View style={[styles.articleHeader, { backgroundColor: theme.navBg, borderBottomColor: theme.border }]}>
              <View style={styles.articleHeaderLeft}>
                <TouchableOpacity
                  onPress={() => setIsArticleMenuOpen(!isArticleMenuOpen)}
                  style={styles.menuIcon}
                >
                  <Menu size={20} color={theme.text} />
                </TouchableOpacity>
                {isArticleMenuOpen && (
                  <View style={[styles.articleMenu, { backgroundColor: theme.modalBg, borderColor: theme.border }]}>
                    <TouchableOpacity onPress={() => { setShowDisplaySettings(true); setIsArticleMenuOpen(false); }} style={[styles.articleMenuItem, { borderBottomColor: theme.border }]}>
                      <Moon size={18} color="#c084fc" />
                      <Text style={[styles.articleMenuText, { color: theme.text }]}>{t('dark_mode')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setShowLanguageSettings(true); setIsArticleMenuOpen(false); }} style={[styles.articleMenuItem, { borderBottomColor: theme.border }]}>
                      <Globe size={18} color="#60a5fa" />
                      <Text style={[styles.articleMenuText, { color: theme.text }]}>{t('language')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setShowPrivacyPolicy(true); setIsArticleMenuOpen(false); }} style={[styles.articleMenuItem, { borderBottomColor: theme.border }]}>
                      <Shield size={18} color="#4ade80" />
                      <Text style={[styles.articleMenuText, { color: theme.text }]}>{t('privacy')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setShowTermsAndConditions(true); setIsArticleMenuOpen(false); }} style={[styles.articleMenuItem, { borderBottomColor: theme.border }]}>
                      <FileText size={18} color="#9ca3af" />
                      <Text style={[styles.articleMenuText, { color: theme.text }]}>Terms of Service</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setShowDrafts(true); setIsArticleMenuOpen(false); }} style={[styles.articleMenuItem, { borderBottomColor: theme.border }]}>
                      <FileEdit size={18} color="#fb923c" />
                      <Text style={[styles.articleMenuText, { color: theme.text }]}>Drafts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setShowChatSettings(true); setIsArticleMenuOpen(false); }} style={styles.articleMenuItem}>
                      <Settings size={18} color={theme.text} />
                      <Text style={[styles.articleMenuText, { color: theme.text }]}>{t('settings')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={[styles.articleHeaderTitle, { color: theme.text }]}>See</Text>
              <TouchableOpacity
                onPress={() => setActiveTab(Tab.HOME)}
                style={styles.menuIcon}
              >
                <Search size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              ref={flatListRef}
              data={miniBlogs.filter(post => !blockedUsers.includes(post.user_id || `user_${post.authorHandle.replace('@', '')}`))}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    const u: User = {
                      id: item.user_id || '',
                      name: item.authorName,
                      handle: item.authorHandle,
                      avatar: item.authorAvatar,
                      email: '',
                      bio: '',
                      followers: 0,
                      following: 0,
                      isVerified: item.isVerified,
                      createdAt: '',
                      banner: ''
                    };
                    setViewingProfile(u);
                  }}
                >
                  <MiniBlogCard post={item} isOwner={item.user_id === user.id} onDelete={() => { /* Implement delete */ }} />
                </TouchableOpacity>
              )}
              onEndReached={handleLoadMoreBlogs}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() => (
                <View style={styles.footer}>
                  {isLoadingMoreBlogs && <ActivityIndicator size="small" color="#ec4899" />}
                  {!hasMoreBlogs && !isLoadingMoreBlogs && miniBlogs.length > 0 && (
                    <>
                      <View style={styles.footerLine} />
                      <Text style={styles.footerText}>You've reached the end of the galaxy.</Text>
                      <Text style={styles.footerSubText}>No more posts to show.</Text>
                    </>
                  )}
                </View>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={{ color: theme.secondaryText }}>No updates yet.</Text>
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* TAB: PROFILE */}
        {activeTab === Tab.PROFILE && (
          <ProfileView
            currentUserId={user.id}
            userData={user}
            isOwnProfile={true}
            onUploadClick={() => setShowUpload(true)}
            onMessageClick={() => setActiveTab(Tab.CHAT)}
            onUpdateProfile={async (data) => {
              try {
                await updateProfile(data);
                setToast({ show: true, message: 'Profile updated successfully!' });
              } catch (e) {
                console.error(e);
                setToast({ show: true, message: 'Failed to save profile. Image might be too large.' });
              }
            }}
          />
        )}

        {/* TAB: CHAT */}
        {activeTab === Tab.CHAT && (
          <InboxView
            conversations={conversations}
            onSelectChat={setSelectedChat}
            blockedUsers={blockedUsers}
            onBack={() => setActiveTab(Tab.HOME)}
          />
        )}

      </View>

      <BottomNav
        activeTab={activeTab}
        onTabChange={(t) => {
          if (t === Tab.UPLOAD) {
            setShowUpload(true);
          } else {
            setActiveTab(t);
            setSearchQuery('');
            setSelectedArticle(null);
            setSelectedChat(null);
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingBottom: 80, // Space for BottomNav
  },
  tabContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 40,
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.7,
    maxWidth: 300,
    borderRightWidth: 1,
    zIndex: 50,
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userHandle: {
    fontSize: 12,
  },
  sideMenuContent: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
    marginHorizontal: 16,
  },
  menuButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 30,
    padding: 10,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  notificationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 30,
    padding: 10,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#000',
  },
  homeScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  discoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 100, // Space for absolute buttons and logo
  },
  discoverText: {
    fontSize: 18,
    fontWeight: '600',
  },
  articleCardContainer: {
    height: 400,
    marginBottom: 16,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  articleTabContainer: {
    flex: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  articleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  menuIcon: {
    padding: 8,
    marginLeft: -8,
    marginRight: -8,
  },
  articleHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  articleMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    width: 256,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 50,
  },
  articleMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  articleMenuText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  footerLine: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'linear-gradient(90deg, #ec4899, #f97316)',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
  },
  footerSubText: {
    fontSize: 10,
    opacity: 0.5,
    color: '#6b7280',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  toastContainer: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    zIndex: 80,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  toastText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <ShareProvider>
            <AppContent />
          </ShareProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}