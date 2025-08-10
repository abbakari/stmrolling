-- COMPLETE SAMPLE DATA FOR STM BUDGET SYSTEM
-- This includes user creation instructions and all sample data

-- ====================================
-- STEP 1: CREATE USERS FIRST
-- ====================================
-- Go to your Supabase Auth dashboard or use the signup form in your app
-- Create these exact users with these credentials:

/*
USER CREDENTIALS TO CREATE:

1. ADMIN USER:
   Email: admin@stmbudget.com
   Password: Admin123!
   Name: System Administrator
   Role: admin
   Department: IT

2. MANAGER USER:
   Email: manager@stmbudget.com
   Password: Manager123!
   Name: Sarah Johnson
   Role: manager
   Department: Sales

3. SALESMAN USER 1:
   Email: john@stmbudget.com
   Password: Sales123!
   Name: John Mwangi
   Role: salesman
   Department: Sales

4. SALESMAN USER 2:
   Email: jane@stmbudget.com
   Password: Sales123!
   Name: Jane Doe
   Role: salesman
   Department: Sales

5. SUPPLY CHAIN USER:
   Email: supply@stmbudget.com
   Password: Supply123!
   Name: Ahmed Hassan
   Role: supply_chain
   Department: Supply Chain

INSTRUCTIONS:
- Use the app's signup form at /login (click "Don't have an account? Sign up")
- OR create via Supabase Auth dashboard
- Make sure to use the EXACT emails and roles above
*/

-- ====================================
-- STEP 2: RUN THIS SQL AFTER USERS ARE CREATED
-- ====================================

-- Wait for users to be created and profiles to be populated by the trigger
-- Then run the following sample data:

