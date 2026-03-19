import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { WebView } from 'react-native-webview';
import {
  X,
  Loader2,
  Image as ImageIcon,
  Gift,
  ListFilter,
  Smile,
  CalendarClock,
  MapPin,
  Mic,
  Plus,
  Globe,
  ChevronDown,
  Trash2,
  StopCircle,
  Save,
  Video,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import LocationSearch from './LocationSearch';
import { DraftPost, MediaAttachment } from '../types';
import { validatePostContent } from '../services/geminiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Sample GIFs (from original)
const SAMPLE_GIFS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW00eHVybnE4Z2V3b3I1eG55eG55eG55eG55eG55eG55/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif",
  "https://media.giphy.com/media/l0HlHJGHe3yAMhdQY/giphy.gif",
  "https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif",
  "https://media.giphy.com/media/3o7btQ8jDTPGDpgc6I/giphy.gif",
  "https://media.giphy.com/media/l41lFw057lAJQMlxS/giphy.gif"
];

const EMOJIS = ['😀', '😂', '😍', '🔥', '👍', '🙏', '🎉', '🚀', '💯', '🤔', '😢', '😡', '👻', '🤖', '🌸', '💖', '✨', '🧘'];

interface UploadViewProps {
  visible: boolean;
  onClose: () => void;
  onPost: (data: { content: string; image?: string; video?: string; location?: string; audio?: string }) => void;
  currentUserAvatar?: string;
  initialDraft?: DraftPost | null;
}

