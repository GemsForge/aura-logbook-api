import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';

/** Gives unknown native routes a calm recovery path back to Today. */
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This page isn't here.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Return to Today</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: Colors.canvas }, title: { color: Colors.ink, fontSize: 20, fontWeight: '600' }, link: { marginTop: 15, paddingVertical: 15 }, linkText: { color: Colors.accent, fontSize: 15, fontWeight: '600' } });
