import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getAllMatches, updateMatch, deleteMatch } from '../../services/matchService';
import { recalculateMatchPoints } from '../../services/scoringService';
import type { Match, MatchStatus } from '../../types';

export function ManageMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<Match | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'locked' | 'finished'>('all');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const allMatches = await getAllMatches();
      setMatches(allMatches);
    } catch (err) {
      console.error('Error loading matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (matchId: string) => {
    try {
      setLoading(true);
      await deleteMatch(matchId);
      await loadMatches();
      setDeletingMatch(null);
    } catch (err) {
      console.error('Error deleting match:', err);
      alert('Erro ao deletar jogo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter((match) => {
    if (filter === 'all') return true;
    return match.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Jogos</h1>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todos ({matches.length})
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'open'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Abertos ({matches.filter((m) => m.status === 'open').length})
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'locked'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Bloqueados ({matches.filter((m) => m.status === 'locked').length})
          </button>
          <button
            onClick={() => setFilter('finished')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'finished'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Finalizados ({matches.filter((m) => m.status === 'finished').length})
          </button>
        </div>

        {/* Matches Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adversário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apostas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resultado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMatches.map((match) => {
                  const matchDate = match.matchDate.toDate();
                  return (
                    <tr key={match.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Ceará vs {match.opponent}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {matchDate.toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            match.status === 'open'
                              ? 'bg-green-100 text-green-800'
                              : match.status === 'locked'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {match.status === 'open'
                            ? 'Aberto'
                            : match.status === 'locked'
                            ? 'Bloqueado'
                            : 'Finalizado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {match.totalBets}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {match.actualScore ? (
                          <div className="text-sm text-gray-900">
                            {match.actualScore.ceara} x {match.actualScore.opponent}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setEditingMatch(match)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </button>
                          <Link
                            to={`/admin/matches/${match.id}/results`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Resultado
                          </Link>
                          <button
                            onClick={() => setDeletingMatch(match)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Deletar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredMatches.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum jogo encontrado.</p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingMatch && (
          <EditMatchModal
            match={editingMatch}
            onClose={() => setEditingMatch(null)}
            onSuccess={() => {
              loadMatches();
              setEditingMatch(null);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deletingMatch && (
          <DeleteConfirmModal
            match={deletingMatch}
            onClose={() => setDeletingMatch(null)}
            onConfirm={() => handleDelete(deletingMatch.id)}
          />
        )}
      </div>
    </div>
  );
}

interface EditMatchModalProps {
  match: Match;
  onClose: () => void;
  onSuccess: () => void;
}

function EditMatchModal({ match, onClose, onSuccess }: EditMatchModalProps) {
  const [formData, setFormData] = useState({
    opponent: match.opponent,
    matchDate: match.matchDate.toDate().toISOString().slice(0, 16),
    status: match.status as MatchStatus,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);

      const hasResults = match.actualScore !== undefined;
      const isChangingDetails =
        formData.opponent !== match.opponent ||
        new Date(formData.matchDate).getTime() !== match.matchDate.toDate().getTime();

      // Update match details
      await updateMatch(match.id, {
        opponent: formData.opponent,
        matchDate: new Date(formData.matchDate),
        status: formData.status as MatchStatus,
      });

      // If match has results and we're changing details, recalculate points
      if (hasResults && isChangingDetails) {
        await recalculateMatchPoints(match.id);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar jogo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const hasResults = match.actualScore !== undefined;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Editar Jogo</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={submitting}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {hasResults && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Atenção:</strong> Este jogo já possui resultados definidos. Se você alterar
                o adversário ou a data, os pontos de todas as apostas serão recalculados automaticamente.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="opponent" className="block text-sm font-medium text-gray-700 mb-2">
                Adversário
              </label>
              <input
                type="text"
                id="opponent"
                value={formData.opponent}
                onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="matchDate" className="block text-sm font-medium text-gray-700 mb-2">
                Data e Hora
              </label>
              <input
                type="datetime-local"
                id="matchDate"
                value={formData.matchDate}
                onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MatchStatus })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting}
              >
                <option value="open">Aberto</option>
                <option value="locked">Bloqueado</option>
                <option value="finished">Finalizado</option>
              </select>
            </div>

            {match.actualScore && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Resultado Atual</p>
                <p className="text-xl font-bold text-gray-900">
                  {match.actualScore.ceara} x {match.actualScore.opponent}
                </p>
                {match.actualScorers && match.actualScorers.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Gols: {match.actualScorers.join(', ')}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submitting ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  match: Match;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({ match, onClose, onConfirm }: DeleteConfirmModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Deletar Jogo
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Tem certeza que deseja deletar o jogo <strong>Ceará vs {match.opponent}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                <strong>⚠️ Atenção:</strong> Esta ação não pode ser desfeita. Todas as apostas deste jogo serão deletadas e os pontos dos usuários serão recalculados automaticamente.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
