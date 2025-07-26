import { create } from 'zustand';

interface CallbackStore {
  callbacks: Record<string, (...args: any[]) => void>;
  setCallback: (id: string, callback: (...args: any[]) => void) => void;
  executeCallback: (id: string, ...args: any[]) => void;
  removeCallback: (id: string) => void;
}

export const useCallbackStore = create<CallbackStore>((set, get) => ({
  callbacks: {},
  
  setCallback: (id: string, callback: (...args: any[]) => void) => {
    set(state => ({
      callbacks: { ...state.callbacks, [id]: callback }
    }));
  },
  
  executeCallback: (id: string, ...args: any[]) => {
    const { callbacks } = get();
    const callback = callbacks[id];
    if (callback) {
      try {
        callback(...args);
      } catch (error) {
        console.error('CallbackStore: Error executing callback:', error);
      }
      // Don't auto-remove callback - let the component manage it
      // This allows reuse and prevents timing issues
    }
  },
  
  removeCallback: (id: string) => {
    set(state => {
      const newCallbacks = { ...state.callbacks };
      delete newCallbacks[id];
      return { callbacks: newCallbacks };
    });
  }
}));
