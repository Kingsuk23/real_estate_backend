export type Permission = 'create_record' | 'read_record' | 'update_record' | 'delete_record';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: ['create_record', 'read_record', 'update_record', 'delete_record'],
  AGENT: ['create_record', 'read_record', 'update_record'],
  USER: [],
};

export const getPermissions = (role: string): Permission[] => {
  return ROLE_PERMISSIONS[role] ?? [];
};
