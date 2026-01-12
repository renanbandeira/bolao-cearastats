import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { userProfile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Bolão CearaStats
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`font-medium transition-colors ${
                isActive('/') ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Jogos
            </Link>
            <Link
              to="/ranking"
              className={`font-medium transition-colors ${
                isActive('/ranking') ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Ranking
            </Link>
            <Link
              to="/my-bets"
              className={`font-medium transition-colors ${
                isActive('/my-bets') ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Minhas Apostas
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`font-medium transition-colors ${
                  location.pathname.startsWith('/admin') ? 'text-blue-600' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Desktop User Info */}
          <div className="hidden md:flex items-center gap-4">
            {userProfile && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-medium text-gray-900">
                    {userProfile.username}
                  </p>
                  <p className="text-xs text-gray-600">
                    {userProfile.totalPoints} pontos
                  </p>
                </div>
                {userProfile.photoURL && (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.username}
                    className="w-10 h-10 rounded-full border-2 border-gray-200"
                  />
                )}
                <button
                  onClick={handleSignOut}
                  className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  Sair
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-gray-900"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            {/* Mobile User Info */}
            {userProfile && (
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-200">
                {userProfile.photoURL && (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.username}
                    className="w-10 h-10 rounded-full border-2 border-gray-200"
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {userProfile.username}
                  </p>
                  <p className="text-xs text-gray-600">
                    {userProfile.totalPoints} pontos
                  </p>
                </div>
              </div>
            )}

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col gap-3">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Jogos
              </Link>
              <Link
                to="/ranking"
                onClick={closeMobileMenu}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/ranking') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Ranking
              </Link>
              <Link
                to="/my-bets"
                onClick={closeMobileMenu}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/my-bets') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Minhas Apostas
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={closeMobileMenu}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    location.pathname.startsWith('/admin') ? 'bg-blue-50 text-blue-600' : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => {
                  handleSignOut();
                  closeMobileMenu();
                }}
                className="px-3 py-2 text-left rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors"
              >
                Sair
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
