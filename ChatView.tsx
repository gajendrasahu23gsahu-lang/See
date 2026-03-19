import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Conversation, Message } from '../types';
import { dbService } from '../services/dbService';
import {
  ArrowLeft,
  BadgeCheck,
  Send,
  Image as ImageIcon,
  Mic,
  X,
  MoreVertical,
  EyeOff,
  Trash2,
  StopCircle,
  Play,
  Pause,
  CheckCircle2,
  Circle,
} from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Audio, AVPlaybackStatus } from 'expo-av'; // or use react-native-audio-recorder-player

const { width } = Dimensions.get('window');

interface ChatViewProps {
  conversation: Conversation;
  onBack?: () => void;
  onBlockToggle?: () => void;
  currentUserId: string;
  currentUserAvatar?: string;
}

// --- Custom Audio Player Component (using expo-av) ---
const AudioMessage = ({ uri }: { uri: string }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSound();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [uri]);

  const loadSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis || 0);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load sound', error);
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      setIsPlaying(true);
      setPosition(status.positionMillis);
    } else {
      setIsPlaying(false);
      if (status.didJustFinish) {
        setPosition(0);
      }
    }
  };

  const togglePlay = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  if (isLoading) {
    return <ActivityIndicator size="small" color="#999" />;
  }

  return (
    <View style={styles.audioMessageContainer}>
      <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
        {isPlaying ? (
          <Pause size={18} color="#000" fill="currentColor" />
        ) : (
          <Play size={18} color="#000" fill="currentColor" style={styles.playIcon} />
        )}
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.timeText}>
          {formatTime(isPlaying || position > 0 ? position : duration)}
        </Text>
      </View>
    </View>
  );
};

