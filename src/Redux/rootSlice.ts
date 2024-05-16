import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { defaultPrefs } from '../Utilities/userApi';
import { Config, RootState, PreferencesContainer, User } from '../Types/global';


// Define initialState with the RootState type
const initialState: RootState = {
  currentRoot: "",
  currentUser: null,
  currentPrefs: defaultPrefs,
  currentConfig: null
};

export const rootSlice = createSlice({
  name: 'root',
  initialState,
  reducers: {
    setCurrentRoot: (state, action: PayloadAction<string>) => {
      state.currentRoot = action.payload;
    },
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
    setCurrentPrefs: (state, action: PayloadAction<PreferencesContainer>) => {
      state.currentPrefs = action.payload;
    },
    setCurrentConfig: (state, action: PayloadAction<Config | null>) => {
      state.currentConfig = action.payload;
    },
  }
});

export const { setCurrentRoot, setCurrentUser, setCurrentPrefs, setCurrentConfig } = rootSlice.actions;

// Selector types will be automatically inferred but can be explicitly set for clarity
export const currentRoot = (state: { root: RootState }) => state.root.currentRoot;
export const currentUser = (state: { root: RootState }) => state.root.currentUser;
export const currentPrefs = (state: { root: RootState }) => state.root.currentPrefs;
export const currentConfig = (state: { root: RootState }) => state.root.currentConfig;

export default rootSlice.reducer;
