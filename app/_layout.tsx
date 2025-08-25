import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

export default function RootLayout() {

  return (
      <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name="index" options={{title: 'Home'}}/>  
        <Stack.Screen name="login" options={{title: 'Login'}}/>
        <Stack.Screen name="signup" options={{ title: 'Sign Up'}}/>
        <Stack.Screen name="disclaimer" options={{title: 'Disclaimer'}}/>
        <Stack.Screen name="dashboard" options={{title: 'Dashboard'}}/>
        <Stack.Screen name="addMember" options={{title: 'AddMember'}}/>
        <Stack.Screen name="editMember" options={{title: 'EditMember'}}/>
        <Toast/>
      </Stack>
  );
}

