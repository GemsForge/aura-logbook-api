import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Surface } from '@/components/Surface';

/** Provides the native journal destination while the authenticated history API is prepared. */
export default function JournalScreen() {
  return <View style={styles.page}><Text style={styles.eyebrow}>LOOKING BACK</Text><Text style={styles.title}>Your journal</Text><Surface><Text style={styles.body}>Your saved reflections will appear here once you connect to the Aura Logbook API.</Text></Surface></View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: Colors.canvas, padding: 24, paddingTop: 36, gap: 16 }, eyebrow: { color: Colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2 }, title: { color: Colors.ink, fontFamily: 'serif', fontSize: 40 }, body: { color: Colors.ink, fontSize: 16, lineHeight: 24 } });
