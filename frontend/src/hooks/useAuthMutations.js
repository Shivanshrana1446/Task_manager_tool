import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import {
  loginRequest,
  registerRequest,
  logoutRequest,
  forgotPasswordRequest,
  resetPasswordRequest,
} from '../services/authApi';
import { setCredentials, clearCredentials } from '../redux/slices/authSlice';

export const useLogin = () => {
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => dispatch(setCredentials(data)),
  });
};

export const useRegister = () => {
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: registerRequest,
    onSuccess: (data) => dispatch(setCredentials(data)),
  });
};

export const useLogout = () => {
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => dispatch(clearCredentials()),
  });
};

export const useForgotPassword = () => useMutation({ mutationFn: forgotPasswordRequest });

export const useResetPassword = () =>
  useMutation({
    mutationFn: ({ token, password, confirmPassword }) =>
      resetPasswordRequest(token, { password, confirmPassword }),
  });
