-- ============================================================================
-- SEED DATA: Kenyan Automotive Market Taxonomy & Initial Configuration
-- ============================================================================

BEGIN;

-- 1. Initial Showroom
INSERT INTO public.showrooms (id, name, slug, city, address, phone, whatsapp_number, opening_hours, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001', 
  'Nairobi Flagship', 
  'nairobi-flagship', 
  'Nairobi', 
  'Ngong Road, Nairobi', 
  '+254700000000', 
  '254700000000', 
  'Mon-Sat: 8:00 AM - 6:00 PM',
  true
) ON CONFLICT (id) DO NOTHING;

-- 2. Popular Makes
INSERT INTO public.makes (id, name, slug, is_popular, display_order) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Toyota', 'toyota', true, 1),
  ('20000000-0000-0000-0000-000000000002', 'Nissan', 'nissan', true, 2),
  ('20000000-0000-0000-0000-000000000003', 'Subaru', 'subaru', true, 3),
  ('20000000-0000-0000-0000-000000000004', 'Honda', 'honda', true, 4),
  ('20000000-0000-0000-0000-000000000005', 'Mazda', 'mazda', true, 5),
  ('20000000-0000-0000-0000-000000000006', 'Mercedes-Benz', 'mercedes-benz', true, 6),
  ('20000000-0000-0000-0000-000000000007', 'BMW', 'bmw', false, 7),
  ('20000000-0000-0000-0000-000000000008', 'Volkswagen', 'volkswagen', true, 8),
  ('20000000-0000-0000-0000-000000000009', 'Lexus', 'lexus', false, 9),
  ('20000000-0000-0000-0000-000000000010', 'Mitsubishi', 'mitsubishi', false, 10),
  ('20000000-0000-0000-0000-000000000011', 'Suzuki', 'suzuki', false, 11),
  ('20000000-0000-0000-0000-000000000012', 'Land Rover', 'land-rover', false, 12)
ON CONFLICT (id) DO NOTHING;

-- 3. Popular Models (Linked to Makes via ID)
-- Toyota Models
INSERT INTO public.models (make_id, name, slug, default_body_type) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Harrier', 'harrier', 'SUV'),
  ('20000000-0000-0000-0000-000000000001', 'Prado', 'prado', 'SUV'),
  ('20000000-0000-0000-0000-000000000001', 'Vanguard', 'vanguard', 'SUV'),
  ('20000000-0000-0000-0000-000000000001', 'Fielder', 'fielder', 'Station Wagon'),
  ('20000000-0000-0000-0000-000000000001', 'Axio', 'axio', 'Saloon'),
  ('20000000-0000-0000-0000-000000000001', 'Vitz', 'vitz', 'Hatchback'),
  ('20000000-0000-0000-0000-000000000001', 'Probox', 'probox', 'Station Wagon'),
  ('20000000-0000-0000-0000-000000000001', 'Sienta', 'sienta', 'Mini-Van'),
  ('20000000-0000-0000-0000-000000000001', 'Hilux', 'hilux', 'Pickup'),
  ('20000000-0000-0000-0000-000000000001', 'Land Cruiser V8', 'land-cruiser-v8', 'SUV'),
-- Nissan Models
  ('20000000-0000-0000-0000-000000000002', 'Note', 'note', 'Hatchback'),
  ('20000000-0000-0000-0000-000000000002', 'X-Trail', 'x-trail', 'SUV'),
  ('20000000-0000-0000-0000-000000000002', 'Juke', 'juke', 'Crossover'),
  ('20000000-0000-0000-0000-000000000002', 'Navara', 'navara', 'Pickup'),
-- Subaru Models
  ('20000000-0000-0000-0000-000000000003', 'Forester', 'forester', 'SUV'),
  ('20000000-0000-0000-0000-000000000003', 'Outback', 'outback', 'Station Wagon'),
  ('20000000-0000-0000-0000-000000000003', 'XV', 'xv', 'Crossover'),
  ('20000000-0000-0000-0000-000000000003', 'Impreza', 'impreza', 'Hatchback'),
-- Honda Models
  ('20000000-0000-0000-0000-000000000004', 'Fit', 'fit', 'Hatchback'),
  ('20000000-0000-0000-0000-000000000004', 'CR-V', 'cr-v', 'SUV'),
  ('20000000-0000-0000-0000-000000000004', 'Vezel', 'vezel', 'Crossover'),
-- Mazda Models
  ('20000000-0000-0000-0000-000000000005', 'CX-5', 'cx-5', 'SUV'),
  ('20000000-0000-0000-0000-000000000005', 'Demio', 'demio', 'Hatchback'),
  ('20000000-0000-0000-0000-000000000005', 'Axela', 'axela', 'Saloon'),
-- Euro / Premium Models
  ('20000000-0000-0000-0000-000000000006', 'C-Class', 'c-class', 'Saloon'),
  ('20000000-0000-0000-0000-000000000006', 'E-Class', 'e-class', 'Saloon'),
  ('20000000-0000-0000-0000-000000000006', 'GLE', 'gle', 'SUV'),
  ('20000000-0000-0000-0000-000000000008', 'Golf', 'golf', 'Hatchback'),
  ('20000000-0000-0000-0000-000000000008', 'Tiguan', 'tiguan', 'SUV'),
  ('20000000-0000-0000-0000-000000000008', 'Touareg', 'touareg', 'SUV')
ON CONFLICT (make_id, id) DO NOTHING;

-- 4. Vehicle Categories (Marketing & Lifestyle Tags)
INSERT INTO public.categories (id, name, slug, description, display_order, is_active) VALUES
  ('40000000-0000-0000-0000-000000000001', 'Uber Ready', 'uber-ready', 'Fuel-efficient vehicles suitable for taxi business', 1, true),
  ('40000000-0000-0000-0000-000000000002', 'Family Cars', 'family-cars', 'Spacious 7-seaters and large station wagons', 2, true),
  ('40000000-0000-0000-0000-000000000003', 'Luxury & Premium', 'luxury', 'High-end sedans and premium SUVs', 3, true),
  ('40000000-0000-0000-0000-000000000004', '4WD & Off-Road', 'off-road', 'Vehicles built for tough Kenyan terrain', 4, true),
  ('40000000-0000-0000-0000-000000000005', 'Commercial', 'commercial', 'Pickups, vans, and light trucks', 5, true),
  ('40000000-0000-0000-0000-000000000006', 'Hybrids', 'hybrids', 'Eco-friendly and highly fuel-efficient', 6, true)
ON CONFLICT (id) DO NOTHING;

COMMIT;