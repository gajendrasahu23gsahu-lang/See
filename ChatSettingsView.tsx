import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface ChatSettingsViewProps {
  onClose: () => void;
  userHandle: string;
}

const ChatSettingsView: React.FC<ChatSettingsViewProps> = ({ onClose, userHandle }) => {
  const { theme, themeMode } = useTheme();

  // Settings State
  const [messageRequestsFrom, setMessageRequestsFrom] = useState<'none' | 'verified' | 'everyone'>('none');
  const [readReceipts, setReadReceipts] = useState(true);

  const isLight = themeMode === 'light';
  const textColor = isLight ? '#000' : '#fff';
  const subTextColor = isLight ? '#6b7280' : '#9ca3af';
  const borderColor = theme.border; // assuming theme.border is a color string

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor, backgroundColor: theme.navBg }]}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <ArrowLeft size={24} color={textColor} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Chat settings</Text>
          <Text style={[styles.headerSubtitle, { color: subTextColor }]}>{userHandle}</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section: Message Requests */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Allow message requests from:</Text>
          <Text style={[styles.sectionDescription, { color: subTextColor }]}>
            People you follow will always be able to message you.{' '}
            <Text style={styles.link}>Learn more</Text>
          </Text>

          <View style={styles.radioGroup}>
            {/* No one */}
            <TouchableOpacity style={styles.radioItem} onPress={() => setMessageRequestsFrom('none')}>
              <Text style={[styles.radioLabel, { color: textColor }]}>No one</Text>
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: messageRequestsFrom === 'none' ? '#3b82f6' : '#6b7280' },
                ]}
              >
                {messageRequestsFrom === 'none' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            {/* Verified users */}
            <TouchableOpacity style={styles.radioItem} onPress={() => setMessageRequestsFrom('verified')}>
              <Text style={[styles.radioLabel, { color: textColor }]}>Verified users</Text>
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: messageRequestsFrom === 'verified' ? '#3b82f6' : '#6b7280' },
                ]}
              >
                {messageRequestsFrom === 'verified' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            {/* Everyone */}
            <TouchableOpacity style={styles.radioItem} onPress={() => setMessageRequestsFrom('everyone')}>
              <Text style={[styles.radioLabel, { color: textColor }]}>Everyone</Text>
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: messageRequestsFrom === 'everyone' ? '#3b82f6' : '#6b7280' },
                ]}
              >
                {messageRequestsFrom === 'everyone' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: borderColor }]} />

        {/* Section: Send read receipts */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.readReceiptsTextContainer}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Send read receipts</Text>
              <Text style={[styles.sectionDescription, { color: subTextColor }]}>
                Let people you're messaging with know when you've seen their messages. Read receipts are not shown on message requests.{' '}
                <Text style={styles.link}>Learn more</Text>
              </Text>
            </View>
            <Switch
              value={readReceipts}
              onValueChange={setReadReceipts}
              trackColor={{ false: '#374151', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: borderColor }]} />

        {/* Section: Encrypted Messages */}
        <View style={styles.section}>
          <Text style={[styles.encryptedTitle, { color: textColor }]}>Encrypted Messages</Text>

          <TouchableOpacity style={styles.optionButton}>
            <Text style={[styles.optionText, { color: textColor }]}>Reset passcode</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow}>
            <Text style={[styles.optionText, { color: textColor }]}>Change passcode</Text>
            <ChevronRight size={20} color={subTextColor} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 20,
  },
  headerTextContainer: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  link: {
    color: '#60a5fa',
  },
  radioGroup: {
    gap: 16,
  },
  radioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  readReceiptsTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  encryptedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optionButton: {
    paddingVertical: 14,
    borderBottomWidth: 0, // No border per original
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ChatSettingsView;