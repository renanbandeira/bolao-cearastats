import { Link } from 'react-router-dom';
import type { Match } from '../../types';

interface MatchCardProps {
  match: Match;
  userHasBet?: boolean;
}

export function MatchCard({ match, userHasBet }: MatchCardProps) {
  const matchDate = match.matchDate.toDate();
  const now = new Date();
  const isUpcoming = matchDate > now;
  const isPast = matchDate <= now;

  console.log('MatchCard - Match ID:', match.id, 'Full match:', match);

  const getStatusBadge = () => {
    if (match.status === 'finished') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Encerrado
        </span>
      );
    }
    if (match.status === 'locked' || isPast) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Apostas Fechadas
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Apostas Abertas
      </span>
    );
  };

  return (
    <Link
      to={`/matches/${match.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            Ceará vs {match.opponent}
          </h3>
          <p className="text-sm text-gray-600">
            {matchDate.toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            às {matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {match.actualScore && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Resultado Final</p>
          <p className="text-2xl font-bold text-gray-900">
            {match.actualScore.ceara} x {match.actualScore.opponent}
          </p>
          {match.actualScorers && match.actualScorers.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Gols: {match.actualScorers.join(', ')}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {match.totalBets} {match.totalBets === 1 ? 'aposta' : 'apostas'}
        </span>
        {userHasBet ? (
          <span className="text-green-600 font-medium">✓ Você apostou</span>
        ) : isUpcoming && match.status === 'open' ? (
          <span className="text-blue-600 font-medium">Fazer aposta →</span>
        ) : (
          <span className="text-gray-400">Ver detalhes →</span>
        )}
      </div>
    </Link>
  );
}
