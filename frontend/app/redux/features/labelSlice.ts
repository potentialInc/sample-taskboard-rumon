import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { LabelState, Label } from '~/types/label';

const initialState: LabelState = {
  labels: [],
  loading: false,
  error: null,
};

const labelSlice = createSlice({
  name: 'label',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setLabels: (state, action: PayloadAction<Label[]>) => {
      state.labels = action.payload;
      state.loading = false;
    },
    addLabel: (state, action: PayloadAction<Label>) => {
      state.labels.push(action.payload);
    },
    updateLabel: (state, action: PayloadAction<Label>) => {
      const index = state.labels.findIndex((l) => l.id === action.payload.id);
      if (index !== -1) {
        state.labels[index] = action.payload;
      }
    },
    removeLabel: (state, action: PayloadAction<string>) => {
      state.labels = state.labels.filter((l) => l.id !== action.payload);
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setLoading, setLabels, addLabel, updateLabel, removeLabel, setError } = labelSlice.actions;
export default labelSlice.reducer;
