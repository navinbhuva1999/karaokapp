import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { 
  selectFavorites,
  selectLoading,
  addFavorite,
  removeFavorite,
  setFavorites,
  setLoading,
  setError 
} from '../redux/favoritesSlice';
import { loadFavoritesFromStorage, saveFavoritesToStorage } from '../utils/storageUtils';
const mockSong = { id: '123', title: 'Shape of You', artist: 'Ed Sheeran' };

const FavoriteSongs = () => {
  const dispatch = useDispatch();
  const favorites = useSelector(selectFavorites);
  const loading = useSelector(selectLoading);

  useEffect(() => {
    const loadFavorites = async () => {
      dispatch(setLoading(true));
      try {
        const storedFavorites = await loadFavoritesFromStorage();
        dispatch(setFavorites(storedFavorites));
      } catch (error) {
        dispatch(setError(error.message));
      } finally {
        dispatch(setLoading(false));
      }
    };

    loadFavorites();
  }, [dispatch]);

  useEffect(() => {
    saveFavoritesToStorage(favorites);
  }, [favorites]);

  const toggleFavorite = (song) => {
    const isFavorite = favorites.some(fav => fav.id === song.id);
    
    if (isFavorite) {
      dispatch(removeFavorite(song.id));
    } else {
      dispatch(addFavorite(song));
    }
  };

  const isFavorite = (songId) => {
    return favorites.some(song => song.id === songId);
  };

  const renderSongItem = ({ item }) => (
    <View style={styles.songItem}>
      <View>
        <Text style={styles.songTitle}>{item.title}</Text>
        <Text style={styles.songArtist}>{item.artist}</Text>
      </View>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => toggleFavorite(item)}
      >
        <Text style={styles.favoriteButtonText}>
          {isFavorite(item.id) ? '❤️ Remove' : '🤍 Add'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Favorite Songs</Text>
      
      <TouchableOpacity
        style={styles.addMockButton}
        onPress={() => toggleFavorite(mockSong)}
      >
        <Text style={styles.addMockButtonText}>
          {isFavorite(mockSong.id) 
            ? 'Remove Test Song from Favorites' 
            : 'Add Test Song to Favorites'}
        </Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#6200EE" />
      ) : (
        <>
          {favorites.length > 0 ? (
            <FlatList
              data={favorites}
              renderItem={renderSongItem}
              keyExtractor={item => item.id}
              style={styles.list}
            />
          ) : (
            <Text style={styles.emptyMessage}>No favorite songs yet</Text>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  songItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  songArtist: {
    fontSize: 14,
    color: '#666',
  },
  favoriteButton: {
    backgroundColor: '#6200EE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  favoriteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  addMockButton: {
    backgroundColor: '#03DAC6',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    alignItems: 'center',
  },
  addMockButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default FavoriteSongs; 