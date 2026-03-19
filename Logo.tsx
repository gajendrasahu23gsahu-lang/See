import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

const Logo: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Gradient Text using MaskedView */}
      <MaskedView
        maskElement={
          <Text style={styles.text}>See</Text>
        }
      >
        <LinearGradient
          colors={['#ec4899', '#3b82f6', '#f97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBackground}
        />
      </MaskedView>

      {/* Gradient Line */}
      <LinearGradient
        colors={['transparent', '#3b82f6', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.line}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
    paddingBottom: 32,
  },
  text: {
    fontSize: 72,
    fontWeight: 'bold',
    letterSpacing: -0.5, // tracking-tighter equivalent
    textShadowColor: 'rgba(236, 72, 153, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    backgroundColor: 'transparent', // so mask works correctly
  },
  gradientBackground: {
    width: '100%',
    height: '100%',
  },
  line: {
    width: 96,
    height: 4,
    marginTop: 8,
    borderRadius: 2,
    opacity: 0.5,
  },
});

export default Logo;