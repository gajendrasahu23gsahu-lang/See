import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { dbService } from '../services/dbService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<boolean>;
  signup: (data: { name: string; handle: string; email: string; phone: string; address?: string; password: string }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedId = await AsyncStorage.getItem('see_auth_id');
        if (savedId) {
          const u = await dbService.getUser(savedId);
          if (u) setUser(u);
        }
      } catch (error) {
        console.error('Failed to load user', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (identifier: string, password?: string) => {
    try {
      const users = JSON.parse((await AsyncStorage.getItem('see_db_users')) || '[]');
      
      // Allow login with Email OR Handle (User ID) OR Phone
      const found = users.find((u: any) => 
        u.email.toLowerCase() === identifier.toLowerCase() || 
        u.handle.toLowerCase() === identifier.toLowerCase() ||
        u.handle.toLowerCase() === `@${identifier.toLowerCase()}` ||
        (u.phone && u.phone === identifier)
      );

      if (found) {
        // Check Password
        if (found.password && found.password !== password) {
          throw new Error('Incorrect password.');
        }

        setUser(found);
        await AsyncStorage.setItem('see_auth_id', found.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const signup = async (data: { name: string; handle: string; email: string; phone: string; address?: string; password: string }) => {
    try {
      const cleanHandle = data.handle.startsWith('@') ? data.handle : `@${data.handle}`;
      
      // Check if handle already exists
      const users = JSON.parse((await AsyncStorage.getItem('see_db_users')) || '[]');
      if (users.find((u: any) => u.handle.toLowerCase() === cleanHandle.toLowerCase())) {
        throw new Error('User ID already taken');
      }
      if (users.find((u: any) => u.email.toLowerCase() === data.email.toLowerCase())) {
        throw new Error('Email already registered');
      }

      const newUser: User = {
        id: `user_${Date.now()}`,
        name: data.name,
        handle: cleanHandle,
        email: data.email,
        phone: data.phone,
        address: data.address,
        password: data.password,
        bio: `Hello! I'm ${data.name}. Excited to be on See.`,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
        banner: '', // Empty by default, will use gradient
        followers: 0,
        following: 0,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };
      
      await dbService.saveUser(newUser);
      setUser(newUser);
      await AsyncStorage.setItem('see_auth_id', newUser.id);
      return true;
    } catch (error) {
      console.error('Signup failed', error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('see_auth_id');
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    await dbService.saveUser(updatedUser);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};