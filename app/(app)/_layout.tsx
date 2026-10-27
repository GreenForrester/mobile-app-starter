import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

// The signed-in area. A Derived App adds its screens as more tabs or pushes them from Home.
export default function AppLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontFamily: theme.fonts.bold },
        sceneStyle: { backgroundColor: theme.colors.background },
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        tabBarActiveTintColor: theme.colors.link,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { fontFamily: theme.fonts.medium },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              color={focused ? theme.colors.link : theme.colors.textMuted}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