-- Insert sample categories
INSERT INTO categories (id, name, description, created_by, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'TYRE SERVICE', 'All types of tires and tire-related services', 
 (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'), true),
('550e8400-e29b-41d4-a716-446655440002', 'AUTOMOTIVE PARTS', 'Car parts and automotive accessories', 
 (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'), true),
('550e8400-e29b-41d4-a716-446655440003', 'ELECTRONICS', 'Electronic components and devices', 
 (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'), true),
('550e8400-e29b-41d4-a716-446655440004', 'ACCESSORIES', 'Vehicle accessories and add-ons', 
 (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'), true),
('550e8400-e29b-41d4-a716-446655440005', 'LUBRICANTS', 'Oils, greases, and lubricants', 
 (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'), true);

-- Insert sample brands
INSERT INTO brands (id, name, description, created_by, is_active) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'BF GOODRICH', 'Premium tire manufacturer', 
 (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'), true),
('660e8400-e29b-41d4-a716-446655440002', 'MICHELIN', 'Leading tire and rubber company', 
 (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'), true),
('660e8400-e29b-41d4-a716-446655440003', 'CONTINENTAL', 'German automotive parts manufacturer', 
 (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'), true),
('660e8400-e29b-41d4-a716-446655440004', 'BRIDGESTONE', 'Japanese tire manufacturer', 
 (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'), true),
('660e8400-e29b-41d4-a716-446655440005', 'GENERAL', 'General automotive brand', 
 (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'), true);

-- Insert sample customers
INSERT INTO customers (id, name, email, phone, address, contact_person, created_by, is_active) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Action Aid International (Tz)', 'procurement@actionaid.tz', '+255-22-2123456', 
 'Dar es Salaam, Tanzania', 'John Mwangi', 
 (SELECT id FROM profiles WHERE email = 'john@stmbudget.com'), true),
('770e8400-e29b-41d4-a716-446655440002', 'ADVENT CONSTRUCTION LTD.', 'supplies@adventconstruction.com', '+255-22-2234567', 
 'Dodoma, Tanzania', 'Sarah Johnson', 
 (SELECT id FROM profiles WHERE email = 'john@stmbudget.com'), true),
('770e8400-e29b-41d4-a716-446655440003', 'Mwanza Transport Co.', 'fleet@mwanzatransport.tz', '+255-28-2345678', 
 'Mwanza, Tanzania', 'Ahmed Hassan', 
 (SELECT id FROM profiles WHERE email = 'jane@stmbudget.com'), true),
('770e8400-e29b-41d4-a716-446655440004', 'Kilimanjaro Mining Corp', 'procurement@kilimining.co.tz', '+255-27-2456789', 
 'Moshi, Tanzania', 'Grace Mollel', 
 (SELECT id FROM profiles WHERE email = 'jane@stmbudget.com'), true),
('770e8400-e29b-41d4-a716-446655440005', 'Zanzibar Logistics Ltd', 'operations@zanzibarlogistics.com', '+255-24-2567890', 
 'Stone Town, Zanzibar', 'Omar Ali', 
 (SELECT id FROM profiles WHERE email = 'john@stmbudget.com'), true);

-- Insert sample items/products
INSERT INTO items (id, name, description, category_id, brand_id, current_stock, min_stock_level, max_stock_level, unit_price, created_by, is_active) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'BF GOODRICH TYRE 235/85R16 120/116S TL ATT/A KO2 LRERWLGO', 
 'All-terrain tire for heavy-duty vehicles', 
 '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 
 150, 20, 500, 295.00, 
 (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com'), true),
('880e8400-e29b-41d4-a716-446655440002', 'MICHELIN TYRE 265/65R17 112T TL LTX TRAIL', 
 'Premium SUV tire for on-road performance', 
 '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 
 85, 15, 300, 320.00, 
 (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com'), true),
('880e8400-e29b-41d4-a716-446655440003', 'WHEEL BALANCE ALLOYD RIMS', 
 'Alloy wheel balancing service', 
 '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440005', 
 75, 10, 200, 85.00, 
 (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com'), true),
('880e8400-e29b-41d4-a716-446655440004', 'CONTINENTAL BRAKE PADS SET', 
 'High-performance brake pads', 
 '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 
 120, 25, 400, 125.00, 
 (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com'), true),
('880e8400-e29b-41d4-a716-446655440005', 'BRIDGESTONE TYRE 225/70R16', 
 'Standard passenger car tire', 
 '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 
 200, 30, 600, 180.00, 
 (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com'), true),
('880e8400-e29b-41d4-a716-446655440006', 'ENGINE OIL SYNTHETIC 5W-30', 
 'High-quality synthetic engine oil', 
 '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 
 300, 50, 800, 45.00, 
 (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com'), true);

-- Insert sample sales budgets
INSERT INTO sales_budgets (id, customer_id, item_id, salesman_id, budget_2025, actual_2025, budget_2026, rate, current_stock, git_quantity, eta, budget_value_2026, discount, monthly_data, status, notes) VALUES
('990e8400-e29b-41d4-a716-446655440001', 
 '770e8400-e29b-41d4-a716-446655440001', 
 '880e8400-e29b-41d4-a716-446655440001', 
 (SELECT id FROM profiles WHERE email = 'john@stmbudget.com'), 
 100, 85, 120, 295.00, 150, 50, '2025-09-15', 35400.00, 5.00, 
 '[{"month":"Jan","budgetValue":3000,"actualValue":2800,"rate":295,"stock":150,"git":50,"discount":5},
   {"month":"Feb","budgetValue":3200,"actualValue":3100,"rate":295,"stock":145,"git":45,"discount":5},
   {"month":"Mar","budgetValue":2800,"actualValue":2650,"rate":295,"stock":140,"git":40,"discount":5}]'::jsonb, 
 'draft', 'Strong customer relationship, potential for growth'),

('990e8400-e29b-41d4-a716-446655440002', 
 '770e8400-e29b-41d4-a716-446655440002', 
 '880e8400-e29b-41d4-a716-446655440002', 
 (SELECT id FROM profiles WHERE email = 'john@stmbudget.com'), 
 80, 75, 95, 320.00, 85, 25, '2025-08-24', 30400.00, 3.00, 
 '[{"month":"Jan","budgetValue":2500,"actualValue":2400,"rate":320,"stock":85,"git":25,"discount":3},
   {"month":"Feb","budgetValue":2700,"actualValue":2600,"rate":320,"stock":80,"git":20,"discount":3}]'::jsonb, 
 'saved', 'Premium customer, consistent orders'),

('990e8400-e29b-41d4-a716-446655440003', 
 '770e8400-e29b-41d4-a716-446655440003', 
 '880e8400-e29b-41d4-a716-446655440005', 
 (SELECT id FROM profiles WHERE email = 'jane@stmbudget.com'), 
 150, 140, 180, 180.00, 200, 75, '2025-10-01', 32400.00, 7.00, 
 '[{"month":"Jan","budgetValue":2700,"actualValue":2550,"rate":180,"stock":200,"git":75,"discount":7},
   {"month":"Feb","budgetValue":2900,"actualValue":2800,"rate":180,"stock":195,"git":70,"discount":7}]'::jsonb, 
 'submitted', 'Large fleet customer, seasonal variations'),

('990e8400-e29b-41d4-a716-446655440004', 
 '770e8400-e29b-41d4-a716-446655440004', 
 '880e8400-e29b-41d4-a716-446655440004', 
 (SELECT id FROM profiles WHERE email = 'jane@stmbudget.com'), 
 60, 55, 75, 125.00, 120, 30, '2025-11-15', 9375.00, 4.00, 
 '[{"month":"Jan","budgetValue":780,"actualValue":750,"rate":125,"stock":120,"git":30,"discount":4}]'::jsonb, 
 'approved', 'Mining equipment parts - approved by manager'),

('990e8400-e29b-41d4-a716-446655440005', 
 '770e8400-e29b-41d4-a716-446655440005', 
 '880e8400-e29b-41d4-a716-446655440006', 
 (SELECT id FROM profiles WHERE email = 'john@stmbudget.com'), 
 200, 185, 250, 45.00, 300, 100, '2025-07-30', 11250.00, 8.00, 
 '[{"month":"Jan","budgetValue":937,"actualValue":900,"rate":45,"stock":300,"git":100,"discount":8}]'::jsonb, 
 'draft', 'Lubricants for logistics fleet');

-- Insert sample rolling forecasts
INSERT INTO rolling_forecasts (id, customer_id, item_id, salesman_id, forecast_data, forecast_total, budget_data, status, notes) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', 
 '770e8400-e29b-41d4-a716-446655440001', 
 '880e8400-e29b-41d4-a716-446655440001', 
 (SELECT id FROM profiles WHERE email = 'john@stmbudget.com'), 
 '{"Q1":30,"Q2":35,"Q3":40,"Q4":35}'::jsonb, 140, 
 '{"bud25":100,"ytd25":85,"budget2026":120,"rate":295,"stock":150,"git":50,"budgetValue2026":35400,"discount":5}'::jsonb, 
 'draft', 'Forecast based on historical data and market trends'),

('aa0e8400-e29b-41d4-a716-446655440002', 
 '770e8400-e29b-41d4-a716-446655440002', 
 '880e8400-e29b-41d4-a716-446655440002', 
 (SELECT id FROM profiles WHERE email = 'john@stmbudget.com'), 
 '{"Q1":25,"Q2":28,"Q3":22,"Q4":30}'::jsonb, 105, 
 '{"bud25":80,"ytd25":75,"budget2026":95,"rate":320,"stock":85,"git":25,"budgetValue2026":30400,"discount":3}'::jsonb, 
 'saved', 'Conservative forecast due to market uncertainty'),

('aa0e8400-e29b-41d4-a716-446655440003', 
 '770e8400-e29b-41d4-a716-446655440003', 
 '880e8400-e29b-41d4-a716-446655440005', 
 (SELECT id FROM profiles WHERE email = 'jane@stmbudget.com'), 
 '{"Q1":45,"Q2":50,"Q3":42,"Q4":48}'::jsonb, 185, 
 '{"bud25":150,"ytd25":140,"budget2026":180,"rate":180,"stock":200,"git":75,"budgetValue2026":32400,"discount":7}'::jsonb, 
 'submitted', 'Aggressive growth forecast for transport sector');

-- Insert sample GIT (Goods in Transit) items
INSERT INTO git_items (id, customer_id, item_id, git_quantity, eta, supplier, po_number, status, priority, tracking_number, estimated_value, notes, created_by) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', 
 '770e8400-e29b-41d4-a716-446655440001', 
 '880e8400-e29b-41d4-a716-446655440001', 
 50, '2025-09-15', 'BF Goodrich Tanzania', 'PO-2025-001', 'in_transit', 'high', 'TRK-BFG-001', 14750.00, 
 'Urgent delivery for Q3 targets', 
 (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com')),

('bb0e8400-e29b-41d4-a716-446655440002', 
 '770e8400-e29b-41d4-a716-446655440002', 
 '880e8400-e29b-41d4-a716-446655440002', 
 25, '2025-08-24', 'Michelin East Africa', 'PO-2025-002', 'shipped', 'medium', 'TRK-MCH-002', 8000.00, 
 'Premium tire delivery for construction project', 
 (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com')),

('bb0e8400-e29b-41d4-a716-446655440003', 
 '770e8400-e29b-41d4-a716-446655440003', 
 '880e8400-e29b-41d4-a716-446655440003', 
 75, '2025-10-01', 'Wheel Balance Co.', 'PO-2025-003', 'ordered', 'low', '', 6375.00, 
 'Standard delivery schedule for wheel services', 
 (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com')),

('bb0e8400-e29b-41d4-a716-446655440004', 
 '770e8400-e29b-41d4-a716-446655440004', 
 '880e8400-e29b-41d4-a716-446655440004', 
 30, '2025-11-15', 'Continental Tanzania', 'PO-2025-004', 'delayed', 'urgent', 'TRK-CONT-004', 3750.00, 
 'Delayed due to customs clearance', 
 (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com')),

('bb0e8400-e29b-41d4-a716-446655440005', 
 '770e8400-e29b-41d4-a716-446655440005', 
 '880e8400-e29b-41d4-a716-446655440006', 
 100, '2025-07-30', 'Oil Suppliers Ltd', 'PO-2025-005', 'arrived', 'medium', 'TRK-OIL-005', 4500.00, 
 'Lubricants delivery completed successfully', 
 (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com'));

-- Insert sample communications
INSERT INTO communications (id, from_user_id, to_user_id, subject, message, priority, category, status, is_read) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', 
 (SELECT id FROM profiles WHERE email = 'john@stmbudget.com'), 
 (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'), 
 'Urgent: Stock Request for BF Goodrich Tyres', 
 'Hi Admin,

I need urgent stock replenishment for BF Goodrich tyres. Current situation:

- Current Stock: 150 units
- Customer orders pending: 50 units  
- Expected delivery date needed: Next week

This is affecting our ability to meet customer commitments. Please prioritize this request.

Best regards,
John Mwangi', 
 'high', 'stock_request', 'pending', false),

('cc0e8400-e29b-41d4-a716-446655440002', 
 (SELECT id FROM profiles WHERE email = 'manager@stmbudget.com'), 
 (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'), 
 'Budget Approval Request - Q1 2026', 
 'Hello Admin,

Please review and approve the following budget submissions:

📋 Summary:
- Total submissions: 5 budgets
- Total value: $118,825
- Submitted by: Sales team
- Review period: Q1 2026

🔍 Key highlights:
- BF Goodrich products: $35,400 (30%)
- Michelin products: $30,400 (26%)  
- Other products: $53,025 (44%)

All budgets have been reviewed and approved at manager level. Awaiting final admin approval for implementation.

Time-sensitive: Customer commitments are pending these approvals.

Best regards,
Sarah Johnson', 
 'medium', 'budget_approval', 'pending', false),

('cc0e8400-e29b-41d4-a716-446655440003', 
 (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com'), 
 (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'), 
 'GIT Status Update - Continental Delay', 
 'Hi Admin,

Update on Continental brake pads shipment:

🚛 Shipment Details:
- Product: Continental Brake Pads Set
- Quantity: 30 units
- Original ETA: November 15th
- Issue: Delayed due to customs clearance

📍 Current Status:
- Customs clearance: In progress
- Expected resolution: 2-3 days
- Revised ETA: November 18th

⚠️ Impact:
- Affects Kilimanjaro Mining Corp order
- Customer has been notified

Please advise on any additional actions needed.

Best regards,
Ahmed Hassan', 
 'medium', 'supply_chain', 'pending', false),

('cc0e8400-e29b-41d4-a716-446655440004', 
 (SELECT id FROM profiles WHERE email = 'jane@stmbudget.com'), 
 (SELECT id FROM profiles WHERE email = 'manager@stmbudget.com'), 
 'Forecast Revision Request - Transport Sector', 
 'Hi Sarah,

I need to revise my forecast for Mwanza Transport Co:

❓ Updates needed:
1. Q2 forecast increase from 50 to 65 units (30% growth)
2. New tire specifications requested by customer
3. Potential contract extension discussion

📊 Current Status:
- Q1 performance: Exceeding expectations
- Customer satisfaction: Very high
- Competition: Minimal in their region

This account has significant growth potential. Please advise on forecast adjustment approval.

Thanks,
Jane Doe', 
 'medium', 'forecast_inquiry', 'pending', false);

-- Insert sample workflows
INSERT INTO workflows (id, title, description, status, priority, assignee_id, created_by, due_date, metadata) VALUES
('dd0e8400-e29b-41d4-a716-446655440001', 
 'Q1 2026 Budget Approval Process', 
 'Review and approve sales budgets for Q1 2026', 
 'pending', 'high', 
 (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'), 
 (SELECT id FROM profiles WHERE email = 'manager@stmbudget.com'), 
 '2025-12-31', 
 '{"budgetCount":5,"totalValue":118825,"department":"Sales","submittedBy":["john@stmbudget.com","jane@stmbudget.com"]}'::jsonb),

('dd0e8400-e29b-41d4-a716-446655440002', 
 'Stock Replenishment Review', 
 'Evaluate and process stock replenishment requests', 
 'in_review', 'medium', 
 (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com'), 
 (SELECT id FROM profiles WHERE email = 'john@stmbudget.com'), 
 '2025-02-15', 
 '{"itemsRequested":3,"urgentItems":1,"estimatedCost":25000,"requestedBy":"john@stmbudget.com"}'::jsonb),

('dd0e8400-e29b-41d4-a716-446655440003', 
 'Customs Clearance Follow-up', 
 'Resolve delayed shipment customs issues', 
 'pending', 'urgent', 
 (SELECT id FROM profiles WHERE email = 'admin@stmbudget.com'), 
 (SELECT id FROM profiles WHERE email = 'supply@stmbudget.com'), 
 '2025-11-18', 
 '{"shipmentId":"bb0e8400-e29b-41d4-a716-446655440004","affectedCustomer":"Kilimanjaro Mining Corp","delayDays":3}'::jsonb);

-- Verify data was inserted correctly
SELECT 'Data insertion completed successfully!' as status;

-- Show summary of created data
SELECT 
  'Users' as entity_type,
  COUNT(*) as count
FROM profiles
UNION ALL
SELECT 'Customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories  
UNION ALL
SELECT 'Brands', COUNT(*) FROM brands
UNION ALL
SELECT 'Items', COUNT(*) FROM items
UNION ALL
SELECT 'Sales Budgets', COUNT(*) FROM sales_budgets
UNION ALL
SELECT 'Rolling Forecasts', COUNT(*) FROM rolling_forecasts
UNION ALL
SELECT 'GIT Items', COUNT(*) FROM git_items
UNION ALL
SELECT 'Communications', COUNT(*) FROM communications
UNION ALL
SELECT 'Workflows', COUNT(*) FROM workflows;
