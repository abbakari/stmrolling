# 🚀 Complete Setup Guide with Sample Data

## 📋 **Step 1: Create Users with These Exact Credentials**

Use your application's signup form (click "Don't have an account? Sign up" on the login page) to create these users:

### 🔴 **ADMIN USER**
- **Email**: `admin@stmbudget.com`
- **Password**: `Admin123!`
- **Name**: `System Administrator`
- **Role**: `admin`
- **Department**: `IT`

### 🟡 **MANAGER USER**
- **Email**: `manager@stmbudget.com`
- **Password**: `Manager123!`
- **Name**: `Sarah Johnson`
- **Role**: `manager`
- **Department**: `Sales`

### 🟢 **SALESMAN USER 1**
- **Email**: `john@stmbudget.com`
- **Password**: `Sales123!`
- **Name**: `John Mwangi`
- **Role**: `salesman`
- **Department**: `Sales`

### 🟢 **SALESMAN USER 2**
- **Email**: `jane@stmbudget.com`
- **Password**: `Sales123!`
- **Name**: `Jane Doe`
- **Role**: `salesman`
- **Department**: `Sales`

### 🔵 **SUPPLY CHAIN USER**
- **Email**: `supply@stmbudget.com`
- **Password**: `Supply123!`
- **Name**: `Ahmed Hassan`
- **Role**: `supply_chain`
- **Department**: `Supply Chain`

## 📊 **Step 2: Load Sample Data**

1. Go to your Supabase project dashboard
2. Open the **SQL Editor**
3. Copy and paste the entire contents of `complete-sample-data.sql`
4. Click **Run** to execute the SQL

## 🔐 **Step 3: Test Login**

You can now login with any of these credentials:

### Quick Test Logins:
- **Admin**: `admin@stmbudget.com` / `Admin123!`
- **Manager**: `manager@stmbudget.com` / `Manager123!`  
- **Salesman**: `john@stmbudget.com` / `Sales123!`
- **Supply Chain**: `supply@stmbudget.com` / `Supply123!`

## 📈 **What You'll Get**

### Sample Data Included:
- ✅ **5 Users** with different roles and permissions
- ✅ **5 Customers** (Action Aid, Advent Construction, etc.)
- ✅ **5 Categories** (Tyre Service, Automotive Parts, etc.)
- ✅ **5 Brands** (BF Goodrich, Michelin, Continental, etc.)
- ✅ **6 Items** with stock levels and pricing
- ✅ **5 Sales Budgets** in different statuses (draft, saved, submitted, approved)
- ✅ **3 Rolling Forecasts** with quarterly data
- ✅ **5 GIT Items** (Goods in Transit) with different statuses
- ✅ **4 Communications** between users
- ✅ **3 Workflows** for approval processes

### User Experience by Role:

#### 🔴 **Admin** (`admin@stmbudget.com`)
- Can see all data across the system
- Access to user management
- Can approve budgets and workflows
- Full system administration capabilities

#### 🟡 **Manager** (`manager@stmbudget.com`)
- Can review and approve sales budgets and forecasts
- Access to team performance analytics
- Can communicate with all team members
- Workflow management capabilities

#### 🟢 **Salesman** (`john@stmbudget.com` or `jane@stmbudget.com`)
- Can create and manage their own sales budgets
- Access to rolling forecast planning
- Can manage their assigned customers
- Can communicate with managers and admin

#### 🔵 **Supply Chain** (`supply@stmbudget.com`)
- Can manage inventory and stock levels
- Access to GIT (Goods in Transit) tracking
- Can update item information
- Can communicate about supply chain issues

## 🎯 **Test Scenarios**

1. **Login as Salesman** → Create a new budget or forecast
2. **Login as Manager** → Review and approve submitted budgets  
3. **Login as Supply Chain** → Update stock levels or GIT status
4. **Login as Admin** → View system-wide analytics and manage users

## 🔧 **Troubleshooting**

- If users aren't created properly, check the profiles table in Supabase
- Make sure to use the **exact emails** listed above
- The sample data SQL will only work after users are created
- Check browser console for any authentication errors

Your system is now ready with comprehensive sample data! 🚀
