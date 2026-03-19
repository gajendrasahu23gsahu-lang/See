import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Image as ImageIcon, MapPin, Smile, Mic, CalendarClock } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { MiniBlogPost } from '../types';

const { width } = Dimensions.get('window');

interface ReplyModalProps {
  visible: boolean;
  post: MiniBlogPost;
  onClose: () => void;
  onReply: (text: string) => void;
  currentUserAvatar?: string;
}

export const ReplyModal: React.FC<ReplyModalProps> = ({
  visible,
  post,
  onClose,
  onReply,
  currentUserAvatar,
}) => {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      // Focus input when modal appears
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    } else {
      setText(''); // clear on close
    }
  }, [visible]);

  const handleSubmit = () => {
    if (text.trim()) {
      onReply(text);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet" // gives a nice iOS style, fallback to full screen on Android
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!text.trim()}
            style={[
              styles.replyButton,
              !text.trim() && styles.replyButtonDisabled,
            ]}
          >
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Left column with avatars and thread line */}
              <View style={styles.leftColumn}>
                <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />
                <View style={[styles.threadLine, { backgroundColor: theme.border }]} />
                <Image
                  source={{
                    uri:
                      currentUserAvatar ||
                      'https://i.pravatar.cc/150?u=me',
                  }}
                  style={styles.avatar}
                />
              </View>

              {/* Right column – post content and reply input */}
              <View style={styles.rightColumn}>
                {/* Original post */}
                <View style={styles.postContainer}>
                  <View style={styles.postHeader}>
                    <Text style={[styles.postAuthorName, { color: theme.text }]}>
                      {post.authorName}
                    </Text>
                    <Text style={[styles.postAuthorHandle, { color: theme.secondaryText }]}>
                      {post.authorHandle}
                    </Text>
                    <Text style={[styles.postDot, { color: theme.secondaryText }]}>·</Text>
                    <Text style={[styles.postTimestamp, { color: theme.secondaryText }]}>
                      {post.timestamp}
                    </Text>
                  </View>
                  <Text style={[styles.postContent, { color: theme.text }]}>
                    {post.content}
                  </Text>
                  <View style={styles.replyToContainer}>
                    <Text style={[styles.replyToLabel, { color: theme.secondaryText }]}>
                      Replying to
                    </Text>
                    <Text style={[styles.replyToHandle, { color: '#60a5fa' }]}>
                      @{post.authorHandle.replace('@', '')}
                    </Text>
                  </View>
                </View>

                {/* Reply input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={inputRef}
                    value={text}
                    onChangeText={setText}
                    placeholder="Post your reply"
                    placeholderTextColor="#9ca3af"
                    style={[styles.input, { color: theme.text }]}
                    multiline
                    autoFocus={false} // we focus after mount
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Keyboard accessory bar */}
          <View style={[styles.accessoryBar, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
            <TouchableOpacity style={styles.accessoryButton}>
              <ImageIcon size={22} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.accessoryButton}>
              <Smile size={22} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.accessoryButton}>
              <CalendarClock size={22} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.accessoryButton}>
              <MapPin size={22} color="#3b82f6" style={{ opacity: 0.5 }} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  closeButton: {
    padding: 4,
    marginLeft: -4,
  },
  replyButton: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#3b82f6',
  },
  replyButtonDisabled: {
    opacity: 0.5,
  },
  replyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  leftColumn: {
    alignItems: 'center',
    width: 40,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
  },
  threadLine: {
    width: 2,
    flex: 1,
    minHeight: 40,
    marginVertical: 8,
  },
  rightColumn: {
    flex: 1,
  },
  postContainer: {
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  postAuthorName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  postAuthorHandle: {
    fontSize: 14,
  },
  postDot: {
    fontSize: 14,
  },
  postTimestamp: {
    fontSize: 14,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 8,
  },
  replyToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  replyToLabel: {
    fontSize: 13,
  },
  replyToHandle: {
    fontSize: 13,
  },
  inputContainer: {
    minHeight: 100,
    marginTop: 8,
  },
  input: {
    fontSize: 18,
    lineHeight: 24,
    padding: 0,
    backgroundColor: 'transparent',
  },
  accessoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12, // extra space for home indicator
  },
  accessoryButton: {
    padding: 4,
  },
});