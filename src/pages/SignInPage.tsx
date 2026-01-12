import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SignInButton } from '../components/auth/SignInButton';

export function SignInPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Bolão CearaStats
            </h1>
            <p className="text-gray-600">
              Faça suas apostas e compete com outros torcedores do Ceará!
            </p>
          </div>

          <div className="mb-6">
            <SignInButton />
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>
              Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
