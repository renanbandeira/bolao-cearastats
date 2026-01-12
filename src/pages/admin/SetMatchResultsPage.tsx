import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMatch } from '../../services/matchService';
import { setMatchResultsAndCalculatePoints } from '../../services/scoringService';
import type { Match } from '../../types';

export function SetMatchResultsPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    cearaScore: '',
    opponentScore: '',
    scorers: '',
    assists: '',
  });

  useEffect(() => {
    if (matchId) {
      loadMatch();
    }
  }, [matchId]);

  const loadMatch = async () => {
    if (!matchId) return;

    try {
      setLoading(true);
      const matchData = await getMatch(matchId);
      setMatch(matchData);

      // Pre-fill if results already exist
      if (matchData?.actualScore) {
        setFormData({
          cearaScore: matchData.actualScore.ceara.toString(),
          opponentScore: matchData.actualScore.opponent.toString(),
          scorers: matchData.actualScorers?.join(', ') || '',
          assists: matchData.actualAssists?.join(', ') || '',
        });
      }
    } catch (err) {
      console.error('Error loading match:', err);
      setError('Erro ao carregar jogo');
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

    // Parse scorers and assists
    const scorers = formData.scorers
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const assists = formData.assists
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      setSubmitting(true);

      await setMatchResultsAndCalculatePoints(matchId!, {
        actualScore: {
          ceara: cearaScore,
          opponent: opponentScore,
        },
        actualScorers: scorers,
        actualAssists: assists,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (err: any) {
      console.error('Error setting results:', err);
      setError(err.message || 'Erro ao definir resultados');
    } finally {
      setSubmitting(false);
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
          <Link to="/admin" className="text-blue-600 hover:underline">
            Voltar para admin
          </Link>
        </div>
      </div>
    );
  }

  const matchDate = match.matchDate.toDate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/admin" className="text-blue-600 hover:underline">
            ← Voltar para admin
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Definir Resultado do Jogo
          </h1>
          <p className="text-gray-600">
            <strong>Ceará vs {match.opponent}</strong>
          </p>
          <p className="text-sm text-gray-500">
            {matchDate.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          {match.totalBets > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {match.totalBets} {match.totalBets === 1 ? 'aposta' : 'apostas'} para este jogo
            </p>
          )}
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">
              ✓ Resultados definidos com sucesso!
            </h2>
            <p>Pontos calculados para todas as apostas. Redirecionando...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                  {error}
                </div>
              )}

              {match.actualScore && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Este jogo já tem resultados definidos. Ao salvar, os pontos serão
                    recalculados.
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Placar Final</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="cearaScore"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Gols do Ceará
                    </label>
                    <input
                      type="number"
                      id="cearaScore"
                      min="0"
                      value={formData.cearaScore}
                      onChange={(e) =>
                        setFormData({ ...formData, cearaScore: e.target.value })
                      }
                      className="w-full px-4 py-2 text-2xl text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="opponentScore"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Gols do {match.opponent}
                    </label>
                    <input
                      type="number"
                      id="opponentScore"
                      min="0"
                      value={formData.opponentScore}
                      onChange={(e) =>
                        setFormData({ ...formData, opponentScore: e.target.value })
                      }
                      className="w-full px-4 py-2 text-2xl text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Goleadores e Assistências
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="scorers"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Jogadores que marcaram
                    </label>
                    <input
                      type="text"
                      id="scorers"
                      value={formData.scorers}
                      onChange={(e) =>
                        setFormData({ ...formData, scorers: e.target.value })
                      }
                      placeholder="Ex: Saulo Mineiro, Erick Pulga, Richardson"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={submitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separe os nomes por vírgula. Deixe em branco se não houve gols.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="assists"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Jogadores que deram assistências
                    </label>
                    <input
                      type="text"
                      id="assists"
                      value={formData.assists}
                      onChange={(e) =>
                        setFormData({ ...formData, assists: e.target.value })
                      }
                      placeholder="Ex: Lourenço, Lucas Mugni"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={submitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separe os nomes por vírgula. Deixe em branco se não houve assistências.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {submitting ? 'Calculando pontos...' : 'Salvar e Calcular Pontos'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  disabled={submitting}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">ℹ️ Importante</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Os pontos serão calculados automaticamente para todas as apostas</li>
            <li>• O ranking será atualizado com os novos pontos</li>
            <li>• Os usuários verão os pontos detalhados em "Minhas Apostas"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
