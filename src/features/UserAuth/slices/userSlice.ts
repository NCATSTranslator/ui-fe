import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { defaultPrefs } from '@/features/UserAuth/utils/userDefaults';
import { Config, UserState, Preferences, User } from '@/features/UserAuth/types/user';

const initialState: UserState = {
  currentUser: undefined,
  currentPrefs: defaultPrefs,
  currentConfig: null
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
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

export const { setCurrentUser, setCurrentPrefs, setCurrentConfig } = userSlice.actions;

export const currentUser = (state: { user: UserState }) => state.user.currentUser;
export const currentPrefs = (state: { user: UserState }) => state.user.currentPrefs;
export const currentConfig = (state: { user: UserState }) => state.user.currentConfig;

export default userSlice.reducer;
