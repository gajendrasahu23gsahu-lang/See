import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import {
  BadgeCheck,
  ArrowLeft,
  MessageSquareDashed,
  MoreHorizontal,
  Trash2,
  X,
  Check,
  CheckCircle2,
  Circle,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Conversation } from '../types';

interface InboxViewProps {
  conversations: Conversation[];
  onSelectChat: (chat: Conversation) => void;
  blockedUsers?: string[];
  onBack?: () => void;
  onDelete?: (ids: string[]) => void;
}

export default function InboxView({
  conversations,
  onSelectChat,
  blockedUsers = [],
  onBack,
  onDelete,
}: InboxViewProps) {
  const { theme } = useTheme();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMenu, setShowMenu] = useState(false);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const enterSelectionMode = () => {
    setIsSelectionMode(true);
    setShowMenu(false);
    setSelectedIds(new Set());
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleDelete = () => {
    if (onDelete && selectedIds.size > 0) {
      onDelete(Array.from(selectedIds));
      exitSelectionMode();
    }
  };

  // Long press handler
  const handleLongPress = (id: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedIds(new Set([id]));
    }
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const isBlocked = blockedUsers.includes(item.id);
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          { borderBottomColor: theme.border },
          isSelected && { backgroundColor: 'rgba(236,72,153,0.1)' },
        ]}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelection(item.id);
          } else {
            onSelectChat({ ...item, isBlocked });
          }
        }}
        onLongPress={() => handleLongPress(item.id)}
        activeOpacity={0.7}
      >
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <View style={styles.checkbox}>
            {isSelected ? (
              <CheckCircle2 size={24} color="#ec4899" />
            ) : (
              <Circle size={24} color="#6b7280" />
            )}
          </View>
        )}

        {/* Avatar */}
        <Image
          source={{
            uri:
              item.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                item.name
              )}&background=random`,
          }}
          style={[styles.avatar, { borderColor: theme.border }]}
        />

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
            {item.isVerified && (
              <BadgeCheck size={14} color="#3b82f6" />
            )}
          </View>
          <View style={styles.messageRow}>
            <Text
              style={[
                styles.lastMessage,
                { color: theme.secondaryText },
                isBlocked && styles.blockedText,
              ]}
              numberOfLines={1}
            >
              {isBlocked ? 'Blocked' : item.lastMessage || 'Start chatting'}
            </Text>
            {item.time ? (
              <Text style={[styles.time, { color: theme.secondaryText }]}>
                {item.time}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.border,
            backgroundColor: theme.navBg,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          {isSelectionMode ? (
            <TouchableOpacity onPress={exitSelectionMode} style={styles.headerButton}>
              <X size={24} color={theme.iconColor} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onBack} style={styles.headerButton}>
              <ArrowLeft size={24} color={theme.iconColor} />
            </TouchableOpacity>
          )}
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isSelectionMode ? `${selectedIds.size} Selected` : 'Messages'}
          </Text>
        </View>

        <View>
          {isSelectionMode ? (
            <TouchableOpacity
              onPress={handleDelete}
              disabled={selectedIds.size === 0}
              style={[
                styles.headerButton,
                selectedIds.size > 0 && styles.deleteButtonActive,
              ]}
            >
              <Trash2
                size={24}
                color={selectedIds.size > 0 ? '#ef4444' : '#4b5563'}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setShowMenu(true)}
              style={styles.headerButton}
            >
              <MoreHorizontal size={24} color={theme.iconColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Dropdown Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View
            style={[
              styles.menuContainer,
              { backgroundColor: theme.modalBg, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                enterSelectionMode();
              }}
            >
              <CheckCircle2 size={16} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>
                Select Messages
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* List */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[styles.emptyIcon, { backgroundColor: theme.inputBg }]}
            >
              <MessageSquareDashed size={40} color="#9ca3af" />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Your inbox is empty
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
              Once you start a conversation with a profile, it will show up here.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={onBack}>
              <Text style={styles.emptyButtonText}>Find People</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  deleteButtonActive: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
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
    padding: 12,
    gap: 8,
  },
  menuText: {
    fontSize: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  checkbox: {
    marginRight: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  blockedText: {
    fontStyle: 'italic',
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    minHeight: 400,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  emptyButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  emptyButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});