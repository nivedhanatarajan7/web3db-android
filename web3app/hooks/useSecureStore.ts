import * as SecureStore from 'expo-secure-store';

export const useSecureStore = () => {
  const saveItem = async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error saving to SecureStore: ${key}`, error);
    }
  };

  const getItem = async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error reading from SecureStore: ${key}`, error);
      return null;
    }
  };

  return { saveItem, getItem };
};
