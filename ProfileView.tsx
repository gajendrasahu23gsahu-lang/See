import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  MoreVertical,
  Search,
  MessageCircle,
  TrendingUp,
  Plus,
  CheckCircle2,
  Camera,
  X,
  MapPin,
  Link as LinkIcon,
  Share2,
  Flag,
  BadgeCheck,
  User as UserIcon,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import MiniBlogCard from './MiniBlogCard';
import { MiniBlogPost, User } from '../types';
import { dbService } from '../services/dbService';
import { useShare } from '../context/ShareContext';
import { useAuth } from '../context/ShareContext'; // Fix: should be AuthContext

const { width } = Dimensions.get('window');

interface ProfileViewProps {
  onUploadClick: () => void;
  onMessageClick: () => void;
  onBack?: () => void;
  onBlock?: () => void;
  onUpdateProfile?: (data: any) => void;
  onViewProfile?: (user: User) => void;
  isBlocked?: boolean;
  isOwnProfile?: boolean;
  userData?: any;
  currentUserId: string;
  posts?: MiniBlogPost[];
  onDeletePost?: (postId: string) => void;
}

const defaultProfile = {
  id: '',
  name: '',
  handle: '',
  bio: '',
  avatar: '',
  banner: '',
  following: 0,
  followers: 0,
  reach: '0',
  isVerified: false,
  location: '',
  website: '',
};

