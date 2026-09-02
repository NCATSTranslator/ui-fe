import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { COLOR_MODE_STORAGE_KEY } from '@/redux/storageKeys';

export interface ColorModeState {
  /** When true, canvas and graph nodes are colored by their biolink type. */
  enabled: boolean;
}

/** Color mode is on until the user turns it off. */
const DEFAULT_ENABLED = true;

const loadInitialState = (): ColorModeState => {
  try {
    const stored = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    if (stored === null) return { enabled: DEFAULT_ENABLED };
    const parsed = JSON.parse(stored);
    return { enabled: typeof parsed?.enabled === 'boolean' ? parsed.enabled : DEFAULT_ENABLED };
  } catch {
    return { enabled: DEFAULT_ENABLED };
  }
};

const initialState: ColorModeState = loadInitialState();

const colorModeSlice = createSlice({
  name: 'colorMode',
  initialState,
  reducers: {
    setColorModeEnabled: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload;
    },
  },
});

export const { setColorModeEnabled } = colorModeSlice.actions;

export const currentColorModeEnabled = (state: { colorMode: ColorModeState }): boolean =>
  state.colorMode.enabled;

export default colorModeSlice.reducer;
