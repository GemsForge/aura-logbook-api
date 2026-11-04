import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Surface } from '@/components/Surface';

/** Introduces the profile area while clearly labeling its fixed color as a design preview. */
export default function ProfileScreen() {
  return <View style={styles.page}><Text style={styles.eyebrow}>YOUR SPACE</Text><Text style={styles.title}>Profile</Text><Surface><View style={styles.swatch} accessible accessibilityLabel="Example aura color" /><Text style={styles.name}>Aura color</Text><Text style={styles.body}>Your chosen aura color will shape the app’s atmosphere. Personal color selection will be available here soon.</Text><Text style={styles.preview}>COLOR PREVIEW</Text></Surface></View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: Colors.canvas, padding: 24, paddingTop: 36, gap: 16 }, eyebrow: { color: Colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2 }, title: { color: Colors.ink, fontFamily: 'serif', fontSize: 40 }, swatch: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accentWash, borderColor: Colors.accent, borderWidth: 1, marginBottom: 14 }, name: { color: Colors.ink, fontFamily: 'serif', fontSize: 24 }, body: { color: Colors.muted, fontSize: 15, lineHeight: 23, marginTop: 8 }, preview: { color: Colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginTop: 16 } });
