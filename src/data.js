let history = {
  past: [],
  present: [],
  future: []
};

export const getHistory = () => {
  return history;
}

export const setHistory = (newHistory) => {
  history = newHistory;
}