import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  favorites: [],
  loading: false,
  error: null,
};

export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    addFavorite: (state, action) => {
      const songExists = state.favorites.some(song => song.id === action.payload.id);
      if (!songExists) {
        state.favorites.push(action.payload);
      }
    },
    removeFavorite: (state, action) => {
      state.favorites = state.favorites.filter(song => song.id !== action.payload);
    },
    setFavorites: (state, action) => {
      state.favorites = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { 
  addFavorite, 
  removeFavorite, 
  setFavorites,
  setLoading,
  setError
} = favoritesSlice.actions;

export const selectFavorites = state => state.favorites.favorites;
export const selectLoading = state => state.favorites.loading;
export const selectError = state => state.favorites.error;

export default favoritesSlice.reducer; 