import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRanking } from '../services/userService';
import { getAllSeasons, getActiveSeason } from '../services/seasonService';
import type { UserRanking } from '../types';

interface UserMedals {
  uid: string;
  username: string;
  photoURL: string;
  gold: number;
  silver: number;
  bronze: number;
  totalMedals: number;
}

export function RankingPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'current' | 'global'>('current');
  const [currentRanking, setCurrentRanking] = useState<UserRanking[]>([]);
  const [globalRanking, setGlobalRanking] = useState<UserMedals[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasActiveSeason, setHasActiveSeason] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Check if there's an active season
      const activeSeason = await getActiveSeason();
      setHasActiveSeason(!!activeSeason);

      // Load current season ranking
      const currentData = await getUserRanking();
      setCurrentRanking(currentData);

      // Load global ranking from all seasons
      const seasons = await getAllSeasons();
      const endedSeasons = seasons.filter(s => s.status === 'ended' && s.finalRankings);

      // Calculate medals for each user
      const medalsMap = new Map<string, UserMedals>();

      for (const season of endedSeasons) {
        if (!season.finalRankings) continue;

        for (const ranking of season.finalRankings) {
          if (!medalsMap.has(ranking.userId)) {
            medalsMap.set(ranking.userId, {
              uid: ranking.userId,
              username: ranking.username,
              photoURL: '', // Will be filled from current ranking
              gold: 0,
              silver: 0,
              bronze: 0,
              totalMedals: 0,
            });
          }

          const userMedals = medalsMap.get(ranking.userId)!;
          if (ranking.rank === 1) {
            userMedals.gold++;
            userMedals.totalMedals++;
          } else if (ranking.rank === 2) {
            userMedals.silver++;
            userMedals.totalMedals++;
          } else if (ranking.rank === 3) {
            userMedals.bronze++;
            userMedals.totalMedals++;
          }
        }
      }

      // Add photoURL from current ranking
      for (const user of currentData) {
        if (medalsMap.has(user.uid)) {
          medalsMap.get(user.uid)!.photoURL = user.photoURL || '';
        }
      }

      // Convert to array and sort by total medals (gold > silver > bronze)
      const globalData = Array.from(medalsMap.values())
        .filter(user => user.totalMedals > 0)
        .sort((a, b) => {
          if (b.gold !== a.gold) return b.gold - a.gold;
          if (b.silver !== a.silver) return b.silver - a.silver;
          return b.bronze - a.bronze;
        });

      setGlobalRanking(globalData);
    } catch (err) {
      console.error('Error loading ranking:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const currentUserRanking = currentRanking.find((user) => user.uid === currentUser?.uid);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Ranking</h1>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'current'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Temporada Atual
            </button>
            <button
              onClick={() => setActiveTab('global')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'global'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Ranking Global
            </button>
          </div>
        </div>

        {/* Current Season Tab */}
        {activeTab === 'current' && (
          <>
            {!hasActiveSeason ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                      Nenhuma temporada ativa
                    </h3>
                    <p className="text-sm text-yellow-800">
                      Não há uma temporada ativa no momento. Aguarde o administrador criar uma nova temporada para começar a fazer suas apostas.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {currentUserRanking && (
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <p className="text-blue-100 text-sm mb-1">Sua Posição</p>
                        <p className="text-3xl sm:text-4xl font-bold">#{currentUserRanking.rank}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-100 text-sm mb-1">Seus Pontos</p>
                        <p className="text-3xl sm:text-4xl font-bold">{currentUserRanking.totalPoints}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {hasActiveSeason && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posição
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pontos
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentRanking.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-600">
                            Nenhum usuário no ranking ainda.
                          </td>
                        </tr>
                      ) : (
                        currentRanking.map((user) => {
                        const isCurrentUser = user.uid === currentUser?.uid;
                        const isTopThree = user.rank <= 3;

                        let badgeColor = '';
                        let badge = '';

                        if (isTopThree) {
                          if (user.rank === 1) {
                            badgeColor = 'text-yellow-500';
                            badge = '🥇';
                          } else if (user.rank === 2) {
                            badgeColor = 'text-gray-400';
                            badge = '🥈';
                          } else if (user.rank === 3) {
                            badgeColor = 'text-orange-600';
                            badge = '🥉';
                          }
                        }

                        return (
                          <tr
                            key={user.uid}
                            className={`${
                              isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {badge && (
                                  <span className="text-xl sm:text-2xl">{badge}</span>
                                )}
                                <span className={`text-base sm:text-lg font-semibold ${badgeColor || 'text-gray-900'}`}>
                                  #{user.rank}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center">
                                {user.photoURL && (
                                  <img
                                    src={user.photoURL}
                                    alt={user.username}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-3 flex-shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {user.username}
                                    {isCurrentUser && (
                                      <span className="ml-2 text-xs text-blue-600 font-semibold">
                                        (Você)
                                      </span>
                                    )}
                                  </div>
                                  {user.isAdmin && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-base sm:text-lg font-bold text-gray-900">
                                {user.totalPoints}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {hasActiveSeason && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">ℹ️ Como funciona a pontuação?</h3>
                <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                  <li>• <strong>Placar exato (compartilhado):</strong> 2 pontos</li>
                  <li>• <strong>Placar exato (único):</strong> 4 pontos</li>
                  <li>• <strong>Resultado correto (vitória/empate):</strong> 1 ponto</li>
                  <li>• <strong>Jogador marcou gol (compartilhado):</strong> 2 pontos</li>
                  <li>• <strong>Jogador marcou gol (único):</strong> 4 pontos</li>
                  <li>• <strong>Jogador deu assistência (compartilhado):</strong> 1 ponto</li>
                  <li>• <strong>Jogador deu assistência (único):</strong> 2 pontos</li>
                </ul>
                <p className="text-xs sm:text-sm text-blue-800 mt-2">
                  💡 <em>"Único"</em> significa que você foi o único usuário a fazer aquela previsão!
                </p>
              </div>
            )}
          </>
        )}

        {/* Global Ranking Tab */}
        {activeTab === 'global' && (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posição
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medalhas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {globalRanking.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-600">
                          Nenhuma temporada finalizada ainda.
                        </td>
                      </tr>
                    ) : (
                      globalRanking.map((user, index) => {
                        const isCurrentUser = user.uid === currentUser?.uid;

                        return (
                          <tr
                            key={user.uid}
                            className={`${
                              isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <span className="text-base sm:text-lg font-semibold text-gray-900">
                                #{index + 1}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center">
                                {user.photoURL && (
                                  <img
                                    src={user.photoURL}
                                    alt={user.username}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-3 flex-shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {user.username}
                                    {isCurrentUser && (
                                      <span className="ml-2 text-xs text-blue-600 font-semibold">
                                        (Você)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center justify-center gap-3 flex-wrap">
                                {user.gold > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xl sm:text-2xl">🥇</span>
                                    <span className="text-sm sm:text-base font-semibold text-yellow-600">
                                      {user.gold}
                                    </span>
                                  </div>
                                )}
                                {user.silver > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xl sm:text-2xl">🥈</span>
                                    <span className="text-sm sm:text-base font-semibold text-gray-500">
                                      {user.silver}
                                    </span>
                                  </div>
                                )}
                                {user.bronze > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xl sm:text-2xl">🥉</span>
                                    <span className="text-sm sm:text-base font-semibold text-orange-600">
                                      {user.bronze}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2 text-sm sm:text-base">🏆 Ranking Global</h3>
              <p className="text-xs sm:text-sm text-green-800">
                O ranking global mostra os campeões históricos do bolão. As medalhas representam:
              </p>
              <ul className="text-xs sm:text-sm text-green-800 mt-2 space-y-1">
                <li>• <span className="text-lg">🥇</span> <strong>Ouro:</strong> 1º lugar em uma temporada</li>
                <li>• <span className="text-lg">🥈</span> <strong>Prata:</strong> 2º lugar em uma temporada</li>
                <li>• <span className="text-lg">🥉</span> <strong>Bronze:</strong> 3º lugar em uma temporada</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
