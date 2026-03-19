import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Repeat2, PenSquare, X, Info, BarChart2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { height } = Dimensions.get('window');

interface RepostSheetProps {
  visible: boolean;
  onClose: () => void;
  onRepost: () => void;
  onQuote: () => void;
}

export const RepostSheet: React.FC<RepostSheetProps> = ({
  visible,
  onClose,
  onRepost,
  onQuote,
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: theme.bg }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: 'rgba(128,128,128,0.3)' }]} />

          <View style={styles.content}>
            <TouchableOpacity
              style={[styles.option, { backgroundColor: theme.hover }]}
              onPress={onRepost}
              activeOpacity={0.7}
            >
              <Repeat2 size={24} color={theme.secondaryText} />
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>Repost</Text>
                <Text style={[styles.optionSub, { color: theme.secondaryText }]}>
                  Share this post with your followers
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.option, { backgroundColor: theme.hover }]}
              onPress={onQuote}
              activeOpacity={0.7}
            >
              <PenSquare size={24} color={theme.secondaryText} />
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>Quote</Text>
                <Text style={[styles.optionSub, { color: theme.secondaryText }]}>
                  Add a comment before sharing
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

interface ViewsSheetProps {
  visible: boolean;
  onClose: () => void;
  viewsCount: string;
}

export const ViewsSheet: React.FC<ViewsSheetProps> = ({ visible, onClose, viewsCount }) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: theme.bg }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: 'rgba(128,128,128,0.3)' }]} />

          <View style={styles.viewsContent}>
            <Text style={[styles.viewsTitle, { color: theme.text }]}>Views</Text>

            <View style={styles.viewsRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                <BarChart2 size={24} color="#3b82f6" />
              </View>
              <View style={styles.viewsTextContainer}>
                <Text style={[styles.viewsMainText, { color: theme.text }]}>
                  Times this post was seen
                </Text>
                <Text style={[styles.viewsDescription, { color: theme.secondaryText }]}>
                  This post has been viewed <Text style={styles.bold}>{viewsCount}</Text> times. To
                  learn more about how view counts are calculated, visit our Help Centre.
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.dismissButton, { backgroundColor: theme.buttonPrimary }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  content: {
    marginBottom: 24,
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionSub: {
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewsContent: {
    marginBottom: 24,
    gap: 16,
  },
  viewsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  viewsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconCircle: {
    padding: 8,
    borderRadius: 20,
  },
  viewsTextContainer: {
    flex: 1,
  },
  viewsMainText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  viewsDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  dismissButton: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dismissText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff', // Assuming buttonPrimary is a bright color, text will be white
  },
});