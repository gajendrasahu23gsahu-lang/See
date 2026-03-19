import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Loader2,
  Mail,
  User,
  AtSign,
  ArrowRight,
  ShieldCheck,
  Fingerprint,
  Lock,
  Phone,
  MapPin,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const COUNTRIES = [
  { code: 'IN', name: 'India', dial_code: '+91', length: 10, flag: '🇮🇳' },
  { code: 'US', name: 'USA', dial_code: '+1', length: 10, flag: '🇺🇸' },
  { code: 'UK', name: 'UK', dial_code: '+44', length: 10, flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dial_code: '+1', length: 10, flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dial_code: '+61', length: 9, flag: '🇦🇺' },
  { code: 'AE', name: 'UAE', dial_code: '+971', length: 9, flag: '🇦🇪' },
  { code: 'PK', name: 'Pakistan', dial_code: '+92', length: 10, flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dial_code: '+880', length: 10, flag: '🇧🇩' },
  { code: 'CN', name: 'China', dial_code: '+86', length: 11, flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', dial_code: '+81', length: 10, flag: '🇯🇵' },
  { code: 'BR', name: 'Brazil', dial_code: '+55', length: 11, flag: '🇧🇷' },
  { code: 'RU', name: 'Russia', dial_code: '+7', length: 10, flag: '🇷🇺' },
];

export default function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    identifier: '',
    phone: '',
    address: '',
    password: '',
  });

  // Country Selector State
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [error, setError] = useState('');
  const { login, signup } = useAuth();

  const handlePhoneChange = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (numeric.length <= selectedCountry.length) {
      setFormData({ ...formData, phone: numeric });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    // Validations
    if (!isLogin) {
      if (formData.password.length < 10) {
        setError('Password must be at least 10 characters long.');
        setLoading(false);
        return;
      }

      if (formData.phone.length !== selectedCountry.length) {
        setError(`Please enter a valid ${selectedCountry.length}-digit mobile number for ${selectedCountry.name}.`);
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const success = await login(formData.identifier, formData.password);
        if (!success) setError('No account found with these credentials.');
      } else {
        const fullPhoneNumber = `${selectedCountry.dial_code}${formData.phone}`;

        await signup({
          name: formData.name,
          handle: formData.handle,
          email: formData.identifier,
          phone: fullPhoneNumber,
          address: formData.address,
          password: formData.password,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>
            <Logo />

            <View style={styles.card}>
              <View style={styles.cardGradient} />

              <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
              <Text style={styles.subtitle}>
                {isLogin
                  ? 'Enter your credentials to access your feed.'
                  : 'Join the elite network of digital curators.'}
              </Text>

              <View style={styles.form}>
                {!isLogin && (
                  <>
                    <View style={styles.inputWrapper}>
                      <User size={18} color="#6b7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#6b7280"
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                        autoCapitalize="words"
                      />
                    </View>

                    <View style={styles.inputWrapper}>
                      <AtSign size={18} color="#6b7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="User ID (Handle)"
                        placeholderTextColor="#6b7280"
                        value={formData.handle}
                        onChangeText={(text) => setFormData({ ...formData, handle: text })}
                        autoCapitalize="none"
                      />
                    </View>

                    {/* Phone Number with Country Selector */}
                    <View style={styles.phoneRow}>
                      <TouchableOpacity
                        style={styles.countryButton}
                        onPress={() => setShowCountryDropdown(true)}
                      >
                        <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                        <Text style={styles.countryCode}>{selectedCountry.dial_code}</Text>
                        <ChevronDown size={14} color="#9ca3af" />
                      </TouchableOpacity>

                      <View style={[styles.inputWrapper, styles.phoneInputWrapper]}>
                        <Phone size={18} color="#6b7280" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder={`Phone (${selectedCountry.length} digits)`}
                          placeholderTextColor="#6b7280"
                          value={formData.phone}
                          onChangeText={handlePhoneChange}
                          keyboardType="phone-pad"
                        />
                      </View>
                    </View>

                    {/* Country Modal */}
                    <Modal
                      visible={showCountryDropdown}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setShowCountryDropdown(false)}
                    >
                      <TouchableWithoutFeedback onPress={() => setShowCountryDropdown(false)}>
                        <View style={styles.modalOverlay}>
                          <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                              <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Country</Text>
                                <TouchableOpacity onPress={() => setShowCountryDropdown(false)}>
                                  <Text style={styles.modalClose}>✕</Text>
                                </TouchableOpacity>
                              </View>
                              <FlatList
                                data={COUNTRIES}
                                keyExtractor={(item) => item.code}
                                renderItem={({ item }) => (
                                  <TouchableOpacity
                                    style={[
                                      styles.countryItem,
                                      selectedCountry.code === item.code && styles.countryItemSelected,
                                    ]}
                                    onPress={() => {
                                      setSelectedCountry(item);
                                      setShowCountryDropdown(false);
                                      setFormData({ ...formData, phone: '' });
                                    }}
                                  >
                                    <View style={styles.countryItemLeft}>
                                      <Text style={styles.countryItemFlag}>{item.flag}</Text>
                                      <Text style={styles.countryItemName}>{item.name}</Text>
                                      <Text style={styles.countryItemDial}>({item.dial_code})</Text>
                                    </View>
                                    {selectedCountry.code === item.code && (
                                      <Check size={16} color="#ec4899" />
                                    )}
                                  </TouchableOpacity>
                                )}
                              />
                            </View>
                          </TouchableWithoutFeedback>
                        </View>
                      </TouchableWithoutFeedback>
                    </Modal>

                    <View style={styles.inputWrapper}>
                      <MapPin size={18} color="#6b7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Full Address (Optional)"
                        placeholderTextColor="#6b7280"
                        value={formData.address}
                        onChangeText={(text) => setFormData({ ...formData, address: text })}
                      />
                    </View>
                  </>
                )}

                <View style={styles.inputWrapper}>
                  {isLogin ? (
                    <Fingerprint size={18} color="#6b7280" style={styles.inputIcon} />
                  ) : (
                    <Mail size={18} color="#6b7280" style={styles.inputIcon} />
                  )}
                  <TextInput
                    style={styles.input}
                    placeholder={isLogin ? 'Email, Phone or User ID' : 'Email ID'}
                    placeholderTextColor="#6b7280"
                    value={formData.identifier}
                    onChangeText={(text) => setFormData({ ...formData, identifier: text })}
                    autoCapitalize="none"
                    keyboardType={isLogin ? 'default' : 'email-address'}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Lock size={18} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={isLogin ? 'Password' : 'Create Password (10+ chars)'}
                    placeholderTextColor="#6b7280"
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    secureTextEntry
                  />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 size={20} color="#000" style={styles.spinner} />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Join Now'}</Text>
                      <ArrowRight size={18} color="#000" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity
                onPress={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({
                    name: '',
                    handle: '',
                    identifier: '',
                    phone: '',
                    address: '',
                    password: '',
                  });
                }}
                style={styles.switchButton}
              >
                <Text style={styles.switchText}>
                  {isLogin
                    ? "Don't have an account? Create one"
                    : 'Already have an account? Sign in'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <ShieldCheck size={16} color="#4b5563" />
              <Text style={styles.footerText}>Secure Blockchain Encryption</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  inner: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 24,
    marginTop: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(90deg, #ec4899, #3b82f6, #f97316)',
    opacity: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    height: 52,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
  },
  input: {
    flex: 1,
    paddingLeft: 44,
    paddingRight: 16,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryCode: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  phoneInputWrapper: {
    flex: 1,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spinner: {
    alignSelf: 'center',
  },
  divider: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  switchButton: {
    marginTop: 8,
  },
  switchText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  footerText: {
    color: '#4b5563',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalClose: {
    color: '#9ca3af',
    fontSize: 18,
    fontWeight: 'bold',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  countryItemSelected: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  countryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryItemFlag: {
    fontSize: 20,
  },
  countryItemName: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500',
  },
  countryItemDial: {
    color: '#6b7280',
    fontSize: 12,
  },
});