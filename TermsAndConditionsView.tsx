import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft, FileText } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface TermsAndConditionsViewProps {
  visible: boolean;
  onClose: () => void;
}

export default function TermsAndConditionsView({ visible, onClose }: TermsAndConditionsViewProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.navBg }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <FileText size={20} color="#60a5fa" />
            <Text style={[styles.title, { color: theme.text }]}>Terms and Conditions</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.innerContent}>
            <View style={styles.headerSection}>
              <Text style={[styles.mainTitle, { color: theme.text }]}>Terms and Conditions for See</Text>
              <Text style={[styles.lastUpdated, { color: theme.secondaryText }]}>
                Last Updated: January 4, 2026
              </Text>
            </View>

            <Section title="1. Acceptance of Terms" theme={theme}>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                By downloading, accessing, or using the "See Search" application ('the App'), provided by [Your Company Name] ('we,' 'us,' or 'our'), you agree to be bound by these Terms and Conditions ('Terms'). The App provides an AI-powered search engine and social media platform. If you do not agree to these Terms, you must not use the App.
              </Text>
            </Section>

            <Section title="2. Eligibility" theme={theme}>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                You must be at least the age of digital consent in your country to use the App. In many jurisdictions, this is 13 years or older. You affirm that you are fully able and competent to enter into these Terms. We comply with applicable laws regarding age assurance and parental consent.
              </Text>
            </Section>

            <Section title="3. User Account and Registration" theme={theme}>
              <View style={styles.indentedBlock}>
                <BulletItem label="Account Creation:" theme={theme}>
                  To access certain features, you must register for an account by providing accurate and complete information, including your name, a valid email address, a phone number, and a unique @handle.
                </BulletItem>
                <BulletItem label="Account Security:" theme={theme}>
                  You are solely responsible for maintaining the confidentiality of your password and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
                </BulletItem>
                <BulletItem label="Account Accuracy:" theme={theme}>
                  You agree to keep your account information current and truthful.
                </BulletItem>
              </View>
            </Section>

            <Section title="4. User Conduct and Content Policy" theme={theme}>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                You are solely responsible for all content (text, images, links, etc.) that you post, transmit, or display on the App.
              </Text>
              <View style={styles.subsection}>
                <Text style={[styles.boldText, { color: theme.text }]}>Prohibited Content: You agree not to post content that is:</Text>
                <View style={styles.bulletList}>
                  <Text style={[styles.bulletItem, { color: theme.secondaryText }]}>• Unlawful, harmful, threatening, abusive, harassing, defamatory, or hateful.</Text>
                  <Text style={[styles.bulletItem, { color: theme.secondaryText }]}>• Obscene, pornographic, or excessively violent.</Text>
                  <Text style={[styles.bulletItem, { color: theme.secondaryText }]}>• Fraudulent, misleading, or constitutes spam.</Text>
                  <Text style={[styles.bulletItem, { color: theme.secondaryText }]}>• Infringes upon the intellectual property, privacy, or other rights of any third party.</Text>
                </View>
                <BulletItem label="AI-Enabled Moderation:" theme={theme}>
                  All user-generated content is subject to automated review by our AI systems to detect violations of this policy.
                </BulletItem>
                <BulletItem label="Enforcement:" theme={theme}>
                  We reserve the right to remove any content and to suspend or permanently terminate ('block') your account for violations of these Terms.
                </BulletItem>
              </View>
            </Section>

            <Section title="5. Subscriptions and Verified Badge" theme={theme}>
              <View style={styles.indentedBlock}>
                <BulletItem label="Verified Badge:" theme={theme}>
                  A 'Verified Badge' may be offered as a paid subscription to authenticate the identity of notable users.
                </BulletItem>
                <BulletItem label="Payment:" theme={theme}>
                  Payment for the subscription shall be processed through your device's official app store. All payment terms are governed by the respective app store's rules.
                </BulletItem>
                <BulletItem label="No Refund of Fees:" theme={theme}>
                  Subscription fees for the Verified Badge are non-refundable, except as required by applicable law.
                </BulletItem>
                <BulletItem label="Revocation:" theme={theme}>
                  We reserve the right to revoke the Verified Badge at any time if we determine that your use of it is misleading.
                </BulletItem>
              </View>
            </Section>

            <Section title="6. Intellectual Property Rights" theme={theme}>
              <View style={styles.indentedBlock}>
                <BulletItem label="Our Property:" theme={theme}>
                  The 'See' logo, the App's name, user interface, design, and source code are the exclusive intellectual property of [Your Company Name].
                </BulletItem>
                <BulletItem label="Your Content:" theme={theme}>
                  You retain ownership of original content you share. You grant us a worldwide, royalty-free license to use, host, and display such content to operate the App.
                </BulletItem>
              </View>
            </Section>

            <Section title="7. AI Search Functionality & Third-Party Services" theme={theme}>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                The App's search results are powered by third-party AI models (e.g., Google's Gemini). We do not generate these results and are not responsible for their accuracy, completeness, or legality. Your use of AI-generated information is at your own risk.
              </Text>
            </Section>

            <Section title="8. Privacy" theme={theme}>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                Your privacy is important. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the App, you consent to such processing.
              </Text>
            </Section>

            <Section title="9. Disclaimers and Limitation of Liability" theme={theme}>
              <View style={styles.indentedBlock}>
                <BulletItem label="Service 'As Is':" theme={theme}>
                  The App is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind.
                </BulletItem>
                <BulletItem label="No Guarantees:" theme={theme}>
                  We do not guarantee that the App will be uninterrupted, secure, or error-free.
                </BulletItem>
                <BulletItem label="Limitation of Liability:" theme={theme}>
                  To the fullest extent permitted by law, [Your Company Name] shall not be liable for any indirect or consequential damages arising out of your use of the App.
                </BulletItem>
              </View>
            </Section>

            <Section title="10. Termination" theme={theme}>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                We may suspend or terminate your access to the App immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </Text>
            </Section>

            <Section title="11. Governing Law and Dispute Resolution" theme={theme}>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in [Your City, State, India].
              </Text>
            </Section>

            <Section title="12. Changes to Terms" theme={theme}>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                We reserve the right to modify these Terms at any time. We will provide notice of material changes via the App or by email. Your continued use of the App after such changes constitutes your acceptance of the new Terms.
              </Text>
            </Section>

            <View style={[styles.contactBox, { borderColor: 'rgba(59,130,246,0.2)', backgroundColor: theme.inputBg }]}>
              <Text style={[styles.contactTitle, { color: theme.text }]}>13. Contact Us</Text>
              <Text style={[styles.contactText, { color: theme.secondaryText }]}>
                If you have any questions about these Terms, please contact us at: [Your Contact Email/Address].
              </Text>
            </View>

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                Disclaimer: This document is a template provided for informational purposes and does not constitute legal advice. You are strongly advised to consult with a qualified legal professional to ensure these Terms and Conditions are complete, enforceable, and compliant with all applicable laws in your jurisdiction, including India's Digital Personal Data Protection Act, Consumer Protection Act, and the Information Technology Act.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Helper components
const Section: React.FC<{ title: string; theme: any; children: React.ReactNode }> = ({ title, theme, children }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
    {children}
  </View>
);

const BulletItem: React.FC<{ label: string; theme: any; children: React.ReactNode }> = ({ label, theme, children }) => (
  <View style={styles.bulletItemContainer}>
    <Text style={[styles.bulletLabel, { color: theme.text }]}>• {label}</Text>
    <Text style={[styles.bulletDesc, { color: theme.secondaryText }]}>{children}</Text>
  </View>
);

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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  innerContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  headerSection: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 20,
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  indentedBlock: {
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
  },
  subsection: {
    paddingLeft: 12,
    marginTop: 8,
  },
  bulletList: {
    marginLeft: 16,
    marginVertical: 8,
  },
  bulletItem: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
  },
  bulletItemContainer: {
    marginBottom: 12,
  },
  bulletLabel: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  bulletDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  contactBox: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    marginTop: 16,
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
  },
  disclaimer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  disclaimerText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#4b5563',
    fontStyle: 'italic',
    lineHeight: 14,
  },
});