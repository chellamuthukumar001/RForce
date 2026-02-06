import express from 'express';
import dotenv from 'dotenv';
import supabase from '../config/supabase.js';

dotenv.config();

const router = express.Router();

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', async (req, res) => {
    try {
        const { email, password, role = 'volunteer' } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Create user in Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        if (data.user) {
            // Store user role in profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    role: role,
                    email: email
                });

            if (profileError) {
                console.error('Profile creation error:', profileError);
                // Optionally delete the auth user if profile creation fails
                return res.status(500).json({ error: 'Failed to create user profile' });
            }
        }

        res.status(201).json({
            message: 'User created successfully',
            user: data.user,
            session: data.session
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Signup failed' });
    }
});

/**
 * POST /api/auth/login
 * Authenticate user and return session
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = data.user;

        // Update last_login
        await supabase
            .from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);

        // Fetch user role from profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        res.json({
            message: 'Login successful',
            user: data.user,
            session: data.session,
            role: profile?.role || 'volunteer'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * POST /api/auth/logout
 * Sign out user
 */
router.post('/logout', async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

/**
 * GET /api/auth/user
 * Get current user information
 */
router.get('/user', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

export default router;
