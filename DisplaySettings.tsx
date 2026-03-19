import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { X, Moon, Sun, Monitor, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface DisplaySettingsProps {
  visible: boolean;
  onClose: () => void;
}

const DisplaySettings: React.FC<DisplaySettingsProps> = ({ visible, onClose }) => {
  const { themeMode, setThemeMode, theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.modal, { backgroundColor: theme.modalBg }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Display Settings</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.hover }]}>
              <X size={20} color={theme.iconColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Background Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Background</Text>
              <View style={styles.optionRow}>
                {/* Dark */}
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    themeMode === 'dark' && styles.selectedOption,
                  ]}
                  onPress={() => setThemeMode('dark')}
                >
                  <Moon
                    size={24}
                    color={themeMode === 'dark' ? theme.text : theme.secondaryText}
                    fill={themeMode === 'dark' ? theme.text : 'none'}
                  />
                  <Text style={[styles.optionLabel, { color: themeMode === 'dark' ? theme.text : theme.secondaryText }]}>
                    Dark
                  </Text>
                  {themeMode === 'dark' && <View style={styles.selectedRing} />}
                </TouchableOpacity>

                {/* Dim */}
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    themeMode === 'dim' && styles.selectedOption,
                  ]}
                  onPress={() => setThemeMode('dim')}
                >
                  <View style={styles.dimIcon}>
                    <Moon size={24} color={themeMode === 'dim' ? '#fff' : theme.secondaryText} />
                    <Text style={[styles.dimOverlay, { color: themeMode === 'dim' ? '#fff' : theme.secondaryText }]}>
                      DIM
                    </Text>
                  </View>
                  <Text style={[styles.optionLabel, { color: themeMode === 'dim' ? '#fff' : theme.secondaryText }]}>
                    Dim
                  </Text>
                  {themeMode === 'dim' && <View style={styles.selectedRing} />}
                </TouchableOpacity>

                {/* Light */}
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    themeMode === 'light' && styles.selectedOption,
                  ]}
                  onPress={() => setThemeMode('light')}
                >
                  <Sun
                    size={24}
                    color={themeMode === 'light' ? '#000' : theme.secondaryText}
                    fill={themeMode === 'light' ? '#000' : 'none'}
                  />
                  <Text style={[styles.optionLabel, { color: themeMode === 'light' ? '#000' : theme.secondaryText }]}>
                    Light
                  </Text>
                  {themeMode === 'light' && <View style={styles.selectedRing} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Auto Mode Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Auto Mode</Text>
              <TouchableOpacity
                style={[
                  styles.autoOption,
                  {
                    borderColor: themeMode === 'auto' ? '#3b82f6' : theme.border,
                    backgroundColor: themeMode === 'auto' ? 'rgba(59,130,246,0.1)' : 'transparent',
                  },
                ]}
                onPress={() => setThemeMode('auto')}
              >
                <View style={styles.autoLeft}>
                  <Monitor
                    size={22}
                    color={themeMode === 'auto' ? '#3b82f6' : theme.secondaryText}
                  />
                  <View style={styles.autoText}>
                    <Text style={[styles.autoTitle, { color: themeMode === 'auto' ? '#3b82f6' : theme.text }]}>
                      Auto Sunset
                    </Text>
                    <Text style={[styles.autoSub, { color: theme.secondaryText }]}>
                      Adapts to your device or time of day
                    </Text>
                  </View>
                </View>
                {themeMode === 'auto' && <Check size={20} color="#3b82f6" />}
              </TouchableOpacity>
            </View>

            {/* Done Button */}
            <View style={styles.footer}>
              <TouchableOpacity style={[styles.doneButton, { backgroundColor: theme.buttonPrimary }]} onPress={onClose}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
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
    alignItems: 'center',
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    position: 'relative',
  },
  selectedOption: {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedRing: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    left: -2,
    right: -2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  dimIcon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimOverlay: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: 'bold',
  },
  autoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  autoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  autoText: {
    flex: 1,
  },
  autoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  autoSub: {
    fontSize: 12,
  },
  footer: {
    paddingTop: 16,
  },
  doneButton: {
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  doneButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff', // adjust based on buttonPrimary background
  },
});

export default DisplaySettings;