export default function ProfileView({
  onUploadClick,
  onMessageClick,
  onBack,
  onBlock,
  onUpdateProfile,
  onViewProfile,
  isBlocked = false,
  isOwnProfile = true,
  userData,
  currentUserId,
  posts = [],
  onDeletePost,
}: ProfileViewProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(t('posts'));
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userList, setUserList] = useState<User[]>([]);
  const { theme } = useTheme();
  const { openShare } = useShare();
  const { logout } = useAuth();
  const navigation = useNavigation();

  // Merge default with user data
  const profile = userData || defaultProfile;
  const displayProfile = {
    ...defaultProfile,
    ...profile,
    followers: typeof profile.followers === 'string' ? parseInt(profile.followers) : profile.followers,
    following: typeof profile.following === 'string' ? parseInt(profile.following) : profile.following,
  };

  // Edit form state
  const [editForm, setEditForm] = useState(displayProfile);
  const [localFollowersCount, setLocalFollowersCount] = useState(displayProfile.followers);
  const [localFollowingCount, setLocalFollowingCount] = useState(displayProfile.following);

  const tabs = [t('posts'), t('following'), t('followers')];

  // Check follow status on mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!isOwnProfile && displayProfile.id && currentUserId) {
        const status = await dbService.isFollowing(currentUserId, displayProfile.id);
        setIsFollowing(status);
      }
    };
    checkFollowStatus();
    setLocalFollowersCount(displayProfile.followers);
    setLocalFollowingCount(displayProfile.following);
  }, [displayProfile.id, currentUserId, isOwnProfile]);

  // Load user lists for tabs
  useEffect(() => {
    const loadTabContent = async () => {
      setUserList([]);
      if (activeTab === t('followers')) {
        const followers = await dbService.getFollowers(displayProfile.id);
        setUserList(followers);
      } else if (activeTab === t('following')) {
        const following = await dbService.getFollowing(displayProfile.id);
        setUserList(following);
      }
    };
    loadTabContent();
  }, [activeTab, displayProfile.id, t]);

  const handleSaveProfile = () => {
    if (onUpdateProfile) {
      onUpdateProfile(editForm);
    }
    setIsEditing(false);
  };

  const pickImage = async (field: 'avatar' | 'banner') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'We need access to your photo library to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      // Basic size check (if possible) – we can't easily check file size in bytes here.
      // For now, just set the uri.
      setEditForm((prev) => ({ ...prev, [field]: asset.uri }));
    }
  };

  const handleCopyLink = () => {
    // In React Native, we'd use Clipboard
    setShowMenu(false);
    Alert.alert('Profile link copied!');
  };

  const handleShareProfile = () => {
    setShowMenu(false);
    openShare({
      title: displayProfile.name,
      text: `Check out ${displayProfile.name} (@${displayProfile.handle}) on See.`,
    });
  };

  const handleFollowToggle = async () => {
    if (isBlocked || !currentUserId || !displayProfile.id) return;

    if (isFollowing) {
      await dbService.unfollowUser(currentUserId, displayProfile.id);
      setIsFollowing(false);
      setLocalFollowersCount((prev) => Math.max(0, prev - 1));
    } else {
      await dbService.followUser(currentUserId, displayProfile.id);
      setIsFollowing(true);
      setLocalFollowersCount((prev) => prev + 1);
    }

    // Refresh list if we are on followers tab
    if (activeTab === t('followers')) {
      const followers = await dbService.getFollowers(displayProfile.id);
      setUserList(followers);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.userItem, { borderBottomColor: theme.border }]}
      onPress={() => onViewProfile && onViewProfile(item)}
    >
      <View style={styles.userItemLeft}>
        <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
        <View>
          <View style={styles.userNameRow}>
            <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
            {item.isVerified && <BadgeCheck size={14} color="#3b82f6" />}
          </View>
          <Text style={[styles.userHandle, { color: theme.secondaryText }]}>{item.handle}</Text>
        </View>
      </View>
      {item.id !== currentUserId && (
        <TouchableOpacity style={[styles.viewButton, { borderColor: theme.border }]}>
          <Text style={[styles.viewButtonText, { color: theme.text }]}>View</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  // If editing, show edit profile screen
  if (isEditing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[styles.editHeader, { borderBottomColor: theme.border, backgroundColor: theme.navBg }]}>
          <View style={styles.editHeaderLeft}>
            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.editCloseButton}>
              <X size={20} color={theme.iconColor} />
            </TouchableOpacity>
            <Text style={[styles.editTitle, { color: theme.text }]}>{t('edit_profile')}</Text>
          </View>
          <TouchableOpacity onPress={handleSaveProfile} style={[styles.saveButton, { backgroundColor: theme.buttonPrimary }]}>
            <Text style={styles.saveButtonText}>{t('save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.editScroll}>
          {/* Banner Edit */}
          <View style={styles.bannerContainer}>
            {editForm.banner ? (
              <Image source={{ uri: editForm.banner }} style={styles.bannerImage} />
            ) : (
              <View style={styles.bannerPlaceholder} />
            )}
            <View style={styles.bannerButtons}>
              <TouchableOpacity style={styles.iconButton} onPress={() => pickImage('banner')}>
                <Camera size={20} color="#fff" />
              </TouchableOpacity>
              {editForm.banner && (
                <TouchableOpacity style={styles.iconButton} onPress={() => setEditForm((p) => ({ ...p, banner: '' }))}>
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Avatar Edit */}
          <View style={styles.avatarEditContainer}>
            <View style={[styles.avatarWrapper, { borderColor: theme.cutoutBorder, backgroundColor: theme.bg }]}>
              <Image source={{ uri: editForm.avatar }} style={styles.avatarEdit} />
              <TouchableOpacity style={styles.avatarEditButton} onPress={() => pickImage('avatar')}>
                <Camera size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.secondaryText }]}>Name</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]}
                value={editForm.name}
                onChangeText={(text) => setEditForm((p) => ({ ...p, name: text }))}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.secondaryText }]}>Bio</Text>
              <TextInput
                style={[styles.textarea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]}
                value={editForm.bio}
                onChangeText={(text) => setEditForm((p) => ({ ...p, bio: text }))}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.secondaryText }]}>Location</Text>
              <View style={styles.iconInput}>
                <MapPin size={18} color={theme.secondaryText} style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputWithIcon, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]}
                  value={editForm.location}
                  onChangeText={(text) => setEditForm((p) => ({ ...p, location: text }))}
                  placeholder="Add location (Optional)"
                  placeholderTextColor={theme.secondaryText}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.secondaryText }]}>Website</Text>
              <View style={styles.iconInput}>
                <LinkIcon size={18} color={theme.secondaryText} style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputWithIcon, { color: '#60a5fa', borderColor: theme.border, backgroundColor: theme.inputBg }]}
                  value={editForm.website}
                  onChangeText={(text) => setEditForm((p) => ({ ...p, website: text }))}
                  placeholder="Add website (Optional)"
                  placeholderTextColor={theme.secondaryText}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack || (() => navigation.goBack())} style={styles.headerButton}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.headerButton}>
          <MoreVertical size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        {displayProfile.banner ? (
          <Image source={{ uri: displayProfile.banner }} style={styles.bannerImage} />
        ) : (
          <View style={[styles.bannerGradient, { backgroundColor: 'linear-gradient(135deg, #ec4899, #3b82f6, #f97316)' }]} />
        )}
      </View>

      {/* Avatar - centered */}
      <View style={styles.avatarContainer}>
        <View style={[styles.avatarBorder, { borderColor: theme.cutoutBorder }]}>
          <Image source={{ uri: displayProfile.avatar }} style={styles.avatar} />
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.text }]}>{displayProfile.name}</Text>
          {displayProfile.isVerified && <BadgeCheck size={24} color="#3b82f6" />}
        </View>

        <View style={styles.actionButtons}>
          {isOwnProfile ? (
            <>
              <TouchableOpacity onPress={onMessageClick} style={[styles.iconAction, { borderColor: theme.border }]}>
                <MessageCircle size={16} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setEditForm(displayProfile);
                  setIsEditing(true);
                }}
                style={[styles.editButton, { borderColor: theme.border }]}
              >
                <Text style={[styles.editButtonText, { color: theme.text }]}>{t('edit_profile')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={onMessageClick} style={[styles.iconAction, { borderColor: theme.border }]}>
                <MessageCircle size={18} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleFollowToggle}
                disabled={isBlocked}
                style={[
                  styles.followButton,
                  isBlocked
                    ? styles.blockedButton
                    : isFollowing
                    ? [styles.followingButton, { borderColor: theme.border }]
                    : { backgroundColor: theme.buttonPrimary },
                ]}
              >
                <Text
                  style={[
                    styles.followButtonText,
                    isBlocked
                      ? { color: '#fff' }
                      : isFollowing
                      ? { color: theme.text }
                      : { color: '#000' },
                  ]}
                >
                  {isBlocked ? t('blocked') : isFollowing ? t('following') : t('follow')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={[styles.handle, { color: theme.secondaryText }]}>{displayProfile.handle}</Text>
        <Text style={[styles.bio, { color: theme.text }]}>{displayProfile.bio}</Text>

        {/* Location/Website */}
        <View style={styles.metaRow}>
          {displayProfile.location && (
            <View style={styles.metaItem}>
              <MapPin size={16} color={theme.secondaryText} />
              <Text style={[styles.metaText, { color: theme.secondaryText }]}>{displayProfile.location}</Text>
            </View>
          )}
          {displayProfile.website && (
            <View style={styles.metaItem}>
              <LinkIcon size={16} color={theme.secondaryText} />
              <Text style={[styles.metaText, { color: '#60a5fa' }]}>{displayProfile.website}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity onPress={() => setActiveTab(t('following'))} style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{localFollowingCount}</Text>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>{t('following')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab(t('followers'))} style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{localFollowersCount}</Text>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>{t('followers')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tab}>
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.text : theme.secondaryText }]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={[styles.activeIndicator, { backgroundColor: '#1d9bf0' }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === t('posts') ? (
        posts.length > 0 ? (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MiniBlogCard post={item} isOwner={isOwnProfile} onDelete={() => onDeletePost && onDeletePost(item.id)} />
            )}
            contentContainerStyle={styles.postsList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No content to show yet.</Text>
          </View>
        )
      ) : activeTab === t('followers') || activeTab === t('following') ? (
        <FlatList
          data={userList}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No users found.</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Nothing to see here yet</Text>
        </View>
      )}

      {/* Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={[styles.menu, { backgroundColor: theme.modalBg, borderColor: theme.border }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleCopyLink}>
              <LinkIcon size={16} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>{t('copy_link')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleShareProfile}>
              <Share2 size={16} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>{t('share_profile')}</Text>
            </TouchableOpacity>
            {!isOwnProfile && (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
                  <Flag size={16} color={theme.text} />
                  <Text style={[styles.menuText, { color: theme.text }]}>Report User</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    if (onBlock) onBlock();
                    setShowMenu(false);
                  }}
                >
                  <Text style={[styles.menuText, { color: '#ef4444' }]}>{isBlocked ? 'Unblock User' : 'Block User'}</Text>
                </TouchableOpacity>
              </>
            )}
            {isOwnProfile && (
              <TouchableOpacity style={styles.menuItem} onPress={() => logout()}>
                <LogOut size={16} color="#ef4444" />
                <Text style={[styles.menuText, { color: '#ef4444' }]}>{t('sign_out')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FAB for own profile */}
      {isOwnProfile && (
        <TouchableOpacity style={styles.fab} onPress={onUploadClick}>
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'transparent',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    height: 144,
    width: '100%',
    backgroundColor: '#1f2937',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    width: '100%',
    height: '100%',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: 16,
  },
  avatarBorder: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'linear-gradient(135deg, #ec4899, #3b82f6)',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#000',
  },
  profileInfo: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 999,
  },
  blockedButton: {
    backgroundColor: '#dc2626',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  handle: {
    fontSize: 14,
    marginBottom: 8,
  },
  bio: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginTop: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  postsList: {
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'linear-gradient(135deg, #ec4899, #f97316)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  // User list item
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  userHandle: {
    fontSize: 12,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Edit screen styles
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  editHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editCloseButton: {
    padding: 4,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  editScroll: {
    paddingBottom: 40,
  },
  bannerContainer: {
    height: 144,
    width: '100%',
    position: 'relative',
  },
  bannerPlaceholder: {
    height: '100%',
    backgroundColor: '#1f2937',
  },
  bannerButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditContainer: {
    alignItems: 'center',
    marginTop: -30,
    marginBottom: 16,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarEdit: {
    width: '100%',
    height: '100%',
  },
  avatarEditButton: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    paddingHorizontal: 16,
    gap: 20,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 96,
    textAlignVertical: 'top',
  },
  iconInput: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
  },
  inputWithIcon: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingLeft: 40,
    paddingRight: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  menu: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: 180,
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
});