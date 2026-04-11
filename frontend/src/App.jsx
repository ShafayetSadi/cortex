import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Layout from "./layout/Layout";
import AdminDashboard from "./pages/AdminDashboard";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import RegisterWorkspacePage from "./pages/RegisterWorkspacePage";
import SuperAdminPage from "./pages/SuperAdminPage";
import UserDashboard from "./pages/UserDashboard";
import UserManagementPage from "./pages/UserManagementPage";
import WorkspaceSettingsPage from "./pages/WorkspaceSettingsPage";

const DashboardRouter = () => {
  const { user } = useAuth();
  if (user?.role === "superadmin") return <Navigate to="/superadmin" replace />;
  return user?.role === "admin" ? <AdminDashboard /> : <UserDashboard />;
};

const App = () => {
  const { user, loading } = useAuth();

  return (
    <Layout>
      <Routes>
        {/* Public landing page for non-authenticated users */}
        <Route
          path="/"
          element={
            loading ? (
              <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : user ? (
              <HomePage />
            ) : (
              <LandingPage />
            )
          }
        />
        <Route
          path="/documents/:id"
          element={
            <ProtectedRoute>
              <DocumentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-workspace" element={<RegisterWorkspacePage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute role="admin">
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspace"
          element={
            <ProtectedRoute role="admin">
              <WorkspaceSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute role="superadmin">
              <SuperAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/"} replace />}
        />
      </Routes>
    </Layout>
  );
};

export default App;
