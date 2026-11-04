import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Colors } from '@/constants/Colors';

/** Defines the four persistent native destinations for Aura's signed-in experience. */
export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Colors.accent,
      tabBarInactiveTintColor: Colors.muted,
      tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.line, height: Platform.OS === 'ios' ? 86 : 66, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 26 : 8 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarAccessibilityLabel: 'Today' }} />
      <Tabs.Screen name="log" options={{ title: 'Log', tabBarAccessibilityLabel: 'Log a mood' }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal', tabBarAccessibilityLabel: 'Journal history' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarAccessibilityLabel: 'Profile and aura settings' }} />
    </Tabs>
  );
}
