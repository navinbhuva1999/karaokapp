import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const FAVORITES_STORAGE_KEY = '@karaoke_app_favorites';

// Save favorites to AsyncStorage
export const saveFavoritesToStorage = async (favorites) => {
  try {
    const jsonValue = JSON.stringify(favorites);
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, jsonValue);
    return true;
  } catch (error) {
    console.error('Error saving favorites to storage:', error);
    return false;
  }
};

// Load favorites from AsyncStorage
export const loadFavoritesFromStorage = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading favorites from storage:', error);
    return [];
  }
}; 