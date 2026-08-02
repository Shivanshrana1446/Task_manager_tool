import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../redux/slices/themeSlice';

export const useTheme = () => {
  const mode = useSelector((state) => state.theme.mode);
  const dispatch = useDispatch();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  return { mode, toggle: () => dispatch(toggleTheme()) };
};
