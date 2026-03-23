import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/redux/store";

export interface QueryLoadingStatus {
  isLoading: boolean;
  isError: boolean;
  araCount: number;
  resultStatus: "error" | "running" | "success" | "unknown";
}

type QueryStatusState = { [pk: string]: QueryLoadingStatus };

const queryStatusSlice = createSlice({
  name: "queryStatus",
  initialState: {} as QueryStatusState,
  reducers: {
    setQueryStatus(state, action: PayloadAction<{ pk: string; status: QueryLoadingStatus }>) {
      state[action.payload.pk] = action.payload.status;
    },
  },
});

export const { setQueryStatus } = queryStatusSlice.actions;

export const getQueryStatusById = (pk: string | null) =>
  (state: RootState) => pk ? state.queryStatus[pk] ?? null : null;

export default queryStatusSlice.reducer;
