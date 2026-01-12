import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { SignInPage } from './pages/SignInPage';
import { HomePage } from './pages/HomePage';
import { RankingPage } from './pages/RankingPage';
import { MyBetsPage } from './pages/MyBetsPage';
import { MatchDetailsPage } from './pages/MatchDetailsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CreateMatchPage } from './pages/admin/CreateMatchPage';
import { ManageMatchesPage } from './pages/admin/ManageMatchesPage';
import { ManageMatchBetsPage } from './pages/admin/ManageMatchBetsPage';
import { ManageSeasonsPage } from './pages/admin/ManageSeasonsPage';
import { ManageUsersPage } from './pages/admin/ManageUsersPage';
import { SetMatchResultsPage } from './pages/admin/SetMatchResultsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/signin" element={<SignInPage />} />

          {/* Protected routes with layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/ranking" element={<RankingPage />} />
              <Route path="/my-bets" element={<MyBetsPage />} />
              <Route path="/matches/:matchId" element={<MatchDetailsPage />} />
            </Route>
          </Route>

          {/* Admin routes */}
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route element={<Layout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/create-match" element={<CreateMatchPage />} />
              <Route path="/admin/matches" element={<ManageMatchesPage />} />
              <Route path="/admin/matches/:matchId/bets" element={<ManageMatchBetsPage />} />
              <Route path="/admin/matches/:matchId/results" element={<SetMatchResultsPage />} />
              <Route path="/admin/users" element={<ManageUsersPage />} />
              <Route path="/admin/seasons" element={<ManageSeasonsPage />} />
            </Route>
          </Route>

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
