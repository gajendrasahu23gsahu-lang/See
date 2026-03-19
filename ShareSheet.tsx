import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  Linking,
  Share as RNShare,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  X,
  Link as LinkIcon,
  Copy,
  Share2,
  MessageCircle,
  Mail,
  Twitter,
  Facebook,
  Linkedin,
  Download,
  MoreHorizontal,
  Send,
  MessageSquare,
  Smartphone,
  Edit3,
  Repeat2,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { height } = Dimensions.get('window');

interface ShareSheetProps {
  data: { title?: string; text?: string; url: string };
  onClose: () => void;
}

const ShareSheet: React.FC<ShareSheetProps> = ({ data, onClose }) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `${data.text || ''}\n${data.url}`;
    Clipboard.setString(textToCopy);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1000);
  };

  const handleNativeShare = async () => {
    try {
      const shareData = {
        title: data.title || 'Share',
        message: data.text ? `${data.text}\n${data.url}` : data.url,
      };
      await RNShare.share(shareData);
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const shareTo = async (platform: string) => {
    const text = encodeURIComponent(data.text || '');
    const url = encodeURIComponent(data.url || '');
    const title = encodeURIComponent(data.title || '');
    let link = '';

    switch (platform) {
      case 'whatsapp':
        link = `https://wa.me/?text=${text}%20${url}`;
        break;
      case 'telegram':
        link = `https://t.me/share/url?url=${url}&text=${text}`;
        break;
      case 'twitter':
        link = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'facebook':
        link = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'linkedin':
        link = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'email':
        link = `mailto:?subject=${title || 'Shared Link'}&body=${text}%0A${url}`;
        break;
      case 'reddit':
        link = `https://reddit.com/submit?url=${url}&title=${text}`;
        break;
    }

    if (link) {
      const supported = await Linking.canOpenURL(link);
      if (supported) {
        await Linking.openURL(link);
      } else {
        Alert.alert('Cannot open link', 'Please install the app or try a different sharing method.');
      }
      onClose();
    }
  };

  // App grid items
  const apps = [
    { name: 'WhatsApp', icon: MessageCircle, color: '#10b981', action: () => shareTo('whatsapp') },
    { name: 'Telegram', icon: Send, color: '#3b82f6', action: () => shareTo('telegram') },
    { name: 'Twitter', icon: Twitter, color: '#000', action: () => shareTo('twitter') },
    { name: 'Messages', icon: MessageSquare, color: '#3b82f6', action: handleNativeShare },
    { name: 'Gmail', icon: Mail, color: '#ef4444', action: () => shareTo('email') },
    { name: 'Facebook', icon: Facebook, color: '#2563eb', action: () => shareTo('facebook') },
    { name: 'LinkedIn', icon: Linkedin, color: '#0e76a8', action: () => shareTo('linkedin') },
    { name: 'Reddit', icon: () => <Text style={styles.redditIcon}>R</Text>, color: '#f97316', action: () => shareTo('reddit') },
  ];

  const renderAppItem = ({ item }: { item: typeof apps[0] }) => {
    const IconComponent = item.icon;
    return (
      <TouchableOpacity style={styles.appItem} onPress={item.action}>
        <View style={[styles.appIcon, { backgroundColor: item.color }]}>
          {typeof IconComponent === 'function' ? (
            <IconComponent />
          ) : (
            <IconComponent size={24} color="#fff" />
          )}
        </View>
        <Text style={[styles.appName, { color: theme.secondaryText }]}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: theme.bg }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: 'rgba(128,128,128,0.3)' }]} />
          </View>

          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.text }]}>Share</Text>

            {/* Horizontal app grid */}
            <FlatList
              data={apps}
              renderItem={renderAppItem}
              keyExtractor={(item) => item.name}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.appsList}
            />

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(128,128,128,0.1)' }]}>
                  <Copy size={20} color={theme.text} />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>
                  {copied ? 'Copied!' : 'Copy link'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleNativeShare}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(128,128,128,0.1)' }]}>
                  <Repeat2 size={20} color={theme.text} />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>Quick Share</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={onClose}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(128,128,128,0.1)' }]}>
                  <Edit3 size={20} color={theme.text} />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>Create post</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cancel button */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { backgroundColor: theme.bg === '#000' ? '#333' : '#e5e5e5' },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 3,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  appsList: {
    paddingBottom: 16,
    gap: 16,
  },
  appItem: {
    alignItems: 'center',
    width: 70,
    marginRight: 8,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  appName: {
    fontSize: 10,
    textAlign: 'center',
  },
  redditIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  actions: {
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ShareSheet;