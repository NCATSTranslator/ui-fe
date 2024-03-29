import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { defaultPrefs, Preferences } from '../Utilities/userApi';

interface User {
  id: string;
  name: string;
  email: string;
  time_created: string;
  time_updated: string;
  profile_pic_url: string;
  data: object | null;
  deleted: boolean;
}

interface Config {
  cached_queries: object[];
  gaID: string;
  name_resolver: string;
  socialProviders: object;
}

interface RootState {
  currentRoot: string;
  currentUser: User | null; 
  currentPrefs: Preferences;
  currentConfig: Config | null;
}

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
    setCurrentPrefs: (state, action: PayloadAction<Preferences>) => {
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
