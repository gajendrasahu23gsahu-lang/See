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
import { ArrowLeft, Shield } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface PrivacyPolicyViewProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyView({ visible, onClose }: PrivacyPolicyViewProps) {
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
            <Shield size={20} color="#4ade80" />
            <Text style={[styles.title, { color: theme.text }]}>Privacy Policy</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.innerContent}>
            <View style={styles.headerSection}>
              <Text style={[styles.mainTitle, { color: theme.text }]}>Privacy Policy for "See" App</Text>
              <View style={styles.effectiveDate}>
                <Text style={[styles.dateText, { color: theme.secondaryText }]}>Effective Date: [Date]</Text>
                <Text style={[styles.dateText, { color: theme.secondaryText }]}>Last Updated: [Date]</Text>
              </View>
            </View>

            <Section theme={theme}>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                This Privacy Policy ("Policy") describes how "See" ("we", "us", "our"), the AI-powered search engine and social media platform, collects, uses, stores, shares, and protects your information. It also outlines your rights concerning your personal data.
              </Text>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                By downloading, accessing, or using the See application ("App"), you expressly consent to the practices described in this Policy. If you do not agree with these terms, please do not use our App.
              </Text>
              <Text style={[styles.highlightedText, { borderLeftColor: '#3b82f6' }]}>
                We comply with India's Digital Personal Data Protection Act, 2023 (DPDP Act) and other applicable data protection laws.
              </Text>
            </Section>

            <Section title="1. Information We Collect" theme={theme}>
              <Text style={[styles.sectionSub, { color: theme.text }]}>We collect information to provide, secure, and improve our services.</Text>

              <SubSection title="A. Information You Provide Directly:" theme={theme}>
                <BulletPoint theme={theme} label="Account Information:" description="During registration and profile setup, we collect your name, email address, phone number, physical address (if provided), a unique @handle, and a password (as managed via AuthContext.tsx)." />
                <BulletPoint theme={theme} label="User Content:" description="This includes posts, comments, messages (including self-destructing messages), searches, queries, chat history, interactions, and any other content you generate or share on the App." />
                <BulletPoint theme={theme} label="Communications:" description="Information provided when you contact our support team or communicate with us." />
              </SubSection>

              <SubSection title="B. Information Collected Automatically:" theme={theme}>
                <BulletPoint theme={theme} label="Device & Usage Data:" description="We collect information about your interaction with the App, including device type, operating system, IP address, browser type, app crashes, and usage patterns (e.g., features used, time spent)." />
                <BulletPoint theme={theme} label="Metadata:" description="As referenced in metadata.json, we request permissions to access certain device features to enable specific functionalities:" />
                <View style={styles.nestedList}>
                  <Text style={[styles.nestedItem, { color: theme.secondaryText }]}>- Camera: To allow you to capture and upload photos/videos.</Text>
                  <Text style={[styles.nestedItem, { color: theme.secondaryText }]}>- Microphone: To enable voice searches, audio messages, and voice-based interactions.</Text>
                  <Text style={[styles.nestedItem, { color: theme.secondaryText }]}>- Geolocation (Precise & Approximate): To provide location-aware search results, localized news feeds, and social features.</Text>
                </View>
                <Text style={[styles.smallNote, { color: theme.secondaryText }]}>
                  This access is strictly permission-based and can be revoked at any time via your device settings.
                </Text>
                <BulletPoint theme={theme} label="Cookies & Similar Technologies:" description="We use cookies, log files, and tracking pixels to analyze trends, administer the App, and gather demographic information." />
              </SubSection>
            </Section>

            <Section title="2. How We Use Your Data" theme={theme}>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                We use the collected data for the following lawful purposes, including based on your consent and for the provision of contracted services:
              </Text>
              <View style={styles.cardGrid}>
                <InfoCard theme={theme} title="To Provide & Personalize Services" description="To operate, maintain, and provide the core features of the App, including AI-powered search (utilizing models like Gemini 3 Flash), personalized news feed curation, chat services, and social networking." />
                <InfoCard theme={theme} title="For Communication" description="To send you service-related announcements, administrative messages, and responses to your support inquiries." />
                <InfoCard theme={theme} title="For Research & Development" description="To improve, test, and enhance the safety, security, and performance of our AI models and App features." />
                <InfoCard theme={theme} title="For Safety & Security" description="To authenticate users, detect and prevent fraud, abuse, security risks, and violations of our Terms of Service. This includes enabling features like blocking/reporting other users." />
                <InfoCard theme={theme} title="For Advertising" description="To deliver non-intrusive, personalized Native Ads and sponsored articles within your feed, based on your activity and interests. We do not use traditional banner ads." />
              </View>
            </Section>

            <Section title="3. AI & Third-Party Data Sharing" theme={theme}>
              <View style={styles.sharingRow}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(236,72,153,0.1)' }]}>
                  <Shield size={20} color="#ec4899" />
                </View>
                <View style={styles.sharingText}>
                  <Text style={[styles.sharingTitle, { color: theme.text }]}>AI Processing (Gemini)</Text>
                  <Text style={[styles.sharingDesc, { color: theme.secondaryText }]}>
                    To process your search queries and provide AI-generated responses, we share your query text and relevant context with Google's Gemini AI models. This sharing is essential for service provision.
                  </Text>
                </View>
              </View>
              <View style={styles.sharingRow}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                  <Shield size={20} color="#3b82f6" />
                </View>
                <View style={styles.sharingText}>
                  <Text style={[styles.sharingTitle, { color: theme.text }]}>Service Providers</Text>
                  <Text style={[styles.sharingDesc, { color: theme.secondaryText }]}>
                    We engage trusted third-party vendors and partners to perform functions like cloud hosting, data analysis, customer support, and ad measurement under strict contractual obligations of confidentiality.
                  </Text>
                </View>
              </View>
              <View style={[styles.noSellBox, { borderColor: 'rgba(236,72,153,0.2)' }]}>
                <Text style={[styles.noSellText, { color: theme.text }]}>
                  We do not sell your personal data to third parties for their independent marketing purposes.
                </Text>
              </View>
            </Section>

            <Section title="4. Data Security & Specific Features" theme={theme}>
              <View style={[styles.featureBox, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>Self-Destructing Messages</Text>
                <Text style={[styles.featureDesc, { color: theme.secondaryText }]}>
                  The 'self-destructing message' feature in the messenger is designed to delete the content of the message from our active servers approximately{' '}
                  <Text style={styles.bold}>30 seconds</Text> after it is first viewed by the recipient.
                </Text>
                <Text style={styles.warningNote}>
                  Please note: recipients may screenshot or copy the content before it disappears. We cannot control such actions by users.
                </Text>
              </View>
              <View style={[styles.featureBox, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>Security Measures</Text>
                <Text style={[styles.featureDesc, { color: theme.secondaryText }]}>
                  We implement reasonable administrative, technical, and physical security measures designed to protect your personal data from unauthorized access, loss, misuse, or alteration. However, no electronic storage is 100% secure.
                </Text>
              </View>
            </Section>

            <Section title="5. User Rights Under the DPDP Act & Others" theme={theme}>
              <Text style={[styles.paragraph, { color: theme.secondaryText }]}>
                As a Data Principal under the DPDP Act, you have the following rights regarding your personal data:
              </Text>
              <View style={styles.rightsGrid}>
                <RightCard theme={theme} title="Right to Access" description="Request a summary of the personal data we hold about you and how we process it." />
                <RightCard theme={theme} title="Correction & Erasure" description="Request correction of inaccurate data or permanent deletion of your account and data at any time." />
                <RightCard theme={theme} title="Grievance Redressal" description="Register a grievance with us; we will resolve it per the DPDP Act's provisions." />
                <RightCard theme={theme} title="Right to Nominate" description="Nominate an individual to exercise your rights on your behalf in the event of death." />
              </View>
            </Section>

            <Section title="6. Data Retention" theme={theme}>
              <Text style={[styles.paragraph, { color: theme.secondaryText }]}>
                We retain your personal data only as long as necessary to fulfill the purposes outlined in this Policy, unless a longer retention period is required or permitted by law. When you delete your account, we will initiate the process to delete your data from active servers.
              </Text>
            </Section>

            <Section title="7. Children's Privacy" theme={theme}>
              <Text style={[styles.paragraph, { color: theme.secondaryText }]}>
                Our App is not directed to individuals under the age of 18 ("Minors"). We do not knowingly collect personal data from Minors. If we become aware that a Minor has provided us with data, we will take steps to delete it.
              </Text>
            </Section>

            <Section title="8. Grievance Officer & Contact" theme={theme}>
              <View style={[styles.contactBox, { borderColor: 'rgba(59,130,246,0.2)', backgroundColor: theme.inputBg }]}>
                <View style={styles.contactItem}>
                  <Text style={[styles.contactLabel, { color: theme.secondaryText }]}>Officer Name</Text>
                  <Text style={[styles.contactValue, { color: theme.text }]}>[Name]</Text>
                </View>
                <View style={styles.contactItem}>
                  <Text style={[styles.contactLabel, { color: theme.secondaryText }]}>Email Address</Text>
                  <Text style={[styles.contactValue, { color: '#60a5fa' }]}>privacy@seeapp.com</Text>
                </View>
                <View style={styles.contactItem}>
                  <Text style={[styles.contactLabel, { color: theme.secondaryText }]}>Mailing Address</Text>
                  <Text style={[styles.contactValue, { color: theme.text }]}>[Registered Office Address of the Company, India]</Text>
                </View>
              </View>
            </Section>

            <Section title="9. Changes to This Policy" theme={theme}>
              <Text style={[styles.paragraph, { color: theme.secondaryText }]}>
                We may update this Policy periodically. We will notify you of any material changes by posting the new Policy within the App and updating the "Last Updated" date. Your continued use of the App after such changes constitutes your acceptance of the revised Policy.
              </Text>
            </Section>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Helper components for readability
const Section: React.FC<{ title?: string; theme: any; children: React.ReactNode }> = ({ title, theme, children }) => (
  <View style={styles.section}>
    {title && <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>}
    {children}
  </View>
);

const SubSection: React.FC<{ title: string; theme: any; children: React.ReactNode }> = ({ title, theme, children }) => (
  <View style={styles.subsection}>
    <View style={styles.subsectionHeader}>
      <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />
      <Text style={[styles.subsectionTitle, { color: theme.text }]}>{title}</Text>
    </View>
    {children}
  </View>
);

const BulletPoint: React.FC<{ label: string; description: string; theme: any }> = ({ label, description, theme }) => (
  <View style={styles.bullet}>
    <Text style={[styles.bulletLabel, { color: theme.text }]}>• {label}</Text>
    <Text style={[styles.bulletDesc, { color: theme.secondaryText }]}>{description}</Text>
  </View>
);

const InfoCard: React.FC<{ title: string; description: string; theme: any }> = ({ title, description, theme }) => (
  <View style={[styles.infoCard, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
    <Text style={[styles.infoCardTitle, { color: theme.text }]}>{title}</Text>
    <Text style={[styles.infoCardDesc, { color: theme.secondaryText }]}>{description}</Text>
  </View>
);

const RightCard: React.FC<{ title: string; description: string; theme: any }> = ({ title, description, theme }) => (
  <View style={[styles.rightCard, { borderColor: theme.border, backgroundColor: 'rgba(255,255,255,0.05)' }]}>
    <Text style={[styles.rightCardTitle, { color: theme.text }]}>{title}</Text>
    <Text style={[styles.rightCardDesc, { color: theme.secondaryText }]}>{description}</Text>
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
  effectiveDate: {
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  highlightedText: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    paddingVertical: 4,
    fontWeight: 'bold',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionSub: {
    fontSize: 15,
    marginBottom: 12,
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bullet: {
    marginBottom: 10,
    paddingLeft: 8,
  },
  bulletLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  bulletDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  nestedList: {
    marginLeft: 16,
    marginBottom: 8,
  },
  nestedItem: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  smallNote: {
    fontSize: 11,
    fontStyle: 'italic',
    marginLeft: 16,
    marginBottom: 10,
  },
  cardGrid: {
    gap: 12,
  },
  infoCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoCardTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 14,
  },
  infoCardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  sharingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharingText: {
    flex: 1,
  },
  sharingTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  sharingDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  noSellBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.2)',
    backgroundColor: 'rgba(236,72,153,0.05)',
    alignItems: 'center',
    marginTop: 8,
  },
  noSellText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  featureBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  featureTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  warningNote: {
    fontSize: 11,
    color: '#f97316',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  bold: {
    fontWeight: 'bold',
    color: '#fff',
  },
  rightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  rightCard: {
    width: '48%', // approx for two columns
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  rightCardTitle: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 4,
  },
  rightCardDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  contactBox: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(59,130,246,0.2)',
    gap: 16,
  },
  contactItem: {
    gap: 4,
  },
  contactLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactValue: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});