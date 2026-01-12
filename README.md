# Bolão CearaStats

Uma aplicação de bolão para torcedores do Ceará Sporting Club fazerem apostas em jogos e competirem por pontos.

## Funcionalidades

### Para Usuários
- Autenticação com Google Sign-In
- Fazer apostas em jogos do Ceará (placar + jogador)
- Ver histórico de apostas com pontuação detalhada
- Acompanhar ranking global de usuários
- Ver estatísticas de apostas por jogo
- Editar nome de usuário

### Para Administradores
- Criar novos jogos (adversário + data/hora)
- Definir resultados dos jogos (placar + goleadores + assistências)
- Gerenciar usuários (promover a admin, editar nomes)
- Gerenciar temporadas (criar e encerrar)

## Regras de Pontuação

A pontuação é baseada em **precisão e exclusividade**:

### Placar
- Placar exato (compartilhado): **2 pontos**
- Placar exato (único): **4 pontos**
- Acertou resultado (vitória/empate): **1 ponto**

### Jogador
- Jogador marcou gol (compartilhado): **2 pontos**
- Jogador marcou gol (único): **4 pontos**
- Jogador deu assistência (compartilhado): **1 ponto**
- Jogador deu assistência (único): **2 pontos**

> **Nota**: "Único" significa que você foi o único usuário a fazer aquela previsão!

## Regras de Apostas

- Usuários só podem apostar em **vitória ou empate** do Ceará
- Apostas são bloqueadas quando o jogo começa
- Cada usuário pode apostar em apenas **um jogador** por jogo
- O jogador escolhido pode ganhar pontos por gol OU assistência (ou ambos!)

## Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **Autenticação**: Google Sign-In
- **Hospedagem**: Firebase Hosting

## Configuração do Projeto

### Pré-requisitos

- Node.js 18+
- Yarn
- Conta no Firebase

### 1. Instalar Dependências

```bash
yarn install
```

### 2. Configurar Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative **Authentication** e habilite o provedor Google
3. Crie um banco de dados **Firestore** (modo de produção)
4. Copie as credenciais do projeto

### 3. Configurar Variáveis de Ambiente

```bash
cp .env.example .env.development
```

Edite `.env.development` e adicione suas credenciais do Firebase:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Implantar Regras de Segurança e Índices

Instale a Firebase CLI:

```bash
npm install -g firebase-tools
```

Faça login e configure o projeto:

```bash
firebase login
firebase use --add
```

Implante as regras de segurança e índices:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 5. Executar Localmente

```bash
yarn dev
```

Abra [http://localhost:5173](http://localhost:5173) no navegador.

## Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── layout/         # Header, Layout
│   ├── auth/           # SignInButton, ProtectedRoute
│   ├── matches/        # Componentes de jogos
│   ├── bets/           # Componentes de apostas
│   ├── ranking/        # Componentes de ranking
│   ├── admin/          # Componentes administrativos
│   └── ui/             # Componentes reutilizáveis
├── contexts/           # React Context (Auth)
├── hooks/              # Custom hooks
├── lib/                # Firebase, scoring logic
├── pages/              # Páginas da aplicação
├── services/           # Lógica de negócios
├── types/              # TypeScript types
└── utils/              # Funções auxiliares
```

## Esquema do Banco de Dados

### Coleções

- **users**: Dados de usuários (username, isAdmin, totalPoints)
- **matches**: Jogos (adversário, data, resultados)
- **bets**: Apostas (placar previsto, jogador previsto, pontos)
- **seasons**: Temporadas (nome, status, rankings finais)
- **systemConfig**: Configurações do sistema (primeiro usuário)

## Implantação

### Build de Produção

```bash
yarn build
```

### Deploy no Firebase Hosting

```bash
firebase deploy --only hosting
```

## Primeiro Acesso

1. O **primeiro usuário** a fazer login será automaticamente **administrador**
2. Administradores podem promover outros usuários a administradores
3. Somente administradores podem criar jogos e definir resultados

## Desenvolvimento

### Adicionar Novos Recursos

1. Crie componentes em `src/components/`
2. Adicione páginas em `src/pages/`
3. Defina tipos em `src/types/`
4. Implemente lógica de negócios em `src/services/`
5. Atualize rotas em `src/App.tsx`

### Testar Localmente

Use o Firebase Emulator Suite para testar sem afetar produção:

```bash
firebase emulators:start
```

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

MIT License

## Suporte

Para suporte, abra uma issue no repositório ou entre em contato com os desenvolvedores.

---

**Vamo Vozão!** 🖤🤍
