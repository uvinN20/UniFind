import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  // Restore the session on first load
  useEffect(() => {
    if (!getToken()) return;
    api
      .get('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const data = await api.post('/auth/login', { email, password });
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      register: async (payload) => {
        const data = await api.post('/auth/register', payload);
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      logout: () => {
        setToken(null);
        setUser(null);
      },
      updateUser: setUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
