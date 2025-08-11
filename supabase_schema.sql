-- Sales Budget Management System - Complete Database Schema
-- Execute these commands in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'salesman');
CREATE TYPE customer_seasonality AS ENUM ('low', 'medium', 'high');
CREATE TYPE customer_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE budget_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
CREATE TYPE git_status AS ENUM ('ordered', 'shipped', 'in_transit', 'arrived', 'delayed');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- 1. Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'salesman',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    department VARCHAR(100),
    region VARCHAR(100)
);

-- 2. Categories table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Brands table
CREATE TABLE brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Items table
CREATE TABLE items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    brand_id UUID NOT NULL REFERENCES brands(id),
    description TEXT,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    weight DECIMAL(10,3),
    dimensions VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Customers table
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    region VARCHAR(100) NOT NULL,
    segment VARCHAR(100) NOT NULL,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    channels TEXT[] DEFAULT '{}',
    seasonality customer_seasonality DEFAULT 'medium',
    tier customer_tier DEFAULT 'bronze',
    manager_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 6. Sales Budget table
CREATE TABLE sales_budget (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    budget_2025 DECIMAL(15,2) DEFAULT 0,
    actual_2025 DECIMAL(15,2) DEFAULT 0,
    budget_2026 DECIMAL(15,2) DEFAULT 0,
    budget_value_2026 DECIMAL(15,2) DEFAULT 0,
    rate DECIMAL(10,2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    git INTEGER DEFAULT 0,
    discount DECIMAL(15,2) DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status budget_status DEFAULT 'draft',
    UNIQUE(customer_id, item_id, year)
);

-- 7. Monthly Budget table
CREATE TABLE monthly_budget (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sales_budget_id UUID NOT NULL REFERENCES sales_budget(id) ON DELETE CASCADE,
    month VARCHAR(3) NOT NULL CHECK (month IN ('JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC')),
    budget_value DECIMAL(15,2) DEFAULT 0,
    actual_value DECIMAL(15,2) DEFAULT 0,
    rate DECIMAL(10,2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    git INTEGER DEFAULT 0,
    discount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sales_budget_id, month)
);

-- 8. Rolling Forecast table
CREATE TABLE rolling_forecast (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    bud25 DECIMAL(15,2) DEFAULT 0,
    ytd25 DECIMAL(15,2) DEFAULT 0,
    forecast DECIMAL(15,2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    git INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status budget_status DEFAULT 'draft',
    UNIQUE(customer_id, item_id, year)
);

-- 9. Monthly Forecast table
CREATE TABLE monthly_forecast (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rolling_forecast_id UUID NOT NULL REFERENCES rolling_forecast(id) ON DELETE CASCADE,
    month VARCHAR(3) NOT NULL CHECK (month IN ('JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC')),
    forecast_value DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rolling_forecast_id, month)
);

-- 10. Stock Management table
CREATE TABLE stock_management (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    location VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    reorder_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 0,
    cost_per_unit DECIMAL(15,4) DEFAULT 0,
    last_stock_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_id, location)
);

-- 11. GIT Tracking table
CREATE TABLE git_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    git_quantity INTEGER NOT NULL,
    status git_status DEFAULT 'ordered',
    estimated_arrival TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    supplier VARCHAR(255),
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Discount Rules table
CREATE TABLE discount_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    discount_percentage DECIMAL(5,4) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, brand_id)
);

-- 13. Manual Budget Entries table
CREATE TABLE manual_budget_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    budget_2026 DECIMAL(15,2) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, item_id)
);

-- 14. Workflow Approvals table
CREATE TABLE workflow_approvals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workflow_id VARCHAR(100) UNIQUE NOT NULL,
    submitted_by UUID NOT NULL REFERENCES users(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    status approval_status DEFAULT 'pending',
    comments TEXT,
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('sales_budget', 'rolling_forecast')),
    data_ids UUID[] NOT NULL
);

-- 15. Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    related_id UUID,
    related_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Audit Logs table
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_customers_region ON customers(region);
CREATE INDEX idx_customers_segment ON customers(segment);
CREATE INDEX idx_customers_tier ON customers(tier);
CREATE INDEX idx_customers_manager ON customers(manager_id);
CREATE INDEX idx_customers_active ON customers(is_active);

