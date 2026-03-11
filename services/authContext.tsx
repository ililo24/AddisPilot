import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check for existing session
        const storedUser = localStorage.getItem('leenjisaa_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse stored user', e);
                localStorage.removeItem('leenjisaa_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));

            const usersJson = localStorage.getItem('leenjisaa_all_users') || '[]';
            const users: User[] = JSON.parse(usersJson);

            const foundUser = users.find(u => u.email === email && u.password === password);

            if (foundUser) {
                const { password: _, ...userWithoutPassword } = foundUser;
                setUser(userWithoutPassword);
                localStorage.setItem('leenjisaa_user', JSON.stringify(userWithoutPassword));
            } else {
                throw new Error('Invalid email or password');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));

            const usersJson = localStorage.getItem('leenjisaa_all_users') || '[]';
            const users: User[] = JSON.parse(usersJson);

            if (users.some(u => u.email === email)) {
                throw new Error('Email already registered');
            }

            const newUser: User = {
                id: Date.now().toString(),
                name,
                email,
                password
            };

            users.push(newUser);
            localStorage.setItem('leenjisaa_all_users', JSON.stringify(users));

            const { password: _, ...userWithoutPassword } = newUser;
            setUser(userWithoutPassword);
            localStorage.setItem('leenjisaa_user', JSON.stringify(userWithoutPassword));
        } catch (err: any) {
            setError(err.message || 'Signup failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('leenjisaa_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, isLoading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
