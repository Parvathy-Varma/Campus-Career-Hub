import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { User, LoginInput } from '@workspace/api-client-react';
import { useGetMe, useLogin, useLogout, getGetMeQueryKey } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading: isMeLoading, error } = useGetMe({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
      queryKey: getGetMeQueryKey(),
    }
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const handleLogin = async (data: LoginInput) => {
    const res = await loginMutation.mutateAsync({ data });
    queryClient.setQueryData(getGetMeQueryKey(), res.user);
    if (res.user.role === 'company') setLocation('/company/dashboard');
    else if (res.user.role === 'student') setLocation('/student/dashboard');
    else if (res.user.role === 'admin') setLocation('/admin/dashboard');
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    queryClient.setQueryData(getGetMeQueryKey(), null);
    setLocation('/login');
  };

  // Treat 401 as unauthenticated (user is null) rather than a persistent error
  const actualUser = error ? null : (user || null);
  const isLoading = isMeLoading && !error && !user;

  return (
    <AuthContext.Provider value={{ user: actualUser, isLoading, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
