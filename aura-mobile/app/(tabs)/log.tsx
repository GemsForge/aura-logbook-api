import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Surface } from '@/components/Surface';

/** Reserves the focused Log destination for the native mood-entry flow. */
export default function LogScreen() {
  return <View style={styles.page}><Text style={styles.eyebrow}>YOUR JOURNAL</Text><Text style={styles.title}>Log a mood</Text><Surface><Text style={styles.body}>Choose a feeling and add a reflection when the mobile journal service is connected.</Text></Surface></View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: Colors.canvas, padding: 24, paddingTop: 36, gap: 16 }, eyebrow: { color: Colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2 }, title: { color: Colors.ink, fontFamily: 'serif', fontSize: 40 }, body: { color: Colors.ink, fontSize: 16, lineHeight: 24 } });
