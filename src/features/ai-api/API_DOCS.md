# AI Integration API Documentation

This module exposes secure, read-only APIs designed specifically for AI Customer Support Platform consumption via Tool Calling.

## Base URL
When deployed, all endpoints are prefixed with `/api/ai`.

## Authentication
Every endpoint requires a valid Supabase JWT token in the `Authorization` header.
```
Authorization: Bearer <user_jwt_token>
```
The token is verified securely server-side. The `userId` is never accepted as a request parameter. The user's active `messId` and `role` are resolved automatically.

## Permissions
- **Members**: Can view their own data and generic mess summaries.
- **Managers / Owners**: Can view everything, including other members' summaries (via `/members`).

## Endpoints

### 1. GET `/api/ai/balance`
Retrieves the user's current balance in the mess.
```json
{
  "currentBalance": 1250,
  "currency": "BDT",
  "lastUpdated": "2023-10-01T12:00:00Z"
}
```

### 2. GET `/api/ai/meals`
Retrieves today's meals, monthly total meals, and historical meal records for the current user.
```json
{
  "todayMeals": { "date": "2023-10-01", "breakfast": 1, "lunch": 1, "dinner": 1, "total": 3 },
  "monthlyTotalMeals": 45,
  "history": [
    { "date": "2023-10-01", "breakfast": 1, "lunch": 1, "dinner": 1, "total": 3 }
  ]
}
```

### 3. GET `/api/ai/deposits`
Retrieves total deposit amount and deposit history for the current user.
```json
{
  "totalDeposits": 5000,
  "currency": "BDT",
  "history": [
    { "amount": 2000, "method": "bKash", "date": "2023-10-01" }
  ]
}
```

### 4. GET `/api/ai/expenses`
Retrieves mess-wide expenses and history for the current month.
```json
{
  "monthlyTotal": 15000,
  "currency": "BDT",
  "history": [
    { "title": "Rice", "amount": 2500, "category": "Market", "date": "2023-10-01" }
  ]
}
```

### 5. GET `/api/ai/bills`
Calculates current bill, paid amount, and due based on total meals and meal rate.
```json
{
  "currentBill": 2500,
  "paid": 5000,
  "due": 0,
  "currency": "BDT",
  "month": "October 2023"
}
```

### 6. GET `/api/ai/members`
Lists all members in the mess along with their roles, balances, and dues. (**Managers / Owners ONLY**)
```json
{
  "members": [
    { "name": "John Doe", "role": "member", "balance": 1500, "dues": 0, "currency": "BDT" }
  ]
}
```

### 7. GET `/api/ai/month-summary`
Provides a high-level overview of the mess for the month.
```json
{
  "month": "October 2023",
  "mealRate": 65.5,
  "totalMeals": 450,
  "totalExpenses": 25000,
  "totalDeposits": 30000,
  "totalBalance": 5000,
  "currency": "BDT"
}
```

### 8. GET `/api/ai/meal-rate`
Retrieves the current meal rate for the mess. Cached for performance.
```json
{
  "currentMealRate": 65.5,
  "currency": "BDT",
  "lastUpdated": "2023-10-01T12:00:00Z"
}
```

### 9. GET `/api/ai/recent-transactions`
Fetches recent deposits and expenses combined, sorted by date.
```json
{
  "transactions": [
    { "id": "uuid", "type": "deposit", "title": "Deposit via bKash", "amount": 2000, "date": "2023-10-01", "currency": "BDT" },
    { "id": "uuid", "type": "expense", "title": "Rice", "amount": 2500, "date": "2023-09-30", "currency": "BDT" }
  ]
}
```

### 10. GET `/api/ai/payment-history`
Fetches a member's deposit history.
```json
{
  "history": [
    { "amount": 2000, "method": "bKash", "date": "2023-10-01" }
  ],
  "currency": "BDT"
}
```

### 11. GET `/api/ai/profile`
Retrieve the user's profile, active mess details, and their role.
```json
{
  "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com" },
  "mess": { "id": "uuid", "name": "Super Mess" },
  "role": "member"
}
```

### 12. GET `/api/ai/notifications`
Retrieves active notifications.
```json
[
  { "id": "uuid", "title": "Bill Due", "message": "Please pay your bill.", "date": "2023-10-01" }
]
```

### 13. GET `/api/ai/context`
Aggregates the most commonly requested information to reduce multiple API calls.
```json
{
  "member": {
    "user": { "id": "uuid", "name": "John", "email": "john@example.com" },
    "mess": { "id": "uuid", "name": "Super Mess" },
    "role": "member"
  },
  "balance": { "currentBalance": 1250, "currency": "BDT", "lastUpdated": "2023-10-01T12:00:00Z" },
  "mealRate": { "currentMealRate": 65.5, "currency": "BDT", "lastUpdated": "2023-10-01T12:00:00Z" },
  "deposits": [
    { "amount": 2000, "method": "bKash", "date": "2023-10-01" }
  ],
  "recentExpenses": [
    { "title": "Rice", "amount": 2500, "category": "Market", "date": "2023-09-30" }
  ],
  "notifications": []
}
```

## Logging
Every AI request is logged in a structured format:
```
User -> Question -> API Called -> Response Time -> Success -> Timestamp
```
This data is stored via `logger.ts` for monitoring and debugging. No PII or sensitive data is included in these logs.
