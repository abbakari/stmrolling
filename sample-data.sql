-- Sample Data for STM Budget System
-- Run this after creating the main schema

-- Insert sample categories
INSERT INTO categories (id, name, description, created_by, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'TYRE SERVICE', 'All types of tires and tire-related services', (SELECT id FROM auth.users LIMIT 1), true),
('550e8400-e29b-41d4-a716-446655440002', 'AUTOMOTIVE PARTS', 'Car parts and automotive accessories', (SELECT id FROM auth.users LIMIT 1), true),
('550e8400-e29b-41d4-a716-446655440003', 'ELECTRONICS', 'Electronic components and devices', (SELECT id FROM auth.users LIMIT 1), true),
('550e8400-e29b-41d4-a716-446655440004', 'ACCESSORIES', 'Vehicle accessories and add-ons', (SELECT id FROM auth.users LIMIT 1), true),
('550e8400-e29b-41d4-a716-446655440005', 'LUBRICANTS', 'Oils, greases, and lubricants', (SELECT id FROM auth.users LIMIT 1), true);

-- Insert sample brands
INSERT INTO brands (id, name, description, created_by, is_active) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'BF GOODRICH', 'Premium tire manufacturer', (SELECT id FROM auth.users LIMIT 1), true),
('660e8400-e29b-41d4-a716-446655440002', 'MICHELIN', 'Leading tire and rubber company', (SELECT id FROM auth.users LIMIT 1), true),
('660e8400-e29b-41d4-a716-446655440003', 'CONTINENTAL', 'German automotive parts manufacturer', (SELECT id FROM auth.users LIMIT 1), true),
('660e8400-e29b-41d4-a716-446655440004', 'BRIDGESTONE', 'Japanese tire manufacturer', (SELECT id FROM auth.users LIMIT 1), true),
('660e8400-e29b-41d4-a716-446655440005', 'GENERAL', 'General automotive brand', (SELECT id FROM auth.users LIMIT 1), true);

-- Note: You'll need to create users first through the application's sign-up process
-- The following assumes users have been created through Supabase Auth

-- Sample profiles will be created automatically via trigger when users sign up
-- But here's sample data for after users are created:

-- Sample customers (these can be inserted after at least one user exists)
INSERT INTO customers (id, name, email, phone, address, contact_person, created_by, is_active) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Action Aid International (Tz)', 'procurement@actionaid.tz', '+255-22-2123456', 'Dar es Salaam, Tanzania', 'John Mwangi', (SELECT id FROM profiles WHERE role = 'salesman' LIMIT 1), true),
('770e8400-e29b-41d4-a716-446655440002', 'ADVENT CONSTRUCTION LTD.', 'supplies@adventconstruction.com', '+255-22-2234567', 'Dodoma, Tanzania', 'Sarah Johnson', (SELECT id FROM profiles WHERE role = 'salesman' LIMIT 1), true),
('770e8400-e29b-41d4-a716-446655440003', 'Mwanza Transport Co.', 'fleet@mwanzatransport.tz', '+255-28-2345678', 'Mwanza, Tanzania', 'Ahmed Hassan', (SELECT id FROM profiles WHERE role = 'salesman' LIMIT 1), true),
('770e8400-e29b-41d4-a716-446655440004', 'Kilimanjaro Mining Corp', 'procurement@kilimining.co.tz', '+255-27-2456789', 'Moshi, Tanzania', 'Grace Mollel', (SELECT id FROM profiles WHERE role = 'salesman' LIMIT 1), true),
('770e8400-e29b-41d4-a716-446655440005', 'Zanzibar Logistics Ltd', 'operations@zanzibarlogistics.com', '+255-24-2567890', 'Stone Town, Zanzibar', 'Omar Ali', (SELECT id FROM profiles WHERE role = 'salesman' LIMIT 1), true);

-- Sample items/products
INSERT INTO items (id, name, description, category_id, brand_id, current_stock, min_stock_level, max_stock_level, unit_price, created_by, is_active) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'BF GOODRICH TYRE 235/85R16 120/116S TL ATT/A KO2 LRERWLGO', 'All-terrain tire for heavy-duty vehicles', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 150, 20, 500, 295.00, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), true),
('880e8400-e29b-41d4-a716-446655440002', 'MICHELIN TYRE 265/65R17 112T TL LTX TRAIL', 'Premium SUV tire for on-road performance', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 85, 15, 300, 320.00, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), true),
('880e8400-e29b-41d4-a716-446655440003', 'WHEEL BALANCE ALLOYD RIMS', 'Alloy wheel balancing service', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440005', 75, 10, 200, 85.00, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), true),
('880e8400-e29b-41d4-a716-446655440004', 'CONTINENTAL BRAKE PADS SET', 'High-performance brake pads', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 120, 25, 400, 125.00, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), true),
('880e8400-e29b-41d4-a716-446655440005', 'BRIDGESTONE TYRE 225/70R16', 'Standard passenger car tire', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 200, 30, 600, 180.00, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), true);

