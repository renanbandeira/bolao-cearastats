import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMatch } from '../../services/matchService';

export function CreateMatchPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    opponent: '',
    matchDate: '',
    matchTime: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.opponent.trim()) {
      setError('Nome do adversário é obrigatório');
      return;
    }

    if (!formData.matchDate || !formData.matchTime) {
      setError('Data e hora do jogo são obrigatórias');
      return;
    }

    try {
      setLoading(true);

      // Combine date and time into a Date object
      const dateTimeString = `${formData.matchDate}T${formData.matchTime}`;
      const matchDate = new Date(dateTimeString);

      // Check if date is in the future
      if (matchDate <= new Date()) {
        setError('A data do jogo deve ser no futuro');
        setLoading(false);
        return;
      }

      await createMatch({
        opponent: formData.opponent.trim(),
        matchDate,
      });

      // Redirect to admin dashboard
      navigate('/admin', { replace: true });
    } catch (err) {
      console.error('Error creating match:', err);
      setError('Erro ao criar jogo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Criar Novo Jogo</h1>
          <p className="text-gray-600 mt-2">
            Configure um novo jogo para os usuários apostarem
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="opponent"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Adversário
              </label>
              <input
                type="text"
                id="opponent"
                value={formData.opponent}
                onChange={(e) =>
                  setFormData({ ...formData, opponent: e.target.value })
                }
                placeholder="Ex: Fortaleza, Sport, Bahia..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="matchDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Data do Jogo
                </label>
                <input
                  type="date"
                  id="matchDate"
                  value={formData.matchDate}
                  onChange={(e) =>
                    setFormData({ ...formData, matchDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="matchTime"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Hora do Jogo
                </label>
                <input
                  type="time"
                  id="matchTime"
                  value={formData.matchTime}
                  onChange={(e) =>
                    setFormData({ ...formData, matchTime: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Criando...' : 'Criar Jogo'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">ℹ️ Informações</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• O jogo será criado com status "aberto" para apostas</li>
            <li>• Usuários poderão apostar até o horário do jogo</li>
            <li>• Após o jogo, você poderá definir o resultado final</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
