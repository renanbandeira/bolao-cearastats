import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMatch } from '../services/matchService';
import { placeBet, updateBet, getUserBetForMatch, getMatchBetStatistics } from '../services/betService';
import type { Match, Bet } from '../types';

export function MatchDetailsPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();

  const [match, setMatch] = useState<Match | null>(null);
  const [userBet, setUserBet] = useState<Bet | null>(null);
  const [statistics, setStatistics] = useState<{
    totalBets: number;
    mostBetScore: { ceara: number; opponent: number; count: number } | null;
    topPredictedPlayers: Array<{ player: string; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    cearaScore: '',
    opponentScore: '',
    predictedPlayer: '',
  });

  useEffect(() => {
    if (!matchId || !currentUser) {
      setLoading(false);
      return;
    }

    loadMatchData();
  }, [matchId, currentUser]);

  const loadMatchData = async () => {
    if (!matchId || !currentUser) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Loading match with ID:', matchId);

      const [matchData, betData, stats] = await Promise.all([
        getMatch(matchId),
        getUserBetForMatch(currentUser.uid, matchId),
        getMatchBetStatistics(matchId),
      ]);

      console.log('Match data loaded:', matchData);

      if (!matchData) {
        setError(`Jogo não encontrado (ID: ${matchId})`);
      }

      setMatch(matchData);
      setUserBet(betData);
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading match:', err);
      setError(`Erro ao carregar jogo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cearaScore = parseInt(formData.cearaScore);
    const opponentScore = parseInt(formData.opponentScore);

    if (isNaN(cearaScore) || isNaN(opponentScore)) {
      setError('Por favor, insira placares válidos');
      return;
    }

    if (cearaScore < 0 || opponentScore < 0) {
      setError('Placares não podem ser negativos');
      return;
    }

    if (cearaScore < opponentScore) {
      setError('Você só pode apostar em vitória ou empate do Ceará!');
      return;
    }

    try {
      setSubmitting(true);

      if (isEditing && userBet) {
        // Update existing bet
        await updateBet(userBet.id, {
          matchId: matchId!,
          predictedScore: {
            ceara: cearaScore,
            opponent: opponentScore,
          },
          predictedPlayer: formData.predictedPlayer.trim() || undefined,
        });
      } else {
        // Create new bet
        await placeBet({
          matchId: matchId!,
          predictedScore: {
            ceara: cearaScore,
            opponent: opponentScore,
          },
          predictedPlayer: formData.predictedPlayer.trim() || undefined,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || (isEditing ? 'Erro ao editar aposta' : 'Erro ao fazer aposta'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = () => {
    if (userBet) {
      setFormData({
        cearaScore: userBet.predictedScore.ceara.toString(),
        opponentScore: userBet.predictedScore.opponent.toString(),
        predictedPlayer: userBet.predictedPlayer || '',
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      cearaScore: '',
      opponentScore: '',
      predictedPlayer: '',
    });
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!match && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Jogo não encontrado</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
              {error}
            </div>
          )}
          {!error && matchId && (
            <p className="text-gray-600 mb-4">
              O jogo com ID "{matchId}" não foi encontrado no sistema.
            </p>
          )}
          {!matchId && (
            <p className="text-gray-600 mb-4">
              Nenhum ID de jogo foi fornecido.
            </p>
          )}
          <Link to="/" className="text-blue-600 hover:underline">
            ← Voltar para home
          </Link>
        </div>
      </div>
    );
  }

  // TypeScript type narrowing: after this point, match is guaranteed to be non-null
  if (!match) {
    return null;
  }

  const matchDate = match.matchDate.toDate();
  const now = new Date();
  const isMatchOpen = match.status === 'open' && matchDate > now;
  const canBet = isMatchOpen && !userBet;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/" className="text-blue-600 hover:underline">
            ← Voltar para jogos
          </Link>
        </div>

        {/* Match Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Ceará vs {match.opponent}
          </h1>
          <p className="text-gray-600 mb-2">
            {matchDate.toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            às {matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>

          {match.actualScore && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Resultado Final</p>
              <p className="text-3xl font-bold text-gray-900">
                {match.actualScore.ceara} x {match.actualScore.opponent}
              </p>
              {match.actualScorers && match.actualScorers.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Gols:</p>
                  <p className="text-sm text-gray-600">{match.actualScorers.join(', ')}</p>
                </div>
              )}
              {match.actualAssists && match.actualAssists.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Assistências:</p>
                  <p className="text-sm text-gray-600">{match.actualAssists.join(', ')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User's Bet or Bet Form */}
        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">✓ Aposta {isEditing ? 'editada' : 'realizada'} com sucesso!</h2>
            <p>Redirecionando...</p>
          </div>
        ) : userBet && !isEditing ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Sua Aposta</h2>
              {isMatchOpen && (
                <button
                  onClick={handleEditClick}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Editar Aposta
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Placar previsto:</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userBet.predictedScore.ceara} x {userBet.predictedScore.opponent}
                </p>
              </div>
              {userBet.predictedPlayer && (
                <div>
                  <p className="text-sm text-gray-600">Jogador previsto:</p>
                  <p className="text-lg font-medium text-gray-900">{userBet.predictedPlayer}</p>
                </div>
              )}
              {userBet.pointsEarned !== undefined && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Pontos ganhos:</p>
                  <p className="text-3xl font-bold text-green-600">{userBet.pointsEarned}</p>
                </div>
              )}
            </div>
          </div>
        ) : (canBet || isEditing) ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{isEditing ? 'Editar Aposta' : 'Fazer Aposta'}</h2>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                  {error}
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Importante:</strong> Você só pode apostar em vitória ou empate do
                  Ceará!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cearaScore" className="block text-sm font-medium text-gray-700 mb-2">
                    Gols do Ceará
                  </label>
                  <input
                    type="number"
                    id="cearaScore"
                    min="0"
                    value={formData.cearaScore}
                    onChange={(e) => setFormData({ ...formData, cearaScore: e.target.value })}
                    className="w-full px-4 py-2 text-2xl text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label htmlFor="opponentScore" className="block text-sm font-medium text-gray-700 mb-2">
                    Gols do {match.opponent}
                  </label>
                  <input
                    type="number"
                    id="opponentScore"
                    min="0"
                    value={formData.opponentScore}
                    onChange={(e) => setFormData({ ...formData, opponentScore: e.target.value })}
                    className="w-full px-4 py-2 text-2xl text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="predictedPlayer" className="block text-sm font-medium text-gray-700 mb-2">
                  Jogador Destaque (opcional)
                </label>
                <input
                  type="text"
                  id="predictedPlayer"
                  value={formData.predictedPlayer}
                  onChange={(e) => setFormData({ ...formData, predictedPlayer: e.target.value })}
                  placeholder="Nome do jogador que pode marcar ou dar assistência"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este jogador pode ganhar pontos tanto por gols quanto por assistências!
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
              >
                {submitting ? 'Enviando...' : (isEditing ? 'Salvar Alterações' : 'Confirmar Aposta')}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-600 text-center">
              {matchDate <= now
                ? 'Este jogo já começou. Apostas não são mais permitidas.'
                : 'As apostas para este jogo estão fechadas.'}
            </p>
          </div>
        )}

        {/* Admin Link */}
        {isAdmin && match.status !== 'finished' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">
              Administrador:{' '}
              <Link
                to={`/admin/matches/${match.id}/results`}
                className="underline hover:text-blue-900 font-medium"
              >
                Definir resultado do jogo
              </Link>
            </p>
          </div>
        )}

        {/* Statistics */}
        {statistics && statistics.totalBets > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Estatísticas das Apostas</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total de apostas:</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalBets}</p>
              </div>

              {statistics.mostBetScore && (
                <div>
                  <p className="text-sm text-gray-600">Placar mais apostado:</p>
                  <p className="text-xl font-bold text-gray-900">
                    {statistics.mostBetScore.ceara} x {statistics.mostBetScore.opponent}
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      ({statistics.mostBetScore.count}{' '}
                      {statistics.mostBetScore.count === 1 ? 'pessoa' : 'pessoas'})
                    </span>
                  </p>
                </div>
              )}

              {statistics.topPredictedPlayers.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Jogadores mais apostados:</p>
                  <div className="space-y-1">
                    {statistics.topPredictedPlayers.map((player, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">{player.player}</span>
                        <span className="text-gray-600">
                          {player.count} {player.count === 1 ? 'aposta' : 'apostas'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
