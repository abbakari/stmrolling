# STM Budget & Sales Management System

A modern, production-ready budget and sales management system built with React, TypeScript, and Supabase. This application has been transformed from a demo system to a real, high-performance solution with enterprise-grade features.

## 🚀 Key Features

### ✅ Performance Optimizations Implemented

| Optimization | Status | Implementation |
|--------------|--------|---------------|
| ✅ **Pagination** | Implemented | Configurable page sizes with efficient database queries |
| ✅ **Column Selection** | Implemented | Optimized SELECT queries to avoid unnecessary data transfer |
| ✅ **Filtering** | Implemented | Database-level filtering with indexed columns |
| ✅ **Indexing** | Implemented | Comprehensive database indexes for fast queries |
| ✅ **DB-level Sorting** | Implemented | Server-side sorting to reduce client load |
| ✅ **SWR Caching** | Implemented | Smart client-side caching with auto-revalidation |
| ✅ **Real-time Updates** | Implemented | Supabase real-time subscriptions |
| ✅ **Lazy Loading** | Implemented | Progressive data loading for faster initial render |

### 🔐 Authentication & Security

- **Real Authentication**: Supabase Auth with email/password and role-based access
- **Row Level Security**: Database-level permissions based on user roles
- **Role-based Access Control**: Admin, Manager, Salesman, Supply Chain roles
- **Secure Sessions**: JWT tokens with automatic refresh
- **Profile Management**: User profiles with department and role assignments

### 📊 Real Data Management

- **PostgreSQL Database**: Production-ready database with ACID compliance
- **Structured Data Models**: Customers, Items, Categories, Brands, Sales Budgets, Forecasts
- **Audit Trails**: Created/updated timestamps and user tracking
- **Data Relationships**: Foreign keys and joins for data integrity
- **Workflow Management**: Approval processes with status tracking

### ⚡ Performance Features

- **Smart Caching**: SWR for efficient data fetching and cache management
- **Optimized Queries**: Database queries with proper indexing and pagination
- **Real-time Sync**: Live updates across multiple users
- **Batch Operations**: Efficient bulk data operations
- **Connection Pooling**: Optimized database connections

## 🛠 Technical Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **State Management**: React Context + SWR
- **Data Fetching**: SWR with Supabase client
- **Icons**: Lucide React
- **Charts**: Recharts
- **Routing**: React Router DOM

## 📋 Database Schema

The application uses a comprehensive database schema with the following tables:

- **profiles**: User management with role-based access
- **customers**: Customer information and relationships
- **categories & brands**: Product categorization
- **items**: Inventory items with stock management
- **sales_budgets**: Sales budget planning and tracking
- **rolling_forecasts**: Dynamic sales forecasting
- **git_items**: Goods in Transit management
- **communications**: Internal messaging system
- **workflows**: Approval and workflow management

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### 2. Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 3. Supabase Setup

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for setup to complete

2. **Run Database Migration**:
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Copy and paste the contents of `supabase-schema.sql`
   - Run the SQL to create tables, indexes, and security policies

3. **Configure Environment Variables**:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Start Development

```bash
npm run dev
```

The application will show setup instructions if Supabase is not properly configured.

## 👥 User Roles & Permissions

### 🔴 Administrator
- Full system access
- User management
- Data source configuration
- System analytics
- Approval oversight

### 🟡 Manager
- Budget and forecast approvals
- Team performance analytics
- Workflow management
- Communication oversight

### 🟢 Salesman
- Create and manage sales budgets
- Rolling forecast planning
- Customer relationship management
- Communication with management

### 🔵 Supply Chain
- Inventory management
- GIT (Goods in Transit) tracking
- Distribution planning
- Stock level monitoring

## 📊 Key Components

### Data Fetching with SWR
```typescript
// Example: Optimized data fetching with caching
const { customers, count, isLoading } = useCustomers({
  page: 1,
  pageSize: 20,
  filters: { is_active: true },
  searchColumn: 'name',
  searchTerm: 'john'
});
```

### Real-time Updates
```typescript
// Example: Real-time subscription
useRealtimeSubscription('sales_budgets', (payload) => {
  // Handle real-time updates
  invalidateRelatedCaches('sales_budgets');
});
```

### Performance Optimizations
```typescript
// Example: Efficient database query with pagination
const query = supabase
  .from('sales_budgets')
  .select(`
    *,
    customer:customer_id(id, name),
    item:item_id(id, name, category:category_id(name))
  `, { count: 'exact' })
  .range(from, to)
  .order('created_at', { ascending: false });
```

## 🔧 API Services

The application includes comprehensive API services:

- **Customer API**: CRUD operations for customer management
- **Sales Budget API**: Budget planning and approval workflows
- **Forecast API**: Rolling forecast management
- **GIT Items API**: Goods in transit tracking
- **Communication API**: Internal messaging system
- **Analytics API**: Dashboard statistics and reporting

## 📈 Performance Monitoring

### Database Performance
- Indexed queries for fast lookups
- Efficient pagination to reduce data transfer
- Optimized joins and relationships
- Connection pooling for scalability

### Client Performance
- SWR caching reduces unnecessary API calls
- Lazy loading for improved initial load times
- Real-time updates without full page refreshes
- Optimistic updates for better UX

## 🔒 Security Features

- **Row Level Security**: Database policies enforce data access rules
- **Input Validation**: Client and server-side validation
- **SQL Injection Protection**: Parameterized queries via Supabase
- **Authentication Tokens**: Secure JWT token management
- **Role-based Access**: Granular permission system

## 🌐 Production Deployment

The application is ready for production deployment with:

- Environment variable configuration
- Database migrations
- Security policies
- Performance optimizations
- Error handling and logging

### Recommended Hosting
- **Frontend**: Netlify, Vercel, or similar
- **Database**: Supabase (included)
- **Authentication**: Supabase Auth (included)

## 📝 Migration from Demo

If upgrading from the previous demo version:

1. The old localStorage-based data will be automatically detected
2. A migration helper is available to assist with data transition
3. All demo users and sample data have been removed
4. Real authentication is now required

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React context providers
├── hooks/              # Custom hooks (SWR, etc.)
├── lib/                # Utility libraries (Supabase client)
├── pages/              # Application pages
├── services/           # API services and data management
├── types/              # TypeScript type definitions
└── utils/              # Helper utilities
```

## 📖 Documentation

- Database schema: `supabase-schema.sql`
- Environment setup: `.env.example`
- Type definitions: `src/types/database.ts`
- API documentation: `src/services/api.ts`

## 🎯 Next Steps

The application is now production-ready with:
- ✅ Real database persistence
- ✅ Secure authentication
- ✅ Performance optimizations
- ✅ Role-based access control
- ✅ Real-time updates
- ✅ Comprehensive API layer

Ready to handle real-world usage with enterprise-grade performance and security!
