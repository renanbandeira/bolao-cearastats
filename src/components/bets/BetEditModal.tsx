import { useState } from 'react';
import type { FormEvent } from 'react';
import { updateBet } from '../../services/betService';
import type { Bet, Match } from '../../types';

interface BetEditModalProps {
  bet: Bet;
  match: Match;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BetEditModal({ bet, match, isOpen, onClose, onSuccess }: BetEditModalProps) {
  const [formData, setFormData] = useState({
    cearaScore: bet.predictedScore.ceara.toString(),
    opponentScore: bet.predictedScore.opponent.toString(),
    predictedPlayer: bet.predictedPlayer || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
      await updateBet(bet.id, {
        matchId: bet.matchId,
        predictedScore: {
          ceara: cearaScore,
          opponent: opponentScore,
        },
        predictedPlayer: formData.predictedPlayer.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao editar aposta');
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Editar Aposta</h2>
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

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Ceará vs {match.opponent}
            </h3>
            <p className="text-sm text-gray-600">
              {match.matchDate.toDate().toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              às {match.matchDate.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                {error}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Importante:</strong> Você só pode apostar em vitória ou empate do Ceará!
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
                Este jogador pode ganhar pontos tanto por gols quanto por assistências! (Não importa maiúsculas/minúsculas)
              </p>
            </div>

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
