/**
 * DTO (Data Transfer Object) untuk modul Dashboard
 */
import {
  DashboardActivity,
  DashboardCashFlowPoint,
  DashboardCustomerRow,
  DashboardSummary,
} from '../../domain/entities/Dashboard.js';

export interface DashboardFilterDto {
  expiringDays?: number;
  limit?: number;
  chartDays?: number;
  chartPoints?: number;
  periodStartDate?: string;
  periodEndDate?: string;
}

export interface DashboardResponseDto {
  summary: DashboardSummary;
  expiringCustomers: DashboardCustomerRow[];
  expiredCustomers: DashboardCustomerRow[];
  activities: DashboardActivity[];
  cashFlowChart: DashboardCashFlowPoint[];
}