CREATE INDEX idx_items_code ON items(code);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_brand ON items(brand_id);
CREATE INDEX idx_items_active ON items(is_active);
CREATE INDEX idx_items_name_trgm ON items USING gin(name gin_trgm_ops);

CREATE INDEX idx_categories_code ON categories(code);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);

CREATE INDEX idx_brands_code ON brands(code);
CREATE INDEX idx_brands_active ON brands(is_active);

CREATE INDEX idx_sales_budget_customer ON sales_budget(customer_id);
CREATE INDEX idx_sales_budget_item ON sales_budget(item_id);
CREATE INDEX idx_sales_budget_year ON sales_budget(year);
CREATE INDEX idx_sales_budget_status ON sales_budget(status);
CREATE INDEX idx_sales_budget_created_by ON sales_budget(created_by);
CREATE INDEX idx_sales_budget_composite ON sales_budget(customer_id, item_id, year);

CREATE INDEX idx_monthly_budget_sales_budget ON monthly_budget(sales_budget_id);
CREATE INDEX idx_monthly_budget_month ON monthly_budget(month);

CREATE INDEX idx_rolling_forecast_customer ON rolling_forecast(customer_id);
CREATE INDEX idx_rolling_forecast_item ON rolling_forecast(item_id);
CREATE INDEX idx_rolling_forecast_year ON rolling_forecast(year);
CREATE INDEX idx_rolling_forecast_status ON rolling_forecast(status);
CREATE INDEX idx_rolling_forecast_created_by ON rolling_forecast(created_by);

CREATE INDEX idx_monthly_forecast_rolling_forecast ON monthly_forecast(rolling_forecast_id);
CREATE INDEX idx_monthly_forecast_month ON monthly_forecast(month);

CREATE INDEX idx_stock_management_item ON stock_management(item_id);
CREATE INDEX idx_stock_management_location ON stock_management(location);

CREATE INDEX idx_git_tracking_customer ON git_tracking(customer_id);
CREATE INDEX idx_git_tracking_item ON git_tracking(item_id);
CREATE INDEX idx_git_tracking_status ON git_tracking(status);

CREATE INDEX idx_discount_rules_category ON discount_rules(category_id);
CREATE INDEX idx_discount_rules_brand ON discount_rules(brand_id);
CREATE INDEX idx_discount_rules_active ON discount_rules(is_active);

CREATE INDEX idx_manual_budget_customer ON manual_budget_entries(customer_id);
CREATE INDEX idx_manual_budget_item ON manual_budget_entries(item_id);
CREATE INDEX idx_manual_budget_created_by ON manual_budget_entries(created_by);

CREATE INDEX idx_workflow_approvals_status ON workflow_approvals(status);
CREATE INDEX idx_workflow_approvals_submitted_by ON workflow_approvals(submitted_by);
CREATE INDEX idx_workflow_approvals_approved_by ON workflow_approvals(approved_by);
CREATE INDEX idx_workflow_approvals_data_type ON workflow_approvals(data_type);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create functions for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_budget_updated_at BEFORE UPDATE ON sales_budget FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_budget_updated_at BEFORE UPDATE ON monthly_budget FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rolling_forecast_updated_at BEFORE UPDATE ON rolling_forecast FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_forecast_updated_at BEFORE UPDATE ON monthly_forecast FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_management_updated_at BEFORE UPDATE ON stock_management FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_git_tracking_updated_at BEFORE UPDATE ON git_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discount_rules_updated_at BEFORE UPDATE ON discount_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manual_budget_entries_updated_at BEFORE UPDATE ON manual_budget_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE rolling_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE git_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic authentication-based access)
-- Users can read their own data and admins can read all
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid()::text = id::text OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

-- Managers and admins can manage customers
CREATE POLICY "Managers can manage customers" ON customers FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'manager')));
CREATE POLICY "Salesmen can read customers" ON customers FOR SELECT USING (true);

-- All authenticated users can read categories, brands, items
CREATE POLICY "Authenticated users can read categories" ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read brands" ON brands FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read items" ON items FOR SELECT USING (auth.role() = 'authenticated');

-- Sales budget access based on role
CREATE POLICY "Users can manage own sales budget" ON sales_budget FOR ALL USING (created_by::text = auth.uid()::text OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'manager')));

-- Similar policies for other tables
CREATE POLICY "Users can manage own monthly budget" ON monthly_budget FOR ALL USING (EXISTS (SELECT 1 FROM sales_budget WHERE id = monthly_budget.sales_budget_id AND (created_by::text = auth.uid()::text OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'manager')))));

