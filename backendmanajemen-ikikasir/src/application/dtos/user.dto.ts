export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: string;
  roleId?: string;
  status?: 'Active' | 'Inactive';
  phone?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  roleId?: string;
  status?: 'Active' | 'Inactive';
  phone?: string;
}

export interface UserQueryDto {
  search?: string;
  role?: string;
  status?: 'Active' | 'Inactive' | string;
}

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId?: string | null;
  roleDetail?: any;
  status: 'Active' | 'Inactive';
  phone?: string | null;
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
