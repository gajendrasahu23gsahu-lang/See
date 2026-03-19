import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  X,
  Trash2,
  Clock,
  FileText,
  Image as ImageIcon,
  Mic,
  MapPin,
  BarChart2,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { DraftPost } from '../types';

interface DraftsViewProps {
  onClose: () => void;
  onSelectDraft: (draft: DraftPost) => void;
}

const DraftsView: React.FC<DraftsViewProps> = ({ onClose, onSelectDraft }) => {
  const { theme } = useTheme();
  const [drafts, setDrafts] = useState<DraftPost[]>([]);

  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const savedDrafts = await AsyncStorage.getItem('see_local_drafts');
        setDrafts(savedDrafts ? JSON.parse(savedDrafts) : []);
      } catch (error) {
        console.error('Failed to load drafts', error);
      }
    };
    loadDrafts();
  }, []);

  const handleDelete = async (index: number) => {
    const newDrafts = drafts.filter((_, i) => i !== index);
    setDrafts(newDrafts);
    await AsyncStorage.setItem('see_local_drafts', JSON.stringify(newDrafts));
  };

  const handleClearAll = () => {
    Alert.alert('Clear all drafts', 'Are you sure you want to delete all drafts?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          setDrafts([]);
          await AsyncStorage.removeItem('see_local_drafts');
        },
      },
    ]);
  };

  const renderItem = ({ item, index }: { item: DraftPost; index: number }) => (
    <TouchableOpacity
      style={[styles.draftItem, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
      onPress={() => onSelectDraft(item)}
      activeOpacity={0.7}
    >
      <View style={styles.draftHeader}>
        <View style={styles.timeContainer}>
          <Clock size={12} color="#9ca3af" />
          <Text style={styles.timeText}>
            {new Date(item.timestamp).toLocaleDateString()} •{' '}
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Delete draft', 'Delete this draft?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => handleDelete(index),
              },
            ]);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <Text
        style={[styles.draftText, !item.text && styles.placeholderText]}
        numberOfLines={2}
      >
        {item.text || 'Untitled Draft'}
      </Text>

      <View style={styles.metaContainer}>
        {item.media && (
          <View style={styles.metaBadge}>
            <ImageIcon size={12} color="#9ca3af" />
            <Text style={styles.metaText}>{item.media.type === 'video' ? 'Video' : 'Image'}</Text>
          </View>
        )}
        {item.audio && (
          <View style={styles.metaBadge}>
            <Mic size={12} color="#9ca3af" />
            <Text style={styles.metaText}>Audio</Text>
          </View>
        )}
        {item.location && (
          <View style={styles.metaBadge}>
            <MapPin size={12} color="#9ca3af" />
            <Text style={styles.metaText}>Location</Text>
          </View>
        )}
        {item.poll && item.poll[0] && (
          <View style={styles.metaBadge}>
            <BarChart2 size={12} color="#9ca3af" />
            <Text style={styles.metaText}>Poll</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.text === '#000' ? 'dark-content' : 'light-content'} />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.navBg }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.iconColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Drafts</Text>
        </View>
        {drafts.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {drafts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.inputBg }]}>
            <FileText size={40} color="#9ca3af" />
          </View>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No drafts saved</Text>
        </View>
      ) : (
        <FlatList
          data={drafts}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

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
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  draftItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  draftText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 22,
  },
  placeholderText: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaText: {
    color: '#9ca3af',
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyIcon: {
    padding: 16,
    borderRadius: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DraftsView;