export default function UploadView({
  visible,
  onClose,
  onPost,
  currentUserAvatar,
  initialDraft,
}: UploadViewProps) {
  const { theme } = useTheme();

  // Initialize state with initialDraft if provided
  const [text, setText] = useState(initialDraft?.text || '');
  const [selectedMedia, setSelectedMedia] = useState<MediaAttachment | null>(initialDraft?.media || null);
  const [locationPreview, setLocationPreview] = useState<{ title: string; subtitle: string; lat?: number; lng?: number } | null>(initialDraft?.location || null);
  const [pollOptions, setPollOptions] = useState(initialDraft?.poll || ['', '']);
  const [audioUri, setAudioUri] = useState<string | null>(initialDraft?.audio || null);

  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState('');

  // Location State
  const [showLocationSearch, setShowLocationSearch] = useState(false);

  const [activeTool, setActiveTool] = useState<'emoji' | 'gif' | 'poll' | 'schedule' | null>(
    initialDraft?.poll && initialDraft.poll[0] ? 'poll' : null
  );

  const [scheduledDate, setScheduledDate] = useState<string | null>(null);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Thread State
  const [thread, setThread] = useState<DraftPost[]>([]);

  const textInputRef = useRef<TextInput>(null);
  const [inputHeight, setInputHeight] = useState(100);

  // Cleanup recording timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-focus on mount
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 200);
    }
  }, [visible]);

  const handleFileSelect = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'We need access to your photo library to attach media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const type = asset.type === 'video' ? 'video' : 'image';
      setSelectedMedia({
        url: asset.uri,
        type: type,
      });
      setActiveTool(null);
      setLocationPreview(null);
    }
  };

  const handleOpenLocationSearch = () => {
    setShowLocationSearch(true);
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      // Stop recording
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          recordingRef.current = null;
          if (uri) {
            setAudioUri(uri);
          }
        } catch (err) {
          console.error(err);
        }
      }
      setIsRecording(false);
      setRecordingTime(0);
    } else {
      // Start recording
      setAudioUri(null);
      try {
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
          Alert.alert('Permission required', 'Microphone access is needed to record audio.');
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        setIsRecording(true);

        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } catch (err) {
        console.error("Microphone access error:", err);
        setError("Could not access microphone. Please allow permissions.");
      }
    }
  };

  const handleDiscardAudio = () => {
    setAudioUri(null);
    setRecordingTime(0);
  };

  const handleSaveDraft = async () => {
    if (!text.trim() && !selectedMedia && !locationPreview && !pollOptions[0] && !audioUri) return;

    const draft: DraftPost = {
      text,
      media: selectedMedia,
      location: locationPreview,
      poll: pollOptions,
      audio: audioUri,
      timestamp: Date.now(),
    };

    try {
      const draftsJson = await AsyncStorage.getItem('see_local_drafts');
      const drafts = draftsJson ? JSON.parse(draftsJson) : [];
      await AsyncStorage.setItem('see_local_drafts', JSON.stringify([draft, ...drafts]));
    } catch (e) {
      console.error('Failed to save draft', e);
    }

    onClose();
  };

  const hasCurrentContent = text.trim() || selectedMedia || locationPreview || audioUri || (activeTool === 'poll' && pollOptions[0]);

  const handleAddToThread = () => {
    if (!hasCurrentContent) return;

    const currentDraft: DraftPost = {
      text,
      media: selectedMedia,
      location: locationPreview,
      poll: [...pollOptions],
      audio: audioUri,
      timestamp: Date.now(),
    };

    setThread([...thread, currentDraft]);

    // Reset fields for next post
    setText('');
    setSelectedMedia(null);
    setLocationPreview(null);
    setPollOptions(['', '']);
    setAudioUri(null);
    setRecordingTime(0);
    setActiveTool(null);

    // Focus back on textarea
    setTimeout(() => textInputRef.current?.focus(), 100);
  };

  const handlePost = async () => {
    const postsToPublish = [...thread];

    if (hasCurrentContent) {
      postsToPublish.push({
        text,
        media: selectedMedia,
        location: locationPreview,
        poll: [...pollOptions],
        audio: audioUri,
        timestamp: Date.now(),
      });
    }

    if (postsToPublish.length === 0) return;

    if (scheduledDate) {
      Alert.alert(`Thread scheduled for ${new Date(scheduledDate).toLocaleString()}`);
      onClose();
      return;
    }

    setIsPosting(true);
    setError('');

    // Validate first post if single and has text
    if (postsToPublish.length === 1 && postsToPublish[0].text) {
      const validation = await validatePostContent(postsToPublish[0].text);
      if (!validation.isValid) {
        setError(validation.reason || "Content flagged for safety.");
        setIsPosting(false);
        return;
      }
    }

    // Publish sequentially with a small delay
    for (const post of postsToPublish) {
      let finalContent = post.text;
      if (post.poll[0] && post.poll[1]) {
        finalContent += `\n\n📊 Poll:\n1. ${post.poll[0]}\n2. ${post.poll[1]}`;
      }

      // Simulate network delay (in real app you'd await API)
      await new Promise(resolve => setTimeout(resolve, 600));

      onPost({
        content: finalContent,
        image: post.media?.type === 'image' ? post.media.url : undefined,
        video: post.media?.type === 'video' ? post.media.url : undefined,
        location: post.location?.title,
        audio: post.audio || undefined,
      });
    }

    setIsPosting(false);
    onClose();
  };

  const toggleTool = (tool: 'emoji' | 'gif' | 'poll' | 'schedule') => {
    setActiveTool(activeTool === tool ? null : tool);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleSaveDraft}
              disabled={!hasCurrentContent && thread.length === 0}
              style={[styles.draftButton, (!hasCurrentContent && thread.length === 0) && styles.disabled]}
            >
              <Save size={20} color="#f472b6" />
              <Text style={styles.draftText}>Save Draft</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePost}
              disabled={isPosting || (!hasCurrentContent && thread.length === 0)}
              style={[styles.postButton, (isPosting || (!hasCurrentContent && thread.length === 0)) && styles.disabled]}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.postButtonText}>
                  {scheduledDate ? 'Schedule' : thread.length > 0 ? 'Post All' : 'Post'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Thread history */}
          {thread.map((draft, idx) => (
            <View key={idx} style={styles.threadItem}>
              <View style={styles.threadLeft}>
                <Image
                  source={{
                    uri: currentUserAvatar || `https://ui-avatars.com/api/?name=User&background=random`,
                  }}
                  style={styles.threadAvatar}
                />
                <View style={[styles.threadLine, { backgroundColor: '#1f2937' }]} />
              </View>
              <View style={styles.threadContent}>
                <Text style={styles.threadText}>{draft.text}</Text>
                {draft.media && (
                  <Text style={styles.threadMedia}>
                    {draft.media.type === 'video' ? '🎥 Video attached' : '🖼️ Image attached'}
                  </Text>
                )}
                {draft.location && (
                  <Text style={styles.threadLocation}>
                    <MapPin size={12} color="#6b7280" /> {draft.location.title}
                  </Text>
                )}
              </View>
            </View>
          ))}

          {/* Current input */}
          <View style={styles.inputRow}>
            <Image
              source={{
                uri: currentUserAvatar || `https://ui-avatars.com/api/?name=User&background=random`,
              }}
              style={styles.avatar}
            />

            <View style={styles.inputArea}>
              <TouchableOpacity style={styles.audienceButton}>
                <Globe size={12} color="#ec4899" />
                <Text style={styles.audienceText}>Everyone</Text>
                <ChevronDown size={12} color="#ec4899" />
              </TouchableOpacity>

              <TextInput
                ref={textInputRef}
                style={[styles.textInput, { height: Math.max(80, inputHeight) }]}
                placeholder={thread.length > 0 ? "Add another post..." : "What is happening?!"}
                placeholderTextColor="#6b7280"
                value={text}
                onChangeText={setText}
                multiline
                onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
              />

              {/* Recording indicator */}
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingTimer}>Recording {formatTime(recordingTime)}</Text>
                </View>
              )}

              {/* Audio preview */}
              {audioUri && !isRecording && (
                <View style={styles.audioPreview}>
                  <View style={styles.audioIcon}>
                    <Mic size={18} color="#fff" />
                  </View>
                  <Text style={styles.audioText}>Voice message recorded</Text>
                  <TouchableOpacity onPress={handleDiscardAudio}>
                    <Trash2 size={18} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Media preview */}
              {selectedMedia && (
                <View style={styles.mediaPreview}>
                  {selectedMedia.type === 'video' ? (
                    // We could use Video component from expo-av, but for simplicity show placeholder
                    <View style={styles.videoPlaceholder}>
                      <Video size={24} color="#fff" />
                      <Text style={styles.videoPlaceholderText}>Video</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: selectedMedia.url }} style={styles.imagePreview} />
                  )}
                  <TouchableOpacity style={styles.removeMedia} onPress={() => setSelectedMedia(null)}>
                    <X size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Location map preview */}
              {locationPreview && locationPreview.lat && locationPreview.lng && (
                <View style={styles.mapPreview}>
                  <WebView
                    source={{
                      uri: `https://maps.google.com/maps?q=${locationPreview.lat},${locationPreview.lng}&z=15&output=embed`,
                    }}
                    style={styles.map}
                  />
                  <View style={styles.mapOverlay}>
                    <MapPin size={40} color="#ef4444" />
                  </View>
                  <View style={styles.mapInfo}>
                    <Text style={styles.mapTitle}>{locationPreview.title}</Text>
                    <Text style={styles.mapSubtitle}>{locationPreview.subtitle}</Text>
                  </View>
                  <TouchableOpacity style={styles.removeMap} onPress={() => setLocationPreview(null)}>
                    <X size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Poll tool */}
              {activeTool === 'poll' && (
                <View style={styles.pollContainer}>
                  <View style={styles.pollHeader}>
                    <Text style={styles.pollTitle}>Create a Poll</Text>
                    <TouchableOpacity onPress={() => setActiveTool(null)}>
                      <X size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.pollInput}
                    placeholder="Choice 1"
                    placeholderTextColor="#6b7280"
                    value={pollOptions[0]}
                    onChangeText={(text) => setPollOptions([text, pollOptions[1]])}
                  />
                  <TextInput
                    style={styles.pollInput}
                    placeholder="Choice 2"
                    placeholderTextColor="#6b7280"
                    value={pollOptions[1]}
                    onChangeText={(text) => setPollOptions([pollOptions[0], text])}
                  />
                </View>
              )}

              {/* Schedule tool */}
              {activeTool === 'schedule' && (
                <View style={styles.scheduleContainer}>
                  <View style={styles.pollHeader}>
                    <Text style={styles.pollTitle}>Schedule Post</Text>
                    <TouchableOpacity onPress={() => { setActiveTool(null); setScheduledDate(null); }}>
                      <X size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.scheduleInput}
                    placeholder="YYYY-MM-DDTHH:MM"
                    placeholderTextColor="#6b7280"
                    value={scheduledDate || ''}
                    onChangeText={setScheduledDate}
                  />
                </View>
              )}

              {/* GIF tool */}
              {activeTool === 'gif' && (
                <View style={styles.gifContainer}>
                  <View style={styles.gifHeader}>
                    <Text style={styles.gifTitle}>Select GIF</Text>
                    <TouchableOpacity onPress={() => setActiveTool(null)}>
                      <X size={14} color="#ec4899" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.gifRow}>
                      {SAMPLE_GIFS.map((gif, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => {
                            setSelectedMedia({ url: gif, type: 'image' });
                            setActiveTool(null);
                          }}
                        >
                          <Image source={{ uri: gif }} style={styles.gifThumb} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Emoji tool */}
              {activeTool === 'emoji' && (
                <View style={styles.emojiContainer}>
                  {EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => setText(prev => prev + emoji)}
                      style={styles.emojiButton}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <View style={styles.errorDot} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <TouchableOpacity onPress={handleFileSelect} style={styles.toolbarButton}>
              <ImageIcon size={22} color="#ec4899" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleTool('gif')} style={[styles.toolbarButton, activeTool === 'gif' && styles.activeTool]}>
              <Gift size={22} color="#ec4899" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleTool('poll')} style={[styles.toolbarButton, activeTool === 'poll' && styles.activeTool]}>
              <ListFilter size={22} color="#ec4899" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleTool('emoji')} style={[styles.toolbarButton, activeTool === 'emoji' && styles.activeTool]}>
              <Smile size={22} color="#ec4899" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleTool('schedule')} style={[styles.toolbarButton, activeTool === 'schedule' && styles.activeTool]}>
              <CalendarClock size={22} color="#ec4899" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOpenLocationSearch} style={[styles.toolbarButton, locationPreview && styles.activeLocation]}>
              <MapPin size={22} color="#ec4899" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleVoiceToggle}
              style={[
                styles.toolbarButton,
                isRecording && styles.recordingActive,
                audioUri && !isRecording && styles.audioActive,
              ]}
            >
              {isRecording ? (
                <StopCircle size={22} color="#fff" />
              ) : (
                <Mic size={22} color={audioUri ? '#10b981' : '#ec4899'} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.toolbarRight}>
            <TouchableOpacity
              onPress={handleAddToThread}
              disabled={!hasCurrentContent}
              style={[styles.threadButton, !hasCurrentContent && styles.disabled]}
            >
              <Plus size={20} color="#ec4899" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Search Modal */}
        <LocationSearch
          visible={showLocationSearch}
          onClose={() => setShowLocationSearch(false)}
          onSelectLocation={(loc) => {
            setLocationPreview(loc);
            setShowLocationSearch(false);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  draftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(236,72,153,0.1)',
    gap: 6,
  },
  draftText: {
    color: '#f472b6',
    fontSize: 14,
    fontWeight: 'bold',
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    minWidth: 70,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 80,
  },
  threadItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  threadLeft: {
    alignItems: 'center',
    width: 44,
    marginRight: 12,
  },
  threadAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  threadLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  threadContent: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  threadText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  threadMedia: {
    color: '#60a5fa',
    fontSize: 12,
    marginTop: 4,
  },
  threadLocation: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    minHeight: 200,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginRight: 12,
  },
  inputArea: {
    flex: 1,
  },
  audienceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  audienceText: {
    color: '#ec4899',
    fontSize: 12,
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: 'transparent',
    fontSize: 20,
    color: '#fff',
    padding: 0,
    marginBottom: 8,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    marginVertical: 8,
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
    fontSize: 14,
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(236,72,153,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.3)',
    marginVertical: 8,
  },
  audioIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ec4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  mediaPreview: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
    maxWidth: width - 100,
  },
  imagePreview: {
    width: '100%',
    height: undefined,
    aspectRatio: 16 / 9,
  },
  videoPlaceholder: {
    width: 200,
    height: 150,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: '#9ca3af',
    marginTop: 8,
  },
  removeMedia: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 6,
  },
  mapPreview: {
    position: 'relative',
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -40 }],
  },
  mapInfo: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
  },
  mapTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mapSubtitle: {
    color: '#d1d5db',
    fontSize: 12,
  },
  removeMap: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 6,
  },
  pollContainer: {
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.3)',
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(236,72,153,0.05)',
    marginTop: 8,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pollTitle: {
    color: '#ec4899',
    fontWeight: 'bold',
    fontSize: 14,
  },
  pollInput: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    marginBottom: 8,
  },
  scheduleContainer: {
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.3)',
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(236,72,153,0.05)',
    marginTop: 8,
  },
  scheduleInput: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
  },
  gifContainer: {
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.3)',
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(236,72,153,0.05)',
    marginTop: 8,
  },
  gifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gifTitle: {
    color: '#ec4899',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  gifRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gifThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(236,72,153,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.3)',
    marginTop: 8,
  },
  emojiButton: {
    padding: 4,
  },
  emojiText: {
    fontSize: 24,
  },
  errorContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  errorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 20,
  },
  activeTool: {
    backgroundColor: 'rgba(236,72,153,0.2)',
  },
  activeLocation: {
    backgroundColor: 'rgba(236,72,153,0.2)',
  },
  recordingActive: {
    backgroundColor: '#ef4444',
  },
  audioActive: {
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  toolbarRight: {
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  threadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ec4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
});