import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const NotFound = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-9xl font-bold text-white opacity-20">404</div>
          <h1 className="text-4xl font-bold text-white mb-4">Page Not Found</h1>
          <p className="text-xl text-blue-200 mb-8">
            The page you're looking for doesn't exist or may have been moved.
          </p>
          <div className="space-x-4">
            <Link
              to="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
            >
              Go Home
            </Link>
            <Link
              to="/contact"
              className="inline-block border border-blue-400 hover:bg-blue-400 hover:text-blue-900 text-blue-200 font-semibold py-3 px-6 rounded-lg transition duration-300"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
