import { createSlice } from '@reduxjs/toolkit'

export const rootSlice = createSlice({
  name: 'root',
  initialState: {
    currentRoot: "",
  }, 
  reducers: {
    setCurrentRoot: (state, action) => {
      state.currentRoot = action.payload
    },
  }
})

export const { setCurrentRoot } = rootSlice.actions

export const currentRoot = state => state.root.currentRoot;

export default rootSlice.reducer