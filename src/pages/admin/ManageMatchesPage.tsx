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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

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
        <div className="mb-6 grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todos ({matches.length})
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
              filter === 'open'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Abertos ({matches.filter((m) => m.status === 'open').length})
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
              filter === 'locked'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Bloqueados ({matches.filter((m) => m.status === 'locked').length})
          </button>
          <button
            onClick={() => setFilter('finished')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
              filter === 'finished'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Finalizados ({matches.filter((m) => m.status === 'finished').length})
          </button>
        </div>

        {/* Matches List */}
        <div className="space-y-4">
          {filteredMatches.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">Nenhum jogo encontrado.</p>
            </div>
          ) : (
            filteredMatches.map((match) => {
              const matchDate = match.matchDate.toDate();
              return (
                <div key={match.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side: Match info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900">
                          Ceará vs {match.opponent}
                        </h3>
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
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        {matchDate.toLocaleDateString('pt-BR')} às {matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Apostas:</span>
                          <span className="font-medium text-gray-900">{match.totalBets}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Resultado:</span>
                          {match.actualScore ? (
                            <span className="font-medium text-gray-900">
                              {match.actualScore.ceara} x {match.actualScore.opponent}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Actions dropdown */}
                    <div className="relative flex-shrink-0">
                      <button
                        id={`dropdown-btn-${match.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === match.id ? null : match.id);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>

                      {openDropdown === match.id && (
                        <div className="fixed mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                          style={{
                            top: `${(document.getElementById(`dropdown-btn-${match.id}`)?.getBoundingClientRect().bottom || 0) + window.scrollY}px`,
                            right: `${window.innerWidth - (document.getElementById(`dropdown-btn-${match.id}`)?.getBoundingClientRect().right || 0)}px`
                          }}
                        >
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setEditingMatch(match);
                                setOpenDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              ✏️ Editar
                            </button>
                            <Link
                              to={`/admin/matches/${match.id}/bets`}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              onClick={() => setOpenDropdown(null)}
                            >
                              📊 Apostas
                            </Link>
                            <Link
                              to={`/admin/matches/${match.id}/results`}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              onClick={() => setOpenDropdown(null)}
                            >
                              ⚽ Resultado
                            </Link>
                            <button
                              onClick={() => {
                                setDeletingMatch(match);
                                setOpenDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                            >
                              🗑️ Deletar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
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
