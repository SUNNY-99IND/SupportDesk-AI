import type { Request, Response, NextFunction } from 'express';

export type UserRole = 'CUSTOMER' | 'AGENT' | 'ADMIN' | 'OWNER';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // OWNER has superuser rights within their workspace and satisfies ADMIN requirements
    const effectiveRoles: UserRole[] = [...req.user.roles];
    if (effectiveRoles.includes('OWNER') && !effectiveRoles.includes('ADMIN')) {
      effectiveRoles.push('ADMIN');
    }

    const hasRole = effectiveRoles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      res.status(403).json({
        success: false,
        message: `Access denied: role must be one of [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
}
