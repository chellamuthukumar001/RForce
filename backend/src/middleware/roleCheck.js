import dotenv from 'dotenv';
import supabase from '../config/supabase.js';

dotenv.config();

/**
 * Middleware to check if user has admin role
 * Must be used after verifyToken middleware
 */
export const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Query profiles table to check if user is admin
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (error || !data) {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        if (data.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        req.userRole = data.role;
        next();
    } catch (error) {
        console.error('Role check error:', error);
        res.status(500).json({ error: 'Role verification failed' });
    }
};

/**
 * Middleware to attach user role (admin or volunteer)
 * Does not block request, just adds role info
 */
export const attachRole = async (req, res, next) => {
    try {
        if (!req.user) {
            return next();
        }

        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        req.userRole = data?.role || 'volunteer';
        next();
    } catch (error) {
        console.error('Attach role error:', error);
        req.userRole = 'volunteer';
        next();
    }
};

export default { requireAdmin, attachRole };
