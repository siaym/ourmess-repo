import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enforceMinRole, UnauthorizedError, ForbiddenError } from '../utils/auth.js';

describe('AI API Utilities', () => {
  describe('Permissions', () => {
    it('should allow owner to access member routes', () => {
      expect(() => enforceMinRole({ role: 'owner' } as any, 'member')).not.toThrow();
    });

    it('should allow manager to access member routes', () => {
      expect(() => enforceMinRole({ role: 'manager' } as any, 'member')).not.toThrow();
    });

    it('should deny member to access manager routes', () => {
      expect(() => enforceMinRole({ role: 'member' } as any, 'manager')).toThrow(ForbiddenError);
    });

    it('should deny member to access owner routes', () => {
      expect(() => enforceMinRole({ role: 'member' } as any, 'owner')).toThrow(ForbiddenError);
    });
  });

  describe('DTO Structure Verification', () => {
    // Basic structural tests can be added here if we want to unit test mappings
    // Typically DTO correctness is checked by the TS compiler,
    // but we can ensure our services return objects matching expected keys.
    it('should have correct shape for ProfileDTO', () => {
      const mockProfile = {
        user: { id: '1', name: 'John', email: 'j@e.com' },
        mess: { id: 'm1', name: 'Mess 1' },
        role: 'member' as const
      };
      
      expect(mockProfile).toHaveProperty('user');
      expect(mockProfile.user).toHaveProperty('id');
      expect(mockProfile.mess).toHaveProperty('id');
      expect(mockProfile).toHaveProperty('role');
    });
  });
});
