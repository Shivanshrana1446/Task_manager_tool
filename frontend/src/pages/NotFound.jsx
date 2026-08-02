import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-foreground/70">Page not found.</p>
      <Link to="/" className="mt-4 inline-block text-primary-600 hover:underline">
        Back home
      </Link>
    </div>
  );
};

export default NotFound;
