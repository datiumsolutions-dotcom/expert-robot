import jwt from 'jsonwebtoken';

import type { CustomerJwtPayload, JwtPayload } from '@loyalty/types';

function getPrivateKey(): string {
  const key = process.env['JWT_PRIVATE_KEY'];
  if (!key) throw new Error('JWT_PRIVATE_KEY environment variable is required');
  return key.replace(/\\n/g, '\n');
}

function getPublicKey(): string {
  const key = process.env['JWT_PUBLIC_KEY'];
  if (!key) throw new Error('JWT_PUBLIC_KEY environment variable is required');
  return key.replace(/\\n/g, '\n');
}

export function signAdminToken(
  payload: Omit<JwtPayload, 'iat' | 'exp' | 'type'>,
  type: 'access' | 'refresh' = 'access',
): string {
  const expiresIn =
    type === 'access'
      ? (process.env['JWT_ACCESS_TOKEN_EXPIRES_IN'] ?? '15m')
      : (process.env['JWT_REFRESH_TOKEN_EXPIRES_IN'] ?? '7d');

  return jwt.sign({ ...payload, type }, getPrivateKey(), {
    algorithm: 'RS256',
    expiresIn,
  } as jwt.SignOptions);
}

export function signCustomerToken(
  payload: Omit<CustomerJwtPayload, 'iat' | 'exp' | 'type'>,
): string {
  return jwt.sign({ ...payload, type: 'customer_access' }, getPrivateKey(), {
    algorithm: 'RS256',
    expiresIn: process.env['JWT_ACCESS_TOKEN_EXPIRES_IN'] ?? '15m',
  } as jwt.SignOptions);
}

export function verifyAdminToken(token: string): JwtPayload {
  return jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] }) as JwtPayload;
}

export function verifyCustomerToken(token: string): CustomerJwtPayload {
  return jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] }) as CustomerJwtPayload;
}
