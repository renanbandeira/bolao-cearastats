import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { createSeason, getAllSeasons, endSeason, deleteSeason } from '../../services/seasonService';
import { getUserRanking } from '../../services/userService';
import type { Season } from '../../types';

export function ManageSeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
  });
  const [endingSeasonId, setEndingSeasonId] = useState<string | null>(null);
  const [deletingSeason, setDeletingSeason] = useState<Season | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    try {
      setLoading(true);
      const data = await getAllSeasons();
      setSeasons(data);
    } catch (err) {
      console.error('Error loading seasons:', err);
      setError('Erro ao carregar temporadas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeason = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Nome da temporada é obrigatório');
      return;
    }

    if (!formData.startDate) {
      setError('Data de início é obrigatória');
      return;
    }

    try {
      await createSeason({
        name: formData.name.trim(),
        startDate: new Date(formData.startDate),
      });

      setFormData({ name: '', startDate: '' });
      setShowCreateForm(false);
      await loadSeasons();
    } catch (err: any) {
      console.error('Error creating season:', err);
      setError(err.message || 'Erro ao criar temporada');
    }
  };

  const handleEndSeason = async (seasonId: string) => {
    if (!confirm('Tem certeza que deseja encerrar esta temporada? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setEndingSeasonId(seasonId);

      // Get current ranking
      const ranking = await getUserRanking();

      // Convert UserRanking to FinalRanking
      const finalRankings = ranking.map((user) => ({
        userId: user.uid,
        username: user.username,
        totalPoints: user.totalPoints,
        rank: user.rank,
      }));

      // End season with final rankings
      await endSeason(seasonId, finalRankings);

      await loadSeasons();
    } catch (err) {
      console.error('Error ending season:', err);
      setError('Erro ao encerrar temporada');
    } finally {
      setEndingSeasonId(null);
    }
  };

  const handleDeleteSeason = async (seasonId: string) => {
    try {
      setIsDeleting(true);
      setError(null);
      await deleteSeason(seasonId);
      await loadSeasons();
      setDeletingSeason(null);
    } catch (err) {
      console.error('Error deleting season:', err);
      setError('Erro ao deletar temporada');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const activeSeason = seasons.find((s) => s.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Temporadas</h1>
          <p className="text-gray-600 mt-2">
            Crie e encerre temporadas do bolão
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            {error}
          </div>
        )}

        {/* Create Season Button/Form */}
        <div className="mb-6">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={!!activeSeason}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {activeSeason ? 'Já existe uma temporada ativa' : 'Criar Nova Temporada'}
            </button>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Nova Temporada
              </h2>
              <form onSubmit={handleCreateSeason} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nome da Temporada
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Temporada 2026, Copa do Nordeste 2026..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Data de Início
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Criar Temporada
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ name: '', startDate: '' });
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Seasons List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Temporadas
            </h2>

            {seasons.length === 0 ? (
              <p className="text-gray-600">Nenhuma temporada criada ainda.</p>
            ) : (
              <div className="space-y-4">
                {seasons.map((season) => (
                  <div
                    key={season.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {season.name}
                          </h3>
                          {season.status === 'active' && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              Ativa
                            </span>
                          )}
                          {season.status === 'ended' && (
                            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              Encerrada
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Início: {season.startDate.toDate().toLocaleDateString('pt-BR')}
                          {season.endDate && (
                            <> • Fim: {season.endDate.toDate().toLocaleDateString('pt-BR')}</>
                          )}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {season.status === 'active' && (
                          <button
                            onClick={() => handleEndSeason(season.id)}
                            disabled={endingSeasonId === season.id}
                            className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                          >
                            {endingSeasonId === season.id
                              ? 'Encerrando...'
                              : 'Encerrar Temporada'}
                          </button>
                        )}
                        {season.status === 'ended' && (
                          <button
                            onClick={() => setDeletingSeason(season)}
                            className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                          >
                            Deletar
                          </button>
                        )}
                      </div>
                    </div>

                    {season.finalRankings && season.finalRankings.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Ranking Final (Top 5)
                        </h4>
                        <div className="space-y-1">
                          {season.finalRankings.slice(0, 5).map((ranking) => (
                            <div
                              key={ranking.userId}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-700">
                                {ranking.rank}º {ranking.username}
                              </span>
                              <span className="font-medium text-gray-900">
                                {ranking.totalPoints} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deletingSeason && (
          <DeleteSeasonModal
            season={deletingSeason}
            onClose={() => setDeletingSeason(null)}
            onConfirm={() => handleDeleteSeason(deletingSeason.id)}
            isDeleting={isDeleting}
          />
        )}
      </div>
    </div>
  );
}

interface DeleteSeasonModalProps {
  season: Season;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

function DeleteSeasonModal({ season, onClose, onConfirm, isDeleting }: DeleteSeasonModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
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
              Deletar Temporada
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Tem certeza que deseja deletar a temporada <strong>{season.name}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                <strong>⚠️ Atenção:</strong> Esta ação não pode ser desfeita. Todos os jogos desta temporada serão deletados, todas as apostas serão removidas e os pontos dos usuários serão recalculados automaticamente.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
