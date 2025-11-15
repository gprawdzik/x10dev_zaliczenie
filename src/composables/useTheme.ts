import { computed, onMounted, ref } from 'vue';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'stravagoals-theme';
const theme = ref<Theme>('light');
let initialized = false;

const applyThemeClass = (value: Theme) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle('dark', value === 'dark');
  root.dataset.theme = value;
  root.style.colorScheme = value;
};

const resolveInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return theme.value;
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const initializeTheme = () => {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  initialized = true;
  const initialTheme = resolveInitialTheme();
  theme.value = initialTheme;
  applyThemeClass(initialTheme);
};

const setTheme = (value: Theme) => {
  theme.value = value;

  if (typeof window === 'undefined') {
    return;
  }

  applyThemeClass(value);
  window.localStorage.setItem(THEME_STORAGE_KEY, value);
};

const toggleTheme = () => {
  setTheme(theme.value === 'dark' ? 'light' : 'dark');
};

export const useTheme = () => {
  onMounted(() => {
    initializeTheme();
  });

  return {
    theme,
    isDark: computed(() => theme.value === 'dark'),
    toggleTheme,
    setTheme,
  };
};

