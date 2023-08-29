import { createSlice } from '@reduxjs/toolkit';
import { defaultPrefs } from '../Utilities/userApi';

export const rootSlice = createSlice({
  name: 'root',
  initialState: {
    currentRoot: "",
    currentUser: null,
    currentPrefs: defaultPrefs,
    currentConfig: null
  }, 
  reducers: {
    setCurrentRoot: (state, action) => {
      state.currentRoot = action.payload
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload
    },
    setCurrentPrefs: (state, action) => {
      state.currentPrefs = action.payload
    },
    setCurrentConfig: (state, action) => {
      state.currentConfig = action.payload
    },
  }
})

export const { setCurrentRoot, setCurrentUser, setCurrentPrefs, setCurrentConfig } = rootSlice.actions

export const currentRoot = state => state.root.currentRoot;
export const currentUser = state => state.root.currentUser;
export const currentPrefs = state => state.root.currentPrefs;
export const currentConfig = state => state.root.currentConfig;

export default rootSlice.reducer;