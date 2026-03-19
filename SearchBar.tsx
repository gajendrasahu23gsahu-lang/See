import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import { Search, Mic, X, WifiOff } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isSearching }) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  // Voice recognition setup
  useEffect(() => {
    // Set up voice event listeners
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechPartialResults = onSpeechPartialResults;

    return () => {
      // Cleanup listeners and stop recognition
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = () => {
    setIsListening(true);
    setError(null);
  };

  const onSpeechEnd = () => {
    setIsListening(false);
  };

  const onSpeechResults = (e: any) => {
    const text = e.value[0];
    setQuery(text);
    onSearch(text);
  };

  const onSpeechPartialResults = (e: any) => {
    const text = e.value[0];
    setQuery(text);
  };

  const onSpeechError = (e: any) => {
    console.warn('Voice error', e);
    setIsListening(false);
    const errorCode = e.error?.code || e.error;
    if (errorCode === '7') {
      setError('No speech detected');
    } else if (errorCode === '8') {
      setError('Microphone access denied');
    } else {
      setError('Voice search failed');
    }
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return true; // iOS handles via info.plist
    }
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  };

  const toggleVoiceSearch = async () => {
    setError(null);

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      setError('Microphone permission denied');
      return;
    }

    if (isListening) {
      // Stop listening
      try {
        await Voice.stop();
      } catch (e) {
        console.warn('Stop error', e);
      }
    } else {
      // Start listening
      try {
        await Voice.start(navigator.language || 'en-US');
      } catch (e) {
        console.warn('Start error', e);
        setError('Could not start voice search');
      }
    }
  };

  const handleSubmit = () => {
    if (query.trim()) {
      onSearch(query);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setError(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        {/* Glow effect (simulated with border color) */}
        <View
          style={[
            styles.glow,
            isListening && styles.glowListening,
            error && styles.glowError,
          ]}
        />

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: 'rgba(26,26,26,0.9)' },
            isListening && styles.inputListening,
            error && styles.inputError,
          ]}
        >
          <Search size={20} color="#9ca3af" style={styles.iconLeft} />

          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={error || (isListening ? 'Listening...' : 'Ask anything...')}
            placeholderTextColor={error ? '#ef4444' : '#6b7280'}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setError(null);
            }}
            onSubmitEditing={handleSubmit}
            editable={!isSearching}
            returnKeyType="search"
          />

          {query.length > 0 && !isSearching && !isListening && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={toggleVoiceSearch}
            style={[
              styles.micButton,
              isListening && styles.micListening,
              error && styles.micError,
            ]}
          >
            {error ? (
              <WifiOff size={18} color="#ef4444" />
            ) : isListening ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Mic size={18} color="#9ca3af" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    zIndex: 40,
  },
  inputWrapper: {
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    inset: 0,
    borderRadius: 999,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  glowListening: {
    shadowColor: '#ec4899',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    borderColor: '#ec4899',
  },
  glowError: {
    shadowColor: '#ef4444',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    borderColor: '#ef4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputListening: {
    borderColor: '#ec4899',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  iconLeft: {
    marginLeft: 4,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  clearButton: {
    padding: 4,
  },
  micButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(31,41,55,0.5)',
    marginLeft: 4,
  },
  micListening: {
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  micError: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SearchBar;