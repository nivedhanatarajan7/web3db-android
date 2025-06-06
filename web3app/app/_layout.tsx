import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { AlertProvider } from "./AlertContext";
import { AuthProvider, useAuth } from "./AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import LoginScreen from "./login";
import { useFonts, Roboto_400Regular } from "@expo-google-fonts/roboto";
SplashScreen.preventAutoHideAsync();
import { LogBox } from 'react-native';

function AppNavigation() {
  const { walletInfo } = useAuth();

  if (walletInfo.connected === undefined) {
    // While checking AsyncStorage, return nothing to avoid flashing login screen
    return null;
  }

  if (!walletInfo.connected) {
    return <LoginScreen />;
  }
  1;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{
          headerShown: true,
          title: "BlockVault",
        }} />
      <Stack.Screen name="+not-found" />
      <Stack.Screen
        name="DataTypeScreen"
        options={{
          headerShown: true,
          title: "Data Overview",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }
  LogBox.ignoreAllLogs();

  return (
    <AuthProvider>
      <AlertProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <AppNavigation />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AlertProvider>
    </AuthProvider>
  );
}
