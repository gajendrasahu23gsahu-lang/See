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
import { X, Trash2, Clock, Search, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface HistoryViewProps {
  onClose: () => void;
  onSelectQuery: (query: string) => void;
}

const HISTORY_KEY = 'see_search_history';

const HistoryView: React.FC<HistoryViewProps> = ({ onClose, onSelectQuery }) => {
  const { theme } = useTheme();
  const [history, setHistory] = useState<{ query: string; timestamp: number }[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const saved = await AsyncStorage.getItem(HISTORY_KEY);
        if (saved) {
          setHistory(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    };
    loadHistory();
  }, []);

  const handleDeleteItem = async (indexToDelete: number) => {
    const newHistory = history.filter((_, idx) => idx !== indexToDelete);
    setHistory(newHistory);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear search history',
      'Are you sure you want to delete all search history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setHistory([]);
            await AsyncStorage.removeItem(HISTORY_KEY);
          },
        },
      ]
    );
  };

  const renderItem = ({ item, index }: { item: { query: string; timestamp: number }; index: number }) => (
    <TouchableOpacity
      style={[styles.historyItem, { borderBottomColor: theme.border }]}
      onPress={() => onSelectQuery(item.query)}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
          <Clock size={18} color={theme.secondaryText} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.queryText, { color: theme.text }]} numberOfLines={1}>
            {item.query}
          </Text>
          <Text style={[styles.timeText, { color: theme.secondaryText }]}>
            {new Date(item.timestamp).toLocaleDateString()} •{' '}
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => {
          Alert.alert('Remove from history', 'Delete this search?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => handleDeleteItem(index),
            },
          ]);
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.deleteButton}
      >
        <Trash2 size={18} color="#ef4444" />
      </TouchableOpacity>
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
          <View style={styles.titleContainer}>
            <Clock size={20} color="#3b82f6" />
            <Text style={[styles.title, { color: theme.text }]}>Search History</Text>
          </View>
        </View>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.inputBg }]}>
            <Search size={40} color={theme.secondaryText} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.secondaryText }]}>No search history yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
            Your searches will appear here so you can easily revisit them.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Footer note */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <AlertCircle size={10} color="#4b5563" />
        <Text style={styles.footerText}>History is stored locally on your device</Text>
      </View>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  clearText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 999,
  },
  textContainer: {
    flex: 1,
  },
  queryText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyIcon: {
    padding: 24,
    borderRadius: 999,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 16,
    borderTopWidth: 1,
  },
  footerText: {
    color: '#4b5563',
    fontSize: 10,
  },
});

export default HistoryView;