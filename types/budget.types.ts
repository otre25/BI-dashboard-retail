// Budget and Forecasting Types

export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly';
export type BudgetCategory = 'advertising' | 'operations' | 'salaries' | 'other';

export interface Budget {
  id: string;
  companyId: string;
  name: string;
  category: BudgetCategory;
  amount: number;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  currency: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAllocation {
  budgetId: string;
  channel?: string; // For advertising budgets
  storeId?: string; // For store-specific budgets
  allocated: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: 'warning' | 'danger' | 'exceeded';
  threshold: number; // percentage (e.g., 80, 90, 100)
  message: string;
  triggeredAt: Date;
  acknowledged: boolean;
}

export interface BudgetStatus {
  budget: Budget;
  allocation: BudgetAllocation;
  alerts: BudgetAlert[];
  projectedEndDate: Date;
  isOnTrack: boolean;
}

// Forecasting Types

export interface ForecastData {
  id: string;
  companyId: string;
  metric: 'revenue' | 'sales' | 'leads' | 'adSpend';
  period: 'daily' | 'weekly' | 'monthly';
  generatedAt: Date;
  predictions: ForecastPrediction[];
  accuracy?: number; // percentage
  method: 'linear' | 'exponential' | 'seasonal' | 'ai';
}

export interface ForecastPrediction {
  date: Date;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
  confidence: number; // percentage
}

export interface TrendAnalysis {
  metric: string;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  momentum: 'accelerating' | 'decelerating' | 'steady';
  seasonality?: {
    detected: boolean;
    pattern: 'weekly' | 'monthly' | 'quarterly';
  };
}

export interface BudgetRecommendation {
  id: string;
  budgetId: string;
  type: 'increase' | 'decrease' | 'reallocate';
  suggestedAmount: number;
  reason: string;
  impact: string;
  confidence: number;
  generatedAt: Date;
}

// Budget vs Actual comparison
export interface BudgetVsActual {
  budgetId: string;
  period: Date;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  status: 'under' | 'on-track' | 'over';
}
