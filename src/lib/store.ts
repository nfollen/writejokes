import { create } from 'zustand';
import type { User, Joke, SetList, JokeStyle, JokeCategory, GeneratedPrompt } from '@/types';

interface AppState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;

  // Writing Session
  currentPrompt: GeneratedPrompt | null;
  setCurrentPrompt: (prompt: GeneratedPrompt | null) => void;
  selectedStyle: JokeStyle;
  setSelectedStyle: (style: JokeStyle) => void;
  selectedCategory: JokeCategory;
  setSelectedCategory: (category: JokeCategory) => void;
  jokeText: string;
  setJokeText: (text: string) => void;
  isGrading: boolean;
  setIsGrading: (grading: boolean) => void;

  // Jokes
  jokes: Joke[];
  setJokes: (jokes: Joke[]) => void;
  addJoke: (joke: Joke) => void;
  updateJoke: (id: string, updates: Partial<Joke>) => void;
  deleteJoke: (id: string) => void;

  // Set Lists
  setLists: SetList[];
  setSetLists: (setLists: SetList[]) => void;
  addSetList: (setList: SetList) => void;
  updateSetList: (id: string, updates: Partial<SetList>) => void;
  deleteSetList: (id: string) => void;
  currentSetList: SetList | null;
  setCurrentSetList: (setList: SetList | null) => void;

  // UI State
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  user: null,
  currentPrompt: null,
  selectedStyle: 'standup' as JokeStyle,
  selectedCategory: 'daily-life' as JokeCategory,
  jokeText: '',
  isGrading: false,
  jokes: [],
  setLists: [],
  currentSetList: null,
  showUpgradeModal: false,
  showOnboarding: false,
};

export const useStore = create<AppState>((set) => ({
  ...initialState,

  // User actions
  setUser: (user) => set({ user }),
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  // Writing session actions
  setCurrentPrompt: (currentPrompt) => set({ currentPrompt }),
  setSelectedStyle: (selectedStyle) => set({ selectedStyle }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setJokeText: (jokeText) => set({ jokeText }),
  setIsGrading: (isGrading) => set({ isGrading }),

  // Jokes actions
  setJokes: (jokes) => set({ jokes }),
  addJoke: (joke) => set((state) => ({ jokes: [joke, ...state.jokes] })),
  updateJoke: (id, updates) =>
    set((state) => ({
      jokes: state.jokes.map((j) => (j.id === id ? { ...j, ...updates } : j)),
    })),
  deleteJoke: (id) =>
    set((state) => ({
      jokes: state.jokes.filter((j) => j.id !== id),
    })),

  // Set lists actions
  setSetLists: (setLists) => set({ setLists }),
  addSetList: (setList) =>
    set((state) => ({ setLists: [setList, ...state.setLists] })),
  updateSetList: (id, updates) =>
    set((state) => ({
      setLists: state.setLists.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),
  deleteSetList: (id) =>
    set((state) => ({
      setLists: state.setLists.filter((s) => s.id !== id),
      currentSetList:
        state.currentSetList?.id === id ? null : state.currentSetList,
    })),
  setCurrentSetList: (currentSetList) => set({ currentSetList }),

  // UI actions
  setShowUpgradeModal: (showUpgradeModal) => set({ showUpgradeModal }),
  setShowOnboarding: (showOnboarding) => set({ showOnboarding }),

  // Reset
  reset: () => set(initialState),
}));
