import jwt from 'jsonwebtoken';

// Check if user is authenticated
export const isAuthenticated = async (req, res, next) => {
    try {
        // Get token from cookies or Authorization header
        const token = req.cookies.accessToken || req.cookies.refreshToken || (req.headers.authorization && req.headers.authorization.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access Denied. Please Send Your Token'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.auth = decoded;
        next();

    } catch (error) {
        // Handle specific JWT errors
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Internal server error during token verification'
        });
    }
};

// Check if user is admin
export const isAdmin = async (req, res, next) => {
    try {
        // First check if user is authenticated
        await isAuthenticated(req, res, () => { });

        if (!req.auth) return; // isAuthenticated already sent the response

        // Check admin role
        if (!req.auth || req.auth.isAdmin !== true) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Check if user is logged out (for routes that shouldn't be accessed when logged in)
export const isLoggedOut = async (req, res, next) => {
    try {
        const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);

        if (token) {
            return res.status(400).json({
                success: false,
                message: 'You are already logged in'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};