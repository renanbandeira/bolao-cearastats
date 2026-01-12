import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserBets } from '../services/betService';
import { getMatch } from '../services/matchService';
import { BetEditModal } from '../components/bets/BetEditModal';
import type { Bet, Match } from '../types';

interface BetWithMatch extends Bet {
  match: Match | null;
}

export function MyBetsPage() {
  const { currentUser } = useAuth();
  const [bets, setBets] = useState<BetWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBet, setEditingBet] = useState<BetWithMatch | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadBets();
    }
  }, [currentUser]);

  const loadBets = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const userBets = await getUserBets(currentUser.uid);

      // Load match data for each bet
      const betsWithMatches = await Promise.all(
        userBets.map(async (bet) => {
          const match = await getMatch(bet.matchId);
          return { ...bet, match };
        })
      );

      setBets(betsWithMatches);
    } catch (err) {
      console.error('Error loading bets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = () => {
    loadBets();
    setEditingBet(null);
  };

  const canEditBet = (match: Match): boolean => {
    const matchDate = match.matchDate.toDate();
    const now = new Date();
    return match.status === 'open' && matchDate > now;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Minhas Apostas</h1>

        {bets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 mb-4">Você ainda não fez nenhuma aposta.</p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Ver Jogos Disponíveis
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bets.map((bet) => {
              if (!bet.match) return null;

              const matchDate = bet.match.matchDate.toDate();
              const hasResult = bet.match.actualScore !== undefined;

              return (
                <div key={bet.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link
                        to={`/matches/${bet.matchId}`}
                        className="text-xl font-bold text-gray-900 hover:text-blue-600"
                      >
                        Ceará vs {bet.match.opponent}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        {matchDate.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {canEditBet(bet.match) && (
                        <button
                          onClick={() => setEditingBet(bet)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Editar
                        </button>
                      )}
                      {bet.pointsEarned !== undefined && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Pontos</p>
                          <p className="text-3xl font-bold text-green-600">
                            {bet.pointsEarned}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Predicted */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Sua Previsão
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {bet.predictedScore.ceara} x {bet.predictedScore.opponent}
                      </p>
                      {bet.predictedPlayer && (
                        <p className="text-sm text-blue-800 mt-2">
                          Jogador: <strong>{bet.predictedPlayer}</strong>
                        </p>
                      )}
                    </div>

                    {/* Actual Result */}
                    {hasResult ? (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Resultado Real
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {bet.match.actualScore!.ceara} x{' '}
                          {bet.match.actualScore!.opponent}
                        </p>
                        {bet.match.actualScorers && bet.match.actualScorers.length > 0 && (
                          <p className="text-sm text-gray-700 mt-2">
                            Gols: {bet.match.actualScorers.join(', ')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-sm text-gray-600">
                          Aguardando resultado
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Points Breakdown */}
                  {bet.breakdown && Object.keys(bet.breakdown).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Detalhamento de Pontos
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {bet.breakdown.exactScore && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Placar exato:</span>
                            <span className="font-medium text-green-600">
                              +{bet.breakdown.exactScore}
                            </span>
                          </div>
                        )}
                        {bet.breakdown.exactScoreAlone && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Placar exato (único):</span>
                            <span className="font-medium text-green-600">
                              +{bet.breakdown.exactScoreAlone}
                            </span>
                          </div>
                        )}
                        {bet.breakdown.winOrDraw && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Resultado correto:</span>
                            <span className="font-medium text-green-600">
                              +{bet.breakdown.winOrDraw}
                            </span>
                          </div>
                        )}
                        {bet.breakdown.matchedScorer && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Jogador marcou:</span>
                            <span className="font-medium text-green-600">
                              +{bet.breakdown.matchedScorer}
                            </span>
                          </div>
                        )}
                        {bet.breakdown.matchedScorerAlone && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Jogador marcou (único):</span>
                            <span className="font-medium text-green-600">
                              +{bet.breakdown.matchedScorerAlone}
                            </span>
                          </div>
                        )}
                        {bet.breakdown.matchedAssist && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Jogador assistiu:</span>
                            <span className="font-medium text-green-600">
                              +{bet.breakdown.matchedAssist}
                            </span>
                          </div>
                        )}
                        {bet.breakdown.matchedAssistAlone && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Jogador assistiu (único):</span>
                            <span className="font-medium text-green-600">
                              +{bet.breakdown.matchedAssistAlone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Modal */}
        {editingBet && editingBet.match && (
          <BetEditModal
            bet={editingBet}
            match={editingBet.match}
            isOpen={true}
            onClose={() => setEditingBet(null)}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </div>
  );
}
