import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { defaultPrefs } from '../Utilities/userApi';
import { Config, UserState, PreferencesContainer, User } from '../Types/global';


// Define initialState with the UserState type
const initialState: UserState = {
  currentUser: undefined,
  currentPrefs: defaultPrefs,
  currentConfig: null
};

export const rootSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
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

export const { setCurrentUser, setCurrentPrefs, setCurrentConfig } = rootSlice.actions;

export const currentUser = (state: { root: UserState }) => state.root.currentUser;
export const currentPrefs = (state: { root: UserState }) => state.root.currentPrefs;
export const currentConfig = (state: { root: UserState }) => state.root.currentConfig;

export default rootSlice.reducer;
