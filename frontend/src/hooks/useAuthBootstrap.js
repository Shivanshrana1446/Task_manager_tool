import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { refreshTokenRequest } from '../services/authApi';
import { setCredentials, clearCredentials } from '../redux/slices/authSlice';

export const useAuthBootstrap = () => {
  const dispatch = useDispatch();

  const { data, error, isFetched } = useQuery({
    queryKey: ['auth', 'bootstrap'],
    queryFn: refreshTokenRequest,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!isFetched) return;

    if (data) {
      dispatch(setCredentials(data));
    } else if (error) {
      dispatch(clearCredentials());
    }
  }, [isFetched, data, error, dispatch]);

  return { isFetched };
};
