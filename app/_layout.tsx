import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import Home from './screens/Home';
import InputScreen from './screens/InputScreen';
import Login from './screens/Login';
import MapScreen from './screens/MapScreen';
import Signup from './screens/Signup';
import { RootStackParamList } from './types/Navigation';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  const Stack = createNativeStackNavigator<RootStackParamList>();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen name="Input" component={InputScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
        </Stack.Navigator>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
