import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Timeout to show error if loading takes too long
    const timeout = setTimeout(() => {
      if (loading) {
        setShowError(true);
      }
    }, 8000);

    if (!loading) {
      clearTimeout(timeout);
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
    }

    return () => clearTimeout(timeout);
  }, [user, loading, navigate]);

  if (showError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-foreground">Loading is taking longer than expected...</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  );
};

export default Index;