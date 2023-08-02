import { createSlice } from '@reduxjs/toolkit'

export const rootSlice = createSlice({
  name: 'root',
  initialState: {
    currentRoot: "",
    currentUser: null,
  }, 
  reducers: {
    setCurrentRoot: (state, action) => {
      state.currentRoot = action.payload
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload
    },
  }
})

export const { setCurrentRoot, setCurrentUser } = rootSlice.actions

export const currentRoot = state => state.root.currentRoot;
export const currentUser = state => state.root.currentUser;

export default rootSlice.reducer