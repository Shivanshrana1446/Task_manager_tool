import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PublicOnlyRoute = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;
