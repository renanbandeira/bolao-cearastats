import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatch } from '../../services/matchService';
import { getMatchBets, adminUpdateBet } from '../../services/betService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Match, Bet } from '../../types';

interface UserInfo {
  uid: string;
  username: string;
  photoURL?: string;
}

interface BetWithUser extends Bet {
  username: string;
  photoURL?: string;
}

export function ManageMatchBetsPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [bets, setBets] = useState<BetWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBet, setEditingBet] = useState<BetWithUser | null>(null);
  const [formData, setFormData] = useState({
    cearaScore: 0,
    opponentScore: 0,
    predictedPlayer: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (matchId) {
      loadData();
    }
  }, [matchId]);

  const loadData = async () => {
    if (!matchId) return;

    try {
      setLoading(true);
      setError(null);

      // Load match
      const matchData = await getMatch(matchId);
      if (!matchData) {
        setError('Jogo não encontrado');
        return;
      }
      setMatch(matchData);

      // Load bets
      const betsData = await getMatchBets(matchId);

      // Load all users to get their info
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersMap = new Map<string, UserInfo>();
      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        usersMap.set(doc.id, {
          uid: doc.id,
          username: data.username,
          photoURL: data.photoURL,
        });
      });

      // Combine bets with user info
      const betsWithUsers: BetWithUser[] = betsData.map((bet) => {
        const user = usersMap.get(bet.userId);
        return {
          ...bet,
          username: user?.username || 'Usuário desconhecido',
          photoURL: user?.photoURL,
        };
      });

      setBets(betsWithUsers);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (bet: BetWithUser) => {
    setEditingBet(bet);
    setFormData({
      cearaScore: bet.predictedScore.ceara,
      opponentScore: bet.predictedScore.opponent,
      predictedPlayer: bet.predictedPlayer || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingBet(null);
    setFormData({
      cearaScore: 0,
      opponentScore: 0,
      predictedPlayer: '',
    });
  };

  const handleUpdateBet = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBet) return;

    setError(null);
    setSaving(true);

    try {
      await adminUpdateBet(editingBet.id, {
        predictedScore: {
          ceara: formData.cearaScore,
          opponent: formData.opponentScore,
        },
        predictedPlayer: formData.predictedPlayer.trim() || null,
      });

      await loadData();
      setEditingBet(null);
      setFormData({
        cearaScore: 0,
        opponentScore: 0,
        predictedPlayer: '',
      });
    } catch (err: any) {
      console.error('Error updating bet:', err);
      setError(err.message || 'Erro ao atualizar aposta');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Jogo não encontrado</p>
          <Link
            to="/admin/matches"
            className="text-blue-600 hover:text-blue-800"
          >
            Voltar para gerenciar jogos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/admin/matches"
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
          >
            ← Voltar para gerenciar jogos
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Gerenciar Apostas
          </h1>
          <p className="text-gray-600 mt-2">
            Ceará vs {match.opponent} -{' '}
            {match.matchDate.toDate().toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <div className="mt-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                match.status === 'open'
                  ? 'bg-green-100 text-green-800'
                  : match.status === 'locked'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {match.status === 'open'
                ? 'Aberto'
                : match.status === 'locked'
                ? 'Trancado'
                : 'Finalizado'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            {error}
          </div>
        )}

        {match.status !== 'open' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Este jogo não está aberto para apostas. Você ainda pode editar
              as apostas dos usuários, mas eles não podem mais alterar suas
              próprias apostas.
            </p>
          </div>
        )}

        {/* Bets Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Apostas ({bets.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placar Previsto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jogador Previsto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pontos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                      Nenhuma aposta ainda
                    </td>
                  </tr>
                ) : (
                  bets.map((bet) => (
                    <tr key={bet.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {bet.photoURL && (
                            <img
                              src={bet.photoURL}
                              alt={bet.username}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {bet.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-gray-900">
                          {bet.predictedScore.ceara} x{' '}
                          {bet.predictedScore.opponent}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {bet.predictedPlayer || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {bet.pointsEarned !== undefined ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {bet.pointsEarned} pts
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditClick(bet)}
                          className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {editingBet && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelEdit();
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Editar Aposta - {editingBet.username}
              </h3>

              <form onSubmit={handleUpdateBet} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placar Previsto
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">
                        Ceará
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.cearaScore}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cearaScore: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-bold"
                        required
                      />
                    </div>
                    <span className="text-2xl font-bold text-gray-400 pt-6">
                      x
                    </span>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">
                        {match.opponent}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.opponentScore}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            opponentScore: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-bold"
                        required
                      />
                    </div>
                  </div>
                  {formData.cearaScore < formData.opponentScore && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Só é permitido apostar em vitória ou empate do Ceará
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="predictedPlayer"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Jogador Previsto (opcional)
                  </label>
                  <input
                    type="text"
                    id="predictedPlayer"
                    value={formData.predictedPlayer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        predictedPlayer: e.target.value,
                      })
                    }
                    placeholder="Nome do jogador"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Ex: Saulo Mineiro, Aylon, Erick Pulga...
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      saving || formData.cearaScore < formData.opponentScore
                    }
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
