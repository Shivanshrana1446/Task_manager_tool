import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { getMeRequest } from '../services/authApi';
import { setCredentials } from '../redux/slices/authSlice';

export const useCurrentUser = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMeRequest,
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data) {
      dispatch(setCredentials({ user: query.data, accessToken }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data]);

  return query;
};
