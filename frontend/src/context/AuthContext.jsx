import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { authAPI } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const fetchRole = async (userId) => {
            if (!userId) {
                setRole(null);
                return;
            }
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();
            setRole(data?.role || 'volunteer');
        };

        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.access_token) {
                localStorage.setItem('access_token', session.access_token);
            }
            if (session?.user) fetchRole(session.user.id);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.access_token) {
                localStorage.setItem('access_token', session.access_token);
            } else {
                localStorage.removeItem('access_token');
                setRole(null);
            }
            if (session?.user) fetchRole(session.user.id);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signup = async (email, password, role = 'volunteer') => {
        try {
            const response = await authAPI.signup({ email, password, role });
            setSession(response.data.session);
            setUser(response.data.user);
            if (response.data.session?.access_token) {
                localStorage.setItem('access_token', response.data.session.access_token);
            }
            setRole(role);
            return { data: response.data, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data?.error || error.message };
        }
    };

    const login = async (email, password) => {
        try {
            const response = await authAPI.login({ email, password });
            setSession(response.data.session);
            setUser(response.data.user);
            if (response.data.session?.access_token) {
                localStorage.setItem('access_token', response.data.session.access_token);
            }
            setRole(response.data.role); // Set role from response
            return { data: response.data, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data?.error || error.message };
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
            setSession(null);
            setUser(null);
            setRole(null);
            localStorage.removeItem('access_token');
            return { error: null };
        } catch (error) {
            return { error: error.response?.data?.error || error.message };
        }
    };

    const value = {
        user,
        session,
        role,
        signup,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
