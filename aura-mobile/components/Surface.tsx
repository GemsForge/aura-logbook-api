import { StyleSheet, View, type ViewProps } from 'react-native';
import { Colors } from '@/constants/Colors';

/** Standard translucent-feeling native card surface with an accessible neutral edge. */
export function Surface({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.surface, style]} />;
}

const styles = StyleSheet.create({
  surface: { backgroundColor: Colors.surface, borderColor: Colors.line, borderRadius: 24, borderWidth: 1, padding: 20 },
});
