import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Dashboard from './Dashboard';

const Home = () => {
  const user = useSelector((state) => state.auth.user);

  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="text-3xl font-bold">Project & Task Management System</h1>
      <p className="mt-2 text-foreground/70">Sign in to manage your projects and tasks.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/login">
          <Button className="w-auto px-5">Sign in</Button>
        </Link>
        <Link to="/register">
          <Button variant="secondary" className="w-auto px-5">
            Create account
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
