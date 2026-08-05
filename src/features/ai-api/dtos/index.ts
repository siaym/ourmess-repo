export interface UserDTO {
  id: string;
  name: string;
  email: string;
}

export interface ProfileDTO {
  user: UserDTO;
  mess: {
    id: string;
    name: string;
  };
  role: 'owner' | 'manager' | 'member';
}

export interface BalanceDTO {
  currentBalance: number;
  currency: string; // Default to BDT usually based on the previous project context
  lastUpdated: string;
}

export interface BillDTO {
  currentBill: number;
  paid: number;
  due: number;
  currency: string;
  month: string;
}

export interface MealRateDTO {
  currentMealRate: number;
  currency: string;
  lastUpdated: string;
}

export interface MealRecordDTO {
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  total: number;
}

export interface MealsSummaryDTO {
  todayMeals: MealRecordDTO | null;
  monthlyTotalMeals: number;
  history: MealRecordDTO[];
}

export interface DepositRecordDTO {
  amount: number;
  date: string;
  method: string;
}

export interface DepositsSummaryDTO {
  totalDeposits: number;
  currency: string;
  history: DepositRecordDTO[];
}

export interface ExpenseRecordDTO {
  title: string;
  amount: number;
  category: string;
  date: string;
}

export interface ExpensesSummaryDTO {
  monthlyTotal: number;
  currency: string;
  history: ExpenseRecordDTO[];
}

export interface MonthSummaryDTO {
  month: string;
  mealRate: number;
  totalMeals: number;
  totalExpenses: number;
  totalDeposits: number;
  totalBalance: number;
  currency: string;
}

export interface MemberDTO {
  name: string;
  role: string;
  balance: number;
  dues: number;
  currency: string;
}

export interface MembersSummaryDTO {
  members: MemberDTO[];
}

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  date: string;
}

export interface ContextDTO {
  member: ProfileDTO;
  balance: BalanceDTO;
  mealRate: MealRateDTO;
  deposits: DepositRecordDTO[];
  recentExpenses: ExpenseRecordDTO[];
  notifications: NotificationDTO[];
}

export interface RecentTransactionDTO {
  id: string;
  type: 'deposit' | 'expense';
  title: string;
  amount: number;
  date: string;
  currency: string;
}

export interface RecentTransactionsSummaryDTO {
  transactions: RecentTransactionDTO[];
}

export interface PaymentHistoryDTO {
  history: DepositRecordDTO[];
  currency: string;
}
