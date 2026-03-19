import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { X, Search, Check, Globe } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface LanguageSettingsProps {
  visible: boolean;
  onClose: () => void;
}

// A comprehensive list of world languages
const languages = [
  'English',
  'Hindi (हिन्दी)',
  'Spanish (Español)',
  'French (Français)',
  'Mandarin Chinese (普通话)',
  'Arabic (العربية)',
  'Bengali (বাংলা)',
  'Russian (Русский)',
  'Portuguese (Português)',
  'Indonesian (Bahasa Indonesia)',
  'Urdu (اردو)',
  'German (Deutsch)',
  'Japanese (日本語)',
  'Swahili (Kiswahili)',
  'Marathi (मराठी)',
  'Telugu (తెలుగు)',
  'Turkish (Türkçe)',
  'Tamil (தமிழ்)',
  'Vietnamese (Tiếng Việt)',
  'Korean (한국어)',
  'Italian (Italiano)',
  'Thai (ไทย)',
  'Gujarati (ગુજરાતી)',
  'Javanese (Basa Jawa)',
  'Kannada (ಕನ್ನಡ)',
  'Persian (فارسی)',
  'Bhojpuri (भोजपुरी)',
  'Hausa (Harshen Hausa)',
  'Polish (Polski)',
  'Pashto (پښتو)',
  'Malayalam (മലയാളം)',
  'Odia (ଓଡ଼ିଆ)',
  'Maithili (मैथिली)',
  'Burmese (မြန်မာစာ)',
  'Ukrainian (Українська)',
  'Dutch (Nederlands)',
  'Yoruba (Èdè Yorùbá)',
  'Sindhi (سنڌي)',
  'Nepali (नेपाली)',
  'Sinhala (සිංහල)',
  'Greek (Ελληνικά)',
  'Czech (Čeština)',
  'Swedish (Svenska)',
  'Romanian (Română)',
  'Hungarian (Magyar)',
  'Hebrew (עברית)',
  'Amharic (አማርኛ)',
  'Finnish (Suomi)',
  'Danish (Dansk)',
  'Norwegian (Norsk)',
  'Slovak (Slovenčina)',
  'Croatian (Hrvatski)',
  'Bulgarian (Български)',
  'Lithuanian (Lietuvių)',
  'Slovenian (Slovenščina)',
  'Latvian (Latviešu)',
  'Estonian (Eesti)',
];

const LanguageSettings: React.FC<LanguageSettingsProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(language);

  // Update selected when language changes externally
  useEffect(() => {
    setSelected(language);
  }, [language]);

  const filtered = languages.filter((lang) =>
    lang.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = () => {
    setLanguage(selected);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.modal, { backgroundColor: theme.modalBg }]}>
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <View style={styles.titleContainer}>
                <Globe size={20} color="#ec4899" />
                <Text style={[styles.title, { color: theme.text }]}>Select Language</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={20} color={theme.iconColor} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={[styles.searchContainer, { borderBottomColor: theme.border }]}>
              <View
                style={[
                  styles.searchInputContainer,
                  { backgroundColor: theme.inputBg, borderColor: theme.border },
                ]}
              >
                <Search size={18} color="#9ca3af" style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search for a language..."
                  placeholderTextColor="#9ca3af"
                  value={search}
                  onChangeText={setSearch}
                  autoFocus
                />
              </View>
            </View>

            {/* Language List */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    selected === item && {
                      backgroundColor: 'rgba(236,72,153,0.1)',
                      borderColor: 'rgba(236,72,153,0.3)',
                    },
                  ]}
                  onPress={() => setSelected(item)}
                >
                  <Text
                    style={[
                      styles.languageText,
                      { color: selected === item ? '#ec4899' : theme.text },
                    ]}
                  >
                    {item}
                  </Text>
                  {selected === item && <Check size={20} color="#ec4899" />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={{ color: theme.secondaryText }}>No languages found.</Text>
                </View>
              }
            />

            {/* Confirm Button */}
            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: theme.buttonPrimary }]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmText}>Confirm Selection</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
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
  modal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    width: '100%',
  },
  safeArea: {
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  listContent: {
    padding: 8,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  confirmButton: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff', // assume buttonPrimary is a bright color; adjust if needed
  },
});

export default LanguageSettings;