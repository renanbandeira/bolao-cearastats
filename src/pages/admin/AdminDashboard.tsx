import { Link } from 'react-router-dom';

export function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Painel Administrativo
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/admin/create-match"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Criar Jogo
            </h2>
            <p className="text-gray-600">
              Adicione um novo jogo para os usuários apostarem
            </p>
          </Link>

          <Link
            to="/admin/matches"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Gerenciar Jogos
            </h2>
            <p className="text-gray-600">
              Editar detalhes dos jogos e recalcular pontos
            </p>
          </Link>

          <Link
            to="/admin/users"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Gerenciar Usuários
            </h2>
            <p className="text-gray-600">
              Promover administradores e editar nomes de usuário
            </p>
          </Link>

          <Link
            to="/admin/seasons"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Gerenciar Temporadas
            </h2>
            <p className="text-gray-600">
              Criar e encerrar temporadas do bolão
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
