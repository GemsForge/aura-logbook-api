import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Surface } from '@/components/Surface';
import { Colors } from '@/constants/Colors';

/** Presents an honest, data-free shell until the mobile API and auth contracts are ready. */
export default function TodayScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>AURA LOGBOOK</Text>
      <Text style={styles.title}>A little space{ '\n' }to notice.</Text>
      <Text style={styles.support}>A brighter day begins with a small pause.</Text>
      <Surface style={styles.checkin}>
        <Text style={styles.eyebrow}>YOUR DAILY CHECK-IN</Text>
        <Text style={styles.cardTitle}>How are you feeling?</Text>
        <View style={styles.orb} accessibilityElementsHidden />
        <Text style={styles.body}>Your mood and reflections will live here, together.</Text>
      </Surface>
      <Surface style={styles.prompt}>
        <Text style={styles.eyebrow}>A MOMENT TO REFLECT</Text>
        <Text style={styles.promptText}>What would you like to make a little space for today?</Text>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, backgroundColor: Colors.canvas, padding: 24, paddingTop: 36, gap: 18 },
  eyebrow: { color: Colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2.2 },
  title: { color: Colors.ink, fontFamily: 'serif', fontSize: 43, lineHeight: 49, letterSpacing: -1.5 },
  support: { color: Colors.muted, fontSize: 15, lineHeight: 22, marginTop: -10 },
  checkin: { minHeight: 230, overflow: 'hidden' },
  cardTitle: { color: Colors.ink, fontFamily: 'serif', fontSize: 27, marginTop: 16 },
  body: { color: Colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 260 },
  orb: { position: 'absolute', right: -22, bottom: -28, width: 132, height: 132, borderRadius: 66, backgroundColor: Colors.accentWash, borderWidth: 1, borderColor: 'rgba(98,122,104,.2)' },
  prompt: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  promptText: { color: Colors.white, fontFamily: 'serif', fontSize: 24, lineHeight: 32, marginTop: 15 },
});
