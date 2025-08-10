-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'salesman', 'manager', 'supply_chain');
CREATE TYPE status_type AS ENUM ('draft', 'saved', 'submitted', 'approved', 'rejected');
CREATE TYPE priority_type AS ENUM ('low', 'medium', 'high', 'critical', 'urgent');
CREATE TYPE git_status AS ENUM ('ordered', 'shipped', 'in_transit', 'delayed', 'arrived');
CREATE TYPE communication_category AS ENUM ('stock_request', 'budget_approval', 'forecast_inquiry', 'supply_chain', 'general', 'system_alert');
CREATE TYPE workflow_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'completed');

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'salesman',
    department TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    avatar_url TEXT
);

-- Create customers table
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    contact_person TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Create categories table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Create brands table
CREATE TABLE brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Create items table
CREATE TABLE items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) NOT NULL,
    brand_id UUID REFERENCES brands(id) NOT NULL,
    current_stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 1000,
    unit_price DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Create sales_budgets table
CREATE TABLE sales_budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) NOT NULL,
    item_id UUID REFERENCES items(id) NOT NULL,
    salesman_id UUID REFERENCES profiles(id) NOT NULL,
    budget_2025 INTEGER DEFAULT 0,
    actual_2025 INTEGER DEFAULT 0,
    budget_2026 INTEGER DEFAULT 0,
    rate DECIMAL(10,2) DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    git_quantity INTEGER DEFAULT 0,
    eta DATE,
    budget_value_2026 DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(5,2) DEFAULT 0,
    monthly_data JSONB DEFAULT '[]'::jsonb,
    status status_type DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id),
    notes TEXT,
    UNIQUE(customer_id, item_id, salesman_id)
);

-- Create rolling_forecasts table
CREATE TABLE rolling_forecasts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) NOT NULL,
    item_id UUID REFERENCES items(id) NOT NULL,
    salesman_id UUID REFERENCES profiles(id) NOT NULL,
    forecast_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    forecast_total INTEGER DEFAULT 0,
    budget_data JSONB DEFAULT '{}'::jsonb,
    status status_type DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id),
    notes TEXT,
    UNIQUE(customer_id, item_id, salesman_id)
);

-- Create git_items table (Goods In Transit)
CREATE TABLE git_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) NOT NULL,
    item_id UUID REFERENCES items(id) NOT NULL,
    git_quantity INTEGER NOT NULL DEFAULT 0,
    eta DATE,
    supplier TEXT,
    po_number TEXT,
    status git_status DEFAULT 'ordered',
    priority priority_type DEFAULT 'medium',
    tracking_number TEXT,
    estimated_value DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) NOT NULL
);

-- Create communications table
CREATE TABLE communications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_user_id UUID REFERENCES profiles(id) NOT NULL,
    to_user_id UUID REFERENCES profiles(id) NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    priority priority_type DEFAULT 'medium',
    category communication_category DEFAULT 'general',
    status workflow_status DEFAULT 'pending',
    is_read BOOLEAN DEFAULT false,
    reply_to_id UUID REFERENCES communications(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Create workflows table
CREATE TABLE workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status workflow_status DEFAULT 'pending',
    priority priority_type DEFAULT 'medium',
    assignee_id UUID REFERENCES profiles(id),
    created_by UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_department ON profiles(department);
CREATE INDEX idx_profiles_active ON profiles(is_active);

CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_customers_created_by ON customers(created_by);

CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_brand ON items(brand_id);
CREATE INDEX idx_items_stock ON items(current_stock);
CREATE INDEX idx_items_active ON items(is_active);

CREATE INDEX idx_sales_budgets_customer ON sales_budgets(customer_id);
CREATE INDEX idx_sales_budgets_item ON sales_budgets(item_id);
CREATE INDEX idx_sales_budgets_salesman ON sales_budgets(salesman_id);
CREATE INDEX idx_sales_budgets_status ON sales_budgets(status);
CREATE INDEX idx_sales_budgets_created_at ON sales_budgets(created_at DESC);

CREATE INDEX idx_rolling_forecasts_customer ON rolling_forecasts(customer_id);
CREATE INDEX idx_rolling_forecasts_item ON rolling_forecasts(item_id);
CREATE INDEX idx_rolling_forecasts_salesman ON rolling_forecasts(salesman_id);
CREATE INDEX idx_rolling_forecasts_status ON rolling_forecasts(status);
CREATE INDEX idx_rolling_forecasts_created_at ON rolling_forecasts(created_at DESC);

CREATE INDEX idx_git_items_customer ON git_items(customer_id);
CREATE INDEX idx_git_items_item ON git_items(item_id);
CREATE INDEX idx_git_items_status ON git_items(status);
CREATE INDEX idx_git_items_eta ON git_items(eta);
CREATE INDEX idx_git_items_priority ON git_items(priority);

CREATE INDEX idx_communications_from_user ON communications(from_user_id);
CREATE INDEX idx_communications_to_user ON communications(to_user_id);
CREATE INDEX idx_communications_status ON communications(status);
CREATE INDEX idx_communications_read ON communications(is_read);
CREATE INDEX idx_communications_created_at ON communications(created_at DESC);

CREATE INDEX idx_workflows_assignee ON workflows(assignee_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_priority ON workflows(priority);
CREATE INDEX idx_workflows_due_date ON workflows(due_date);

-- Create functions for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_budgets_updated_at BEFORE UPDATE ON sales_budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rolling_forecasts_updated_at BEFORE UPDATE ON rolling_forecasts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_git_items_updated_at BEFORE UPDATE ON git_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE rolling_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE git_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Users can read all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Customers: Salesmen can manage their own customers, managers/admins can see all
CREATE POLICY "Salesmen can manage their customers" ON customers
    FOR ALL USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
        )
    );

-- Categories and Brands: Read for all, write for admins
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Anyone can read brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Admins can manage brands" ON brands
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Items: Read for all, write for admins and supply_chain
CREATE POLICY "Anyone can read items" ON items FOR SELECT USING (true);
CREATE POLICY "Admins and supply chain can manage items" ON items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'supply_chain')
        )
    );

-- Sales Budgets: Salesmen own their data, managers can approve, admins can see all
CREATE POLICY "Salesmen can manage their budgets" ON sales_budgets
    FOR ALL USING (
        auth.uid() = salesman_id OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
        )
    );

-- Rolling Forecasts: Similar to sales budgets
CREATE POLICY "Salesmen can manage their forecasts" ON rolling_forecasts
    FOR ALL USING (
        auth.uid() = salesman_id OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
        )
    );

-- GIT Items: Supply chain and admins can manage, others can read
CREATE POLICY "Users can read git items" ON git_items FOR SELECT USING (true);
CREATE POLICY "Supply chain and admins can manage git items" ON git_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'supply_chain')
        )
    );

-- Communications: Users can see messages sent to them or from them
CREATE POLICY "Users can manage their communications" ON communications
    FOR ALL USING (
        auth.uid() = from_user_id OR 
        auth.uid() = to_user_id OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Workflows: Users can see workflows assigned to them or created by them
CREATE POLICY "Users can manage relevant workflows" ON workflows
    FOR ALL USING (
        auth.uid() = assignee_id OR 
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
        )
    );

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role, department)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'salesman'),
        COALESCE(NEW.raw_user_meta_data->>'department', 'Sales')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