export default function ChatView({
  conversation,
  onBack,
  onBlockToggle,
  currentUserId,
  currentUserAvatar,
}: ChatViewProps) {
  const { theme, themeMode } = useTheme();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [useSelfDestruct, setUseSelfDestruct] = useState(false);

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());

  // Load messages from DB
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const history = await dbService.getMessages(currentUserId, conversation.id);
        setMessages(history);
      } catch (e) {
        console.error('Failed to load messages', e);
      }
    };

    loadMessages();

    // Simple polling to update chat if new messages arrive
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [currentUserId, conversation.id]);

  // Handle message expiration
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => {
        let changed = false;
        const next = prev.map((m) => {
          if (m.expiresAt && m.expiresAt < now && !m.isExpired) {
            changed = true;
            return { ...m, isExpired: true, mediaUrl: undefined };
          }
          return m;
        });
        return changed ? next : prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [messages]);

  // Media & Recording State
  const [pendingMedia, setPendingMedia] = useState<{ uri: string; type: 'image' | 'video' | 'audio' } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, pendingMedia]);

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Selection Handlers
  const handleLongPress = (msgId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedMessageIds(new Set([msgId]));
    }
  };

  const toggleSelection = (msgId: string) => {
    const newSet = new Set(selectedMessageIds);
    if (newSet.has(msgId)) {
      newSet.delete(msgId);
      if (newSet.size === 0) setIsSelectionMode(false);
    } else {
      newSet.add(msgId);
    }
    setSelectedMessageIds(newSet);
  };

  const handleDeleteSelected = async () => {
    if (selectedMessageIds.size === 0) return;

    // Backend Delete
    await dbService.deleteMessages(Array.from(selectedMessageIds));

    // UI Update
    setMessages((prev) => prev.filter((m) => !selectedMessageIds.has(m.id)));

    // Exit Mode
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
  };

  // Media Picker
  const pickMedia = () => {
    launchImageLibrary(
      {
        mediaType: 'mixed',
        includeBase64: false,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.error) {
          Alert.alert('Error', response.error);
          return;
        }
        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          const type = asset.type?.startsWith('video/')
            ? 'video'
            : asset.type?.startsWith('audio/')
            ? 'audio'
            : 'image';
          setPendingMedia({ uri: asset.uri!, type: type as any });
        }
      }
    );
  };

  // Audio Recording
  const toggleRecording = async () => {
    if (conversation.isBlocked) return;

    if (isRecording) {
      // STOP RECORDING
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          recordingRef.current = null;
          if (uri) {
            setPendingMedia({ uri, type: 'audio' });
          }
        } catch (err) {
          console.error('Recording stop error', err);
        }
      }
      setIsRecording(false);
    } else {
      // START RECORDING
      try {
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        setIsRecording(true);
      } catch (err) {
        console.error('Mic Error:', err);
        Alert.alert('Microphone access denied. Please allow audio permissions.');
      }
    }
  };

  const cancelRecording = () => {
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
    }
    setIsRecording(false);
  };

  const handleSend = async () => {
    if (conversation.isBlocked) return;

    // If user hits send while recording, stop and send
    if (isRecording) {
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          recordingRef.current = null;
          if (uri) {
            setPendingMedia({ uri, type: 'audio' });
          }
        } catch (err) {
          console.error(err);
        }
      }
      setIsRecording(false);
      return;
    }

    if (!inputText.trim() && !pendingMedia) return;

    const expiresAt = pendingMedia && useSelfDestruct ? Date.now() + 30000 : undefined;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      receiverId: conversation.id,
      isUser: true,
      text: inputText.trim() || undefined,
      mediaUrl: pendingMedia?.uri,
      mediaType: pendingMedia?.type,
      expiresAt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Optimistic Update
    setMessages((prev) => [...prev, newMessage]);

    // Save to DB so Inbox can see it
    await dbService.sendMessage(newMessage);

    setInputText('');
    setPendingMedia(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isSelected = selectedMessageIds.has(item.id);
    const isUser = item.senderId === currentUserId;

    const bubbleStyle = isUser
      ? [styles.bubble, styles.userBubble]
      : [
          styles.bubble,
          styles.otherBubble,
          { backgroundColor: themeMode === 'light' ? '#e5e7eb' : '#262626' },
        ];

    return (
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={() => handleLongPress(item.id)}
        onPress={() => isSelectionMode && toggleSelection(item.id)}
        delayLongPress={500}
        style={[
          styles.messageWrapper,
          isUser ? styles.userMessageWrapper : styles.otherMessageWrapper,
        ]}
      >
        {isSelectionMode && (
          <View style={styles.selectionIndicator}>
            {isSelected ? (
              <CheckCircle2 size={20} color="#ec4899" />
            ) : (
              <Circle size={20} color="#6b7280" />
            )}
          </View>
        )}

        <View
          style={[
            bubbleStyle,
            isSelectionMode && !isSelected && styles.messageDimmed,
          ]}
        >
          {item.isExpired ? (
            <View style={styles.expiredContainer}>
              <EyeOff size={14} color="#999" />
              <Text style={styles.expiredText}>Media expired</Text>
            </View>
          ) : (
            <>
              {item.mediaUrl && (
                <View style={styles.mediaContainer}>
                  {item.mediaType === 'image' && (
                    <Image source={{ uri: item.mediaUrl }} style={styles.imageMessage} />
                  )}
                  {item.mediaType === 'audio' && <AudioMessage uri={item.mediaUrl} />}
                  {item.mediaType === 'video' && (
                    // For video, we can use a simple placeholder or a video player. We'll just show a preview.
                    <View style={styles.videoPlaceholder}>
                      <Text style={styles.videoText}>Video</Text>
                    </View>
                  )}
                </View>
              )}
              {item.text && <Text style={[styles.messageText, isUser && styles.userMessageText]}>{item.text}</Text>}
            </>
          )}
        </View>

        {/* Time */}
        <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
          {item.timestamp}
        </Text>
      </TouchableOpacity>
    );
  };

  const isBlocked = conversation.isBlocked;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.navBg }]}>
        {isSelectionMode ? (
          // Selection Mode Header
          <View style={styles.headerSelection}>
            <TouchableOpacity
              onPress={() => {
                setIsSelectionMode(false);
                setSelectedMessageIds(new Set());
              }}
              style={styles.headerButton}
            >
              <X size={24} color={theme.iconColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {selectedMessageIds.size} Selected
            </Text>
            <TouchableOpacity onPress={handleDeleteSelected} style={styles.headerButton}>
              <Trash2 size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          // Normal Header
          <View style={styles.headerNormal}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <ArrowLeft size={26} color={theme.iconColor} />
              </TouchableOpacity>
              <Image source={{ uri: conversation.avatar }} style={styles.avatar} />
              <View>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: theme.text }]}>{conversation.name}</Text>
                  {conversation.isVerified && <BadgeCheck size={14} color="#3b82f6" />}
                </View>
                <Text style={[styles.handle, { color: theme.secondaryText }]}>{conversation.handle}</Text>
              </View>
            </View>

            <View>
              <TouchableOpacity onPress={() => setIsMenuOpen(true)} style={styles.menuButton}>
                <MoreVertical size={24} color={theme.iconColor} />
              </TouchableOpacity>

              {/* Menu Modal */}
              <Modal visible={isMenuOpen} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setIsMenuOpen(false)}>
                  <View style={[styles.menuModal, { backgroundColor: theme.modalBg }]}>
                    <TouchableOpacity
                      onPress={() => {
                        onBlockToggle?.();
                        setIsMenuOpen(false);
                      }}
                      style={styles.menuItem}
                    >
                      <Text style={styles.menuTextRed}>
                        {isBlocked ? 'Unblock User' : 'Block User'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setMessages([]);
                        setIsMenuOpen(false);
                      }}
                      style={styles.menuItem}
                    >
                      <Text style={[styles.menuText, { color: theme.text }]}>Clear Chat</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
          </View>
        )}
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            <Image source={{ uri: conversation.avatar }} style={styles.profileImage} />
            <Text style={[styles.profileName, { color: theme.text }]}>{conversation.name}</Text>
            <Text style={[styles.profileHandle, { color: theme.secondaryText }]}>{conversation.handle}</Text>
            <Text style={[styles.profileNote, { color: theme.secondaryText }]}>
              You're not following each other.
            </Text>
            <TouchableOpacity style={[styles.profileButton, { borderColor: theme.border }]}>
              <Text style={[styles.profileButtonText, { color: theme.text }]}>View Profile</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Area */}
      {!isSelectionMode && (
        <View style={[styles.inputContainer, { backgroundColor: theme.bg }]}>
          {isBlocked ? (
            <View style={styles.blockedMessage}>
              <Text style={styles.blockedText}>You can't message a blocked user</Text>
            </View>
          ) : (
            <>
              {/* Media Preview */}
              {pendingMedia && (
                <View style={[styles.mediaPreview, { backgroundColor: theme.inputBg }]}>
                  <TouchableOpacity onPress={() => setPendingMedia(null)} style={styles.closePreview}>
                    <X size={14} color="#fff" />
                  </TouchableOpacity>

                  {pendingMedia.type === 'image' && (
                    <Image source={{ uri: pendingMedia.uri }} style={styles.previewImage} />
                  )}
                  {pendingMedia.type === 'video' && (
                    <View style={styles.previewVideo}>
                      <Text style={styles.previewVideoText}>Video</Text>
                    </View>
                  )}
                  {pendingMedia.type === 'audio' && (
                    <View style={styles.previewAudio}>
                      <Mic size={18} color="#ec4899" />
                      <View>
                        <Text style={styles.previewAudioTitle}>Voice Message Recorded</Text>
                        <Text style={styles.previewAudioSub}>Ready to send</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.inputRow}>
                {/* Avatar */}
                <TouchableOpacity onPress={pickMedia} style={styles.avatarButton}>
                  <Image
                    source={{
                      uri: currentUserAvatar || `https://ui-avatars.com/api/?name=Me&background=random`,
                    }}
                    style={styles.inputAvatar}
                  />
                </TouchableOpacity>

                {/* Input Bar */}
                <View
                  style={[
                    styles.inputBar,
                    { backgroundColor: theme.inputBg, borderColor: theme.border },
                    isRecording && styles.recordingBar,
                  ]}
                >
                  {isRecording ? (
                    // Recording UI
                    <View style={styles.recordingContainer}>
                      <View style={styles.recordingIndicator}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingTimer}>{formatTime(recordingTime)}</Text>
                      </View>
                      <View style={styles.recordingActions}>
                        <TouchableOpacity onPress={cancelRecording}>
                          <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggleRecording} style={styles.stopButton}>
                          <StopCircle size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    // Normal Input
                    <>
                      <TextInput
                        style={[styles.textInput, { color: theme.text }]}
                        placeholder="Message..."
                        placeholderTextColor="#9ca3af"
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleSend}
                      />
                      {inputText.trim() || pendingMedia ? (
                        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                          <Text style={styles.sendText}>Send</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.mediaButtons}>
                          <TouchableOpacity onPress={toggleRecording} style={styles.mediaButton}>
                            <Mic size={24} color={theme.iconColor} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={pickMedia} style={styles.mediaButton}>
                            <ImageIcon size={24} color={theme.iconColor} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 10,
  },
  headerSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerNormal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  handle: {
    fontSize: 12,
  },
  menuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuModal: {
    position: 'absolute',
    top: 100,
    right: 20,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 150,
  },
  menuItem: {
    padding: 12,
  },
  menuText: {
    fontSize: 16,
  },
  menuTextRed: {
    fontSize: 16,
    color: '#ef4444',
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileHandle: {
    fontSize: 14,
    marginBottom: 8,
  },
  profileNote: {
    fontSize: 12,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  profileButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messagesContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
  },
  otherMessageWrapper: {
    alignSelf: 'flex-start',
  },
  selectionIndicator: {
    marginBottom: 4,
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  userBubble: {
    backgroundColor: '#3797f0',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#262626',
    borderBottomLeftRadius: 4,
  },
  messageDimmed: {
    opacity: 0.5,
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
  },
  userMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    alignSelf: 'flex-end',
  },
  mediaContainer: {
    marginBottom: 6,
  },
  imageMessage: {
    width: width * 0.6,
    height: 200,
    borderRadius: 12,
  },
  videoPlaceholder: {
    width: width * 0.6,
    height: 150,
    backgroundColor: '#333',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: '#fff',
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expiredText: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
  },
  audioMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 200,
    paddingRight: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    marginLeft: 2,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  timeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  blockedMessage: {
    padding: 12,
    alignItems: 'center',
  },
  blockedText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  mediaPreview: {
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  closePreview: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
    zIndex: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  previewVideo: {
    width: 100,
    height: 100,
    backgroundColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewVideoText: {
    color: '#fff',
  },
  previewAudio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    backgroundColor: 'rgba(236,72,153,0.1)',
    borderRadius: 8,
  },
  previewAudioTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  previewAudioSub: {
    color: '#9ca3af',
    fontSize: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
  },
  inputAvatar: {
    width: '100%',
    height: '100%',
  },
  inputBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recordingBar: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  sendButton: {
    marginLeft: 8,
  },
  sendText: {
    color: '#3797f0',
    fontWeight: '600',
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  mediaButton: {
    padding: 4,
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  recordingTimer: {
    color: '#ef4444',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cancelText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  stopButton: {
    backgroundColor: '#ef4444',
    borderRadius: 20,
    padding: 4,
  },
});