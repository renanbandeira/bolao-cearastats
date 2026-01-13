import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { getAllUsers, toggleAdminStatus, updateUserUsername, updateUserPoints, deleteUser } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types';

export function ManageUsersPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState('');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [editingPointsUser, setEditingPointsUser] = useState<User | null>(null);
  const [editingPoints, setEditingPoints] = useState(0);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Tem certeza que deseja ${currentStatus ? 'remover' : 'conceder'} privilégios de administrador?`)) {
      return;
    }

    try {
      setSavingUserId(userId);
      await toggleAdminStatus(userId, !currentStatus);
      await loadUsers();
    } catch (err) {
      console.error('Error toggling admin status:', err);
      setError('Erro ao atualizar status de administrador');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleEditUsername = (user: User) => {
    setEditingUserId(user.uid);
    setEditingUsername(user.username);
  };

  const handleSaveUsername = async (userId: string) => {
    if (!editingUsername.trim()) {
      setError('Nome de usuário não pode estar vazio');
      return;
    }

    try {
      setSavingUserId(userId);
      await updateUserUsername(userId, editingUsername.trim());
      await loadUsers();
      setEditingUserId(null);
    } catch (err) {
      console.error('Error updating username:', err);
      setError('Erro ao atualizar nome de usuário');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingUsername('');
  };

  const handleEditPoints = (user: User) => {
    setEditingPointsUser(user);
    setEditingPoints(user.totalPoints);
  };

  const handleSavePoints = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPointsUser) return;

    try {
      setSavingUserId(editingPointsUser.uid);
      await updateUserPoints(editingPointsUser.uid, editingPoints);
      await loadUsers();
      setEditingPointsUser(null);
    } catch (err) {
      console.error('Error updating points:', err);
      setError('Erro ao atualizar pontos');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleCancelEditPoints = () => {
    setEditingPointsUser(null);
    setEditingPoints(0);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setIsDeleting(true);
      setError(null);
      await deleteUser(deletingUser.uid);
      await loadUsers();
      setDeletingUser(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Erro ao deletar usuário');
    } finally {
      setIsDeleting(false);
    }
  };

  const getFirstTwoNames = (fullName: string): string => {
    const names = fullName.trim().split(' ');
    return names.slice(0, 2).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-600 mt-2">
            Promover administradores e editar nomes de usuários
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.photoURL && (
                          <img
                            src={user.photoURL}
                            alt={user.username}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                        )}
                        <div>
                          {editingUserId === user.uid ? (
                            <input
                              type="text"
                              value={editingUsername}
                              onChange={(e) => setEditingUsername(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              disabled={savingUserId === user.uid}
                            />
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {getFirstTwoNames(user.username)}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {user.totalPoints} pts
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {user.uid === currentUser?.uid && (
                                  <span className="text-xs text-gray-500">(Você)</span>
                                )}
                                {user.isAdmin && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Admin
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                      {editingUserId === user.uid ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveUsername(user.uid)}
                            disabled={savingUserId === user.uid}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            ✓ Salvar
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={savingUserId === user.uid}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          >
                            ✕ Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === user.uid ? null : user.uid);
                            }}
                            disabled={savingUserId !== null}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                          >
                            <svg
                              className="w-5 h-5 text-gray-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>

                          {openDropdown === user.uid && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleEditUsername(user);
                                    setOpenDropdown(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  ✏️ Editar Nome
                                </button>
                                <button
                                  onClick={() => {
                                    handleEditPoints(user);
                                    setOpenDropdown(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  🎯 Editar Pontos
                                </button>
                                {user.uid !== currentUser?.uid && (
                                  <>
                                    <button
                                      onClick={() => {
                                        handleToggleAdmin(user.uid, user.isAdmin);
                                        setOpenDropdown(null);
                                      }}
                                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                        user.isAdmin
                                          ? 'text-red-600'
                                          : 'text-green-600'
                                      }`}
                                    >
                                      {user.isAdmin ? '🔒 Remover Admin' : '👑 Tornar Admin'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDeletingUser(user);
                                        setOpenDropdown(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t border-gray-200"
                                    >
                                      🗑️ Deletar Usuário
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-600">
              Nenhum usuário encontrado
            </div>
          )}
        </div>

        {/* Edit Points Modal */}
        {editingPointsUser && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelEditPoints();
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Editar Pontos - {getFirstTwoNames(editingPointsUser.username)}
              </h3>

              <form onSubmit={handleSavePoints} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total de Pontos
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingPoints}
                    onChange={(e) => setEditingPoints(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-bold"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Pontos atuais: {editingPointsUser.totalPoints}
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    ⚠️ <strong>Atenção:</strong> Esta ação ajustará manualmente os pontos do usuário. Use com cuidado.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEditPoints}
                    disabled={savingUserId === editingPointsUser.uid}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingUserId === editingPointsUser.uid}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {savingUserId === editingPointsUser.uid ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingUser && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) {
                setDeletingUser(null);
              }
            }}
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
                    Deletar Usuário
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Tem certeza que deseja deletar o usuário <strong>{getFirstTwoNames(deletingUser.username)}</strong>?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-800">
                      <strong>⚠️ Atenção:</strong> Esta ação irá:
                    </p>
                    <ul className="text-sm text-red-800 mt-2 ml-4 list-disc space-y-1">
                      <li>Substituir o nome do usuário por "[Usuário Deletado]"</li>
                      <li>Remover privilégios de administrador</li>
                      <li>Zerar a pontuação do usuário</li>
                      <li>As apostas permanecerão no sistema</li>
                    </ul>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeletingUser(null)}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDeleteUser}
                      disabled={isDeleting}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {isDeleting ? 'Deletando...' : 'Deletar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