-- Sample sales budgets (will be created after users exist)
INSERT INTO sales_budgets (id, customer_id, item_id, salesman_id, budget_2025, actual_2025, budget_2026, rate, current_stock, git_quantity, eta, budget_value_2026, discount, monthly_data, status, notes) VALUES
('990e8400-e29b-41d4-a716-446655440001', 
 '770e8400-e29b-41d4-a716-446655440001', 
 '880e8400-e29b-41d4-a716-446655440001', 
 (SELECT id FROM profiles WHERE role = 'salesman' LIMIT 1), 
 100, 85, 120, 295.00, 150, 50, '2025-09-15', 35400.00, 5.00, 
 '[{"month":"Jan","budgetValue":3000,"actualValue":2800,"rate":295,"stock":150,"git":50,"discount":5},
   {"month":"Feb","budgetValue":3200,"actualValue":3100,"rate":295,"stock":145,"git":45,"discount":5},
   {"month":"Mar","budgetValue":2800,"actualValue":2650,"rate":295,"stock":140,"git":40,"discount":5}]'::jsonb, 
 'draft', 'Strong customer relationship, potential for growth'),

('990e8400-e29b-41d4-a716-446655440002', 
 '770e8400-e29b-41d4-a716-446655440002', 
 '880e8400-e29b-41d4-a716-446655440002', 
 (SELECT id FROM profiles WHERE role = 'salesman' LIMIT 1), 
 80, 75, 95, 320.00, 85, 25, '2025-08-24', 30400.00, 3.00, 
 '[{"month":"Jan","budgetValue":2500,"actualValue":2400,"rate":320,"stock":85,"git":25,"discount":3},
   {"month":"Feb","budgetValue":2700,"actualValue":2600,"rate":320,"stock":80,"git":20,"discount":3}]'::jsonb, 
 'saved', 'Premium customer, consistent orders'),

('990e8400-e29b-41d4-a716-446655440003', 
 '770e8400-e29b-41d4-a716-446655440003', 
 '880e8400-e29b-41d4-a716-446655440005', 
 (SELECT id FROM profiles WHERE role = 'salesman' LIMIT 1), 
 150, 140, 180, 180.00, 200, 75, '2025-10-01', 32400.00, 7.00, 
 '[{"month":"Jan","budgetValue":2700,"actualValue":2550,"rate":180,"stock":200,"git":75,"discount":7}]'::jsonb, 
 'submitted', 'Large fleet customer, seasonal variations');

-- Sample rolling forecasts
INSERT INTO rolling_forecasts (id, customer_id, item_id, salesman_id, forecast_data, forecast_total, budget_data, status, notes) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', 
 '770e8400-e29b-41d4-a716-446655440001', 
 '880e8400-e29b-41d4-a716-446655440001', 
 (SELECT id FROM profiles WHERE role = 'salesman' LIMIT 1), 
 '{"Q1":30,"Q2":35,"Q3":40,"Q4":35}'::jsonb, 140, 
 '{"bud25":100,"ytd25":85,"budget2026":120,"rate":295,"stock":150,"git":50,"budgetValue2026":35400,"discount":5}'::jsonb, 
 'draft', 'Forecast based on historical data and market trends'),

('aa0e8400-e29b-41d4-a716-446655440002', 
 '770e8400-e29b-41d4-a716-446655440002', 
 '880e8400-e29b-41d4-a716-446655440002', 
 (SELECT id FROM profiles WHERE role = 'salesman' LIMIT 1), 
 '{"Q1":25,"Q2":28,"Q3":22,"Q4":30}'::jsonb, 105, 
 '{"bud25":80,"ytd25":75,"budget2026":95,"rate":320,"stock":85,"git":25,"budgetValue2026":30400,"discount":3}'::jsonb, 
 'saved', 'Conservative forecast due to market uncertainty');

-- Sample GIT (Goods in Transit) items
INSERT INTO git_items (id, customer_id, item_id, git_quantity, eta, supplier, po_number, status, priority, tracking_number, estimated_value, notes, created_by) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', 
 '770e8400-e29b-41d4-a716-446655440001', 
 '880e8400-e29b-41d4-a716-446655440001', 
 50, '2025-09-15', 'BF Goodrich Tanzania', 'PO-2025-001', 'in_transit', 'high', 'TRK-BFG-001', 14750.00, 
 'Urgent delivery for Q3 targets', (SELECT id FROM profiles WHERE role = 'supply_chain' LIMIT 1)),

('bb0e8400-e29b-41d4-a716-446655440002', 
 '770e8400-e29b-41d4-a716-446655440002', 
 '880e8400-e29b-41d4-a716-446655440002', 
 25, '2025-08-24', 'Michelin East Africa', 'PO-2025-002', 'shipped', 'medium', 'TRK-MCH-002', 8000.00, 
 'Premium tire delivery', (SELECT id FROM profiles WHERE role = 'supply_chain' LIMIT 1)),

('bb0e8400-e29b-41d4-a716-446655440003', 
 '770e8400-e29b-41d4-a716-446655440003', 
 '880e8400-e29b-41d4-a716-446655440003', 
 75, '2025-10-01', 'Wheel Balance Co.', 'PO-2025-003', 'ordered', 'low', '', 6375.00, 
 'Standard delivery schedule', (SELECT id FROM profiles WHERE role = 'supply_chain' LIMIT 1));

