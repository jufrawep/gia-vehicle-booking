import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

/**
 * JWT CONFIGURATION
 * Loads security credentials from environment variables.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * TOKEN GENERATION
 * Creates a signed JSON Web Token for user authentication.
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as jwt.SignOptions);
};

/**
 * TOKEN VERIFICATION
 * Decodes and validates the integrity of a JWT.
 */
export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};