import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const profileImageKey = user ? `profile_image_${user.id}` : null;

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/api/users/me");
        setUser(data);
        if (data.role !== "superadmin") {
          const { data: wsData } = await api.get("/api/workspaces/me");
          setWorkspace(wsData);
        }
      } catch {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setWorkspace(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [token]);

  useEffect(() => {
    if (!profileImageKey) {
      setProfileImage(null);
      return;
    }
    const image = localStorage.getItem(profileImageKey);
    setProfileImage(image);
  }, [profileImageKey]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });

    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);

    const me = await api.get("/api/users/me");
    setUser(me.data);
    if (me.data.role !== "superadmin") {
      const ws = await api.get("/api/workspaces/me");
      setWorkspace(ws.data);
    }
  }, []);

  const register = useCallback(
    async ({ name, email, password, invite_token }) => {
      const { data } = await api.post("/api/auth/register", {
        name,
        email,
        password,
        invite_token,
      });

      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);

      const me = await api.get("/api/users/me");
      setUser(me.data);
      const ws = await api.get("/api/workspaces/me");
      setWorkspace(ws.data);
    },
    [],
  );

  const registerWorkspace = useCallback(
    async ({ workspace_name, admin_name, admin_email, password }) => {
      const { data } = await api.post("/api/auth/register-workspace", {
        workspace_name,
        admin_name,
        admin_email,
        password,
      });

      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);

      const me = await api.get("/api/users/me");
      setUser(me.data);
      const ws = await api.get("/api/workspaces/me");
      setWorkspace(ws.data);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setWorkspace(null);
    setProfileImage(null);
  }, []);

  const updateProfileImage = useCallback(
    (imageData) => {
      if (!profileImageKey) return;

      if (!imageData) {
        localStorage.removeItem(profileImageKey);
        setProfileImage(null);
        return;
      }

      localStorage.setItem(profileImageKey, imageData);
      setProfileImage(imageData);
    },
    [profileImageKey],
  );

  const value = useMemo(
    () => ({
      user,
      workspace,
      token,
      loading,
      login,
      register,
      registerWorkspace,
      logout,
      profileImage,
      updateProfileImage,
    }),
    [
      user,
      workspace,
      token,
      loading,
      login,
      register,
      registerWorkspace,
      logout,
      profileImage,
      updateProfileImage,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
