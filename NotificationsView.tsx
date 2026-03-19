import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { X, Heart, MessageCircle, UserPlus, Zap, Bell, Trash2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { NotificationItem } from '../types';

interface NotificationsViewProps {
  visible: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onClear: () => void;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({
  visible,
  onClose,
  notifications,
  onClear,
}) => {
  const { theme } = useTheme();

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={14} color="#fff" fill="#ec4899" />;
      case 'reply':
        return <MessageCircle size={14} color="#fff" fill="#3b82f6" />;
      case 'follow':
        return <UserPlus size={14} color="#fff" fill="#a855f7" />;
      case 'system':
        return <Zap size={14} color="#fff" fill="#f97316" />;
      default:
        return <Bell size={14} color="#fff" />;
    }
  };

  const getIconBg = (type: string): string => {
    switch (type) {
      case 'like':
        return '#ec4899';
      case 'reply':
        return '#3b82f6';
      case 'follow':
        return '#a855f7';
      case 'system':
        return '#f97316';
      default:
        return '#6b7280';
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { borderBottomColor: theme.border },
        !item.isRead && { backgroundColor: 'rgba(59,130,246,0.05)' },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.userAvatar ? (
          <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.inputBg }]}>
            <Bell size={20} color={theme.secondaryText} />
          </View>
        )}
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: getIconBg(item.type), borderColor: theme.bg },
          ]}
        >
          {getIcon(item.type)}
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.messageText, { color: theme.text }]}>
          {item.user && <Text style={styles.bold}>{item.user} </Text>}
          <Text style={{ color: theme.secondaryText }}>
            {item.type === 'like' && 'liked your post'}
            {item.type === 'reply' && 'replied to you'}
            {item.type === 'follow' && 'started following you'}
            {item.type === 'system' && item.content}
          </Text>
        </Text>

        {item.type === 'reply' && item.content && (
          <Text
            style={[
              styles.replyContent,
              { color: theme.secondaryText, borderLeftColor: theme.border },
            ]}
            numberOfLines={2}
          >
            "{item.content}"
          </Text>
        )}

        <Text style={[styles.timestamp, { color: theme.secondaryText }]}>
          {item.time}
        </Text>
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.navBg }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.iconColor} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
          </View>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={onClear} style={styles.clearButton}>
              <Trash2 size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.inputBg }]}>
                <Bell size={40} color={theme.secondaryText} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No notifications yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
                When people interact with you or when there are system updates, they'll show up here.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 8,
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  replyContent: {
    fontSize: 14,
    marginTop: 4,
    paddingLeft: 12,
    borderLeftWidth: 2,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default NotificationsView;