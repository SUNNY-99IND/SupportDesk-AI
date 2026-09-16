import type { Request, Response, NextFunction } from 'express';

export function requireRole(...allowedRoles: ('CUSTOMER' | 'AGENT' | 'ADMIN')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
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
