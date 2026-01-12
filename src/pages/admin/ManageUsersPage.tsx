import { useState, useEffect } from 'react';
import { getAllUsers, toggleAdminStatus, updateUserUsername } from '../../services/userService';
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

  useEffect(() => {
    loadUsers();
  }, []);

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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pontos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
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
                            <div className="text-sm font-medium text-gray-900">
                              {user.username}
                            </div>
                          )}
                          {user.uid === currentUser?.uid && (
                            <div className="text-xs text-gray-500">(Você)</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.totalPoints}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isAdmin ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Usuário
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {editingUserId === user.uid ? (
                          <>
                            <button
                              onClick={() => handleSaveUsername(user.uid)}
                              disabled={savingUserId === user.uid}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={savingUserId === user.uid}
                              className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditUsername(user)}
                              disabled={savingUserId !== null}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            >
                              Editar Nome
                            </button>
                            {user.uid !== currentUser?.uid && (
                              <button
                                onClick={() => handleToggleAdmin(user.uid, user.isAdmin)}
                                disabled={savingUserId !== null}
                                className={`${
                                  user.isAdmin
                                    ? 'text-red-600 hover:text-red-900'
                                    : 'text-green-600 hover:text-green-900'
                                } disabled:opacity-50`}
                              >
                                {user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
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
      </div>
    </div>
  );
}