-- Sample communications (will need actual user IDs)
INSERT INTO communications (id, from_user_id, to_user_id, subject, message, priority, category, status, is_read) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', 
 (SELECT id FROM profiles WHERE role = 'salesman' LIMIT 1), 
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), 
 'Urgent: Stock Request for BF Goodrich Tyres', 
 'Hi Admin,

I need urgent stock replenishment for BF Goodrich tyres. Current situation:

- Current Stock: 150 units
- Customer orders pending: 50 units  
- Expected delivery date needed: Next week

This is affecting our ability to meet customer commitments. Please prioritize this request.

Best regards,
Sales Team', 
 'high', 'stock_request', 'pending', false),

('cc0e8400-e29b-41d4-a716-446655440002', 
 (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1), 
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), 
 'Budget Approval Request - Q1 2026', 
 'Hello Admin,

Please review and approve the following budget submissions:

📋 Summary:
- Total submissions: 3 budgets
- Total value: $98,200
- Submitted by: Sales team
- Review period: Q1 2026

🔍 Key highlights:
- BF Goodrich products: $35,400 (36%)
- Michelin products: $30,400 (31%)  
- Other products: $32,400 (33%)

All budgets have been reviewed and approved at manager level. Awaiting final admin approval for implementation.

Time-sensitive: Customer commitments are pending these approvals.

Best regards,
Management Team', 
 'medium', 'budget_approval', 'pending', false);

-- Sample workflows
INSERT INTO workflows (id, title, description, status, priority, assignee_id, created_by, due_date, metadata) VALUES
('dd0e8400-e29b-41d4-a716-446655440001', 
 'Q1 2026 Budget Approval Process', 
 'Review and approve sales budgets for Q1 2026', 
 'pending', 'high', 
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), 
 (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1), 
 '2025-12-31', 
 '{"budgetCount":3,"totalValue":98200,"department":"Sales"}'::jsonb),

('dd0e8400-e29b-41d4-a716-446655440002', 
 'Stock Replenishment Review', 
 'Evaluate and process stock replenishment requests', 
 'in_review', 'medium', 
 (SELECT id FROM profiles WHERE role = 'supply_chain' LIMIT 1), 
 (SELECT id FROM profiles WHERE role = 'salesman' LIMIT 1), 
 '2025-02-15', 
 '{"itemsRequested":5,"urgentItems":2,"estimatedCost":50000}'::jsonb);

-- Instructions for creating users:
/*
To create sample users, you need to sign up through the application UI or use Supabase Auth API.
Here are the suggested sample users to create:

1. ADMIN USER:
   - Email: admin@stmbudget.com
   - Password: Admin123!
   - Name: System Administrator
   - Role: admin
   - Department: IT

2. MANAGER USER:
   - Email: manager@stmbudget.com
   - Password: Manager123!
   - Name: Sarah Johnson
   - Role: manager
   - Department: Sales

3. SALESMAN USER:
   - Email: salesman@stmbudget.com
   - Password: Sales123!
   - Name: John Mwangi
   - Role: salesman
   - Department: Sales

4. SUPPLY CHAIN USER:
   - Email: supply@stmbudget.com
   - Password: Supply123!
   - Name: Ahmed Hassan
   - Role: supply_chain
   - Department: Supply Chain

After creating these users through the sign-up process, the above sample data will work correctly.
The profiles table will be automatically populated via the trigger when users sign up.
*/

-- Update sample data to use actual user IDs (run this after creating users)
/*
-- Example of how to update with real user IDs after sign-up:

UPDATE customers SET created_by = (SELECT id FROM profiles WHERE email = 'salesman@stmbudget.com');
UPDATE items SET created_by = (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com');
UPDATE sales_budgets SET salesman_id = (SELECT id FROM profiles WHERE email = 'salesman@stmbudget.com');
UPDATE rolling_forecasts SET salesman_id = (SELECT id FROM profiles WHERE email = 'salesman@stmbudget.com');
UPDATE git_items SET created_by = (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com');

-- Update communications with real user IDs
UPDATE communications SET 
  from_user_id = (SELECT id FROM profiles WHERE email = 'salesman@stmbudget.com'),
  to_user_id = (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com')
WHERE subject LIKE '%Stock Request%';

UPDATE communications SET 
  from_user_id = (SELECT id FROM profiles WHERE email = 'manager@stmbudget.com'),
  to_user_id = (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com')
WHERE subject LIKE '%Budget Approval%';

-- Update workflows with real user IDs
UPDATE workflows SET 
  assignee_id = (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'),
  created_by = (SELECT id FROM profiles WHERE email = 'manager@stmbudget.com')
WHERE title LIKE '%Budget Approval%';

UPDATE workflows SET 
  assignee_id = (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com'),
  created_by = (SELECT id FROM profiles WHERE email = 'salesman@stmbudget.com')
WHERE title LIKE '%Stock Replenishment%';
*/