CREATE POLICY "Users can manage own rolling forecast" ON rolling_forecast FOR ALL USING (created_by::text = auth.uid()::text OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'manager')));

CREATE POLICY "Users can manage own monthly forecast" ON monthly_forecast FOR ALL USING (EXISTS (SELECT 1 FROM rolling_forecast WHERE id = monthly_forecast.rolling_forecast_id AND (created_by::text = auth.uid()::text OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'manager')))));

-- Stock management - managers and admins
CREATE POLICY "Managers can manage stock" ON stock_management FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'manager')));
CREATE POLICY "Salesmen can read stock" ON stock_management FOR SELECT USING (true);

-- GIT tracking - all authenticated users
CREATE POLICY "Authenticated users can manage git tracking" ON git_tracking FOR ALL USING (auth.role() = 'authenticated');

-- Discount rules - admins only
CREATE POLICY "Admins can manage discount rules" ON discount_rules FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Users can read discount rules" ON discount_rules FOR SELECT USING (auth.role() = 'authenticated');

-- Manual budget entries
CREATE POLICY "Users can manage own manual budget entries" ON manual_budget_entries FOR ALL USING (created_by::text = auth.uid()::text OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'manager')));

-- Workflow approvals
CREATE POLICY "Users can manage workflow approvals" ON workflow_approvals FOR ALL USING (submitted_by::text = auth.uid()::text OR approved_by::text = auth.uid()::text OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'manager')));

-- Notifications
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Audit logs - read only for admins
CREATE POLICY "Admins can read audit logs" ON audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

-- Insert sample data for testing (optional)
-- You can uncomment and modify these as needed

/*
-- Sample categories
INSERT INTO categories (name, code) VALUES 
('Tyres', 'TYR'),
('Accessories', 'ACC'),
('P4X4', 'P4X4'),
('TBR', 'TBR'),
('AGR', 'AGR'),
('SPR', 'SPR'),
('IND', 'IND'),
('OTR', 'OTR'),
('GEP', 'GEP'),
('HDE', 'HDE');

-- Sample brands
INSERT INTO brands (name, code) VALUES 
('BF Goodrich', 'BFG'),
('Michelin', 'MCH'),
('Giti', 'GTI'),
('Generic', 'GEN'),
('AEOLUS', 'AEO'),
('ADVANCE', 'ADV'),
('TIGAR', 'TGR'),
('BRIDGESTONE', 'BRG'),
('PETLAS', 'PTL'),
('BKT', 'BKT');

-- Sample admin user (you'll need to create this through Supabase Auth)
-- INSERT INTO users (id, email, name, role) VALUES 
-- ('your-auth-user-id-here', 'admin@example.com', 'Admin User', 'admin');
*/

-- Create views for common queries (optional but recommended for performance)
CREATE VIEW sales_budget_with_details AS
SELECT 
    sb.*,
    c.name as customer_name,
    c.code as customer_code,
    i.name as item_name,
    i.code as item_code,
    cat.name as category_name,
    b.name as brand_name,
    u.name as created_by_name
FROM sales_budget sb
JOIN customers c ON sb.customer_id = c.id
JOIN items i ON sb.item_id = i.id
JOIN categories cat ON i.category_id = cat.id
JOIN brands b ON i.brand_id = b.id
JOIN users u ON sb.created_by = u.id;

CREATE VIEW rolling_forecast_with_details AS
SELECT 
    rf.*,
    c.name as customer_name,
    c.code as customer_code,
    i.name as item_name,
    i.code as item_code,
    cat.name as category_name,
    b.name as brand_name,
    u.name as created_by_name
FROM rolling_forecast rf
JOIN customers c ON rf.customer_id = c.id
JOIN items i ON rf.item_id = i.id
JOIN categories cat ON i.category_id = cat.id
JOIN brands b ON i.brand_id = b.id
JOIN users u ON rf.created_by = u.id;

-- Performance monitoring function
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE(
    table_name TEXT,
    row_count BIGINT,
    table_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename AS table_name,
        n_tup_ins - n_tup_del AS row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS table_size
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ORDER BY n_tup_ins - n_tup_del DESC;
END;
$$ LANGUAGE plpgsql;

-- Sample usage: SELECT * FROM get_table_stats();
