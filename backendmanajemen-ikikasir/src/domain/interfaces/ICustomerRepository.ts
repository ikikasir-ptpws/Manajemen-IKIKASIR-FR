import { Customer } from '../entities/Customer.js';
import { SubscriptionHistory } from '../entities/SubscriptionHistory.js';

export interface CreateCustomerData {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  address?: string;
  packageId?: string;
  packageName?: string;
  packagePrice?: number;
  packagePeriod?: string;
  status?: string;
  startedAt?: Date;
  expiresAt: Date;
  notes?: string;
}

export interface UpdateCustomerData {
  name?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  address?: string;
  packageId?: string;
  packageName?: string;
  packagePrice?: number;
  packagePeriod?: string;
  status?: string;
  expiresAt?: Date;
  notes?: string;
}

export interface CustomerFilter {
  search?: string;
  status?: string; // ALL, ACTIVE, EXPIRED, SUSPENDED
  packageId?: string;
}

export interface CreateSubscriptionHistoryData {
  customerId: string;
  packageId?: string;
  packageName: string;
  amount: number;
  billingCycleMonths: number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  startedAt: Date;
  expiresAt: Date;
}

export interface ICustomerRepository {
  findAll(filter?: CustomerFilter): Promise<Customer[]>;
  findById(id: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  create(data: CreateCustomerData): Promise<Customer>;
  update(id: string, data: UpdateCustomerData): Promise<Customer>;
  delete(id: string): Promise<void>;
  findExpired(search?: string): Promise<Customer[]>;
  addSubscriptionHistory(data: CreateSubscriptionHistoryData): Promise<SubscriptionHistory>;
  getSubscriptionHistories(customerId?: string): Promise<SubscriptionHistory[]>;
}
