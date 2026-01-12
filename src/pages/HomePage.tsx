import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMatches } from '../hooks/useMatches';
import { getUserBets } from '../services/betService';
import { MatchCard } from '../components/matches/MatchCard';

export function HomePage() {
  const { userProfile, isAdmin, currentUser } = useAuth();
  const { matches, loading } = useMatches('upcoming');
  const [userBetMatchIds, setUserBetMatchIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentUser) {
      // Load user's bets to show which matches they've bet on
      getUserBets(currentUser.uid).then((bets) => {
        const matchIds = new Set(bets.map((bet) => bet.matchId));
        setUserBetMatchIds(matchIds);
      });
    }
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo, {userProfile?.username}!
          </h1>
          <p className="text-gray-600 mt-2">
            Confira os próximos jogos do Ceará e faça suas apostas
          </p>
        </div>

        {isAdmin && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">
              Você é um administrador.{' '}
              <Link to="/admin" className="underline hover:text-blue-900">
                Acessar painel administrativo
              </Link>
            </p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Próximos Jogos
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-center">
                Nenhum jogo disponível no momento. Aguarde a criação de novos jogos!
              </p>
              {isAdmin && (
                <div className="mt-4 text-center">
                  <Link
                    to="/admin/create-match"
                    className="inline-block bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Criar Primeiro Jogo
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  userHasBet={userBetMatchIds.has(match.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
