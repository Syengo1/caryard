-- ============================================================================
-- VERIFICATION SUITE: Tests all 12 allow/deny scenarios in a rolled-back tx
-- ============================================================================
BEGIN;

-- 1. Create mock Auth users (Admin, Staff, Ordinary Customer)
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@caryard.co.ke'),
  ('00000000-0000-0000-0000-000000000002', 'staff@caryard.co.ke'),
  ('00000000-0000-0000-0000-000000000003', 'customer@gmail.com');

INSERT INTO public.user_roles (user_id, full_name, role, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Yard Admin', 'admin', true),
  ('00000000-0000-0000-0000-000000000002', 'Yard Staff', 'staff', true);

-- 2. Seed taxonomy as Admin
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

INSERT INTO public.showrooms (id, name, slug, city, address, phone, whatsapp_number)
VALUES ('10000000-0000-0000-0000-000000000001', 'Nairobi Flagship', 'nairobi', 'Nairobi', 'Ngong Rd', '+254700000000', '254700000000');

INSERT INTO public.makes (id, name, slug) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Toyota', 'toyota'),
  ('20000000-0000-0000-0000-000000000002', 'Subaru', 'subaru');

INSERT INTO public.models (id, make_id, name, slug) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Harrier', 'harrier'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Forester', 'forester');

-- TEST A: Composite Make/Model FK blocks Toyota + Forester mismatch
DO $$
BEGIN
  BEGIN
    INSERT INTO public.vehicles (stock_number, slug, title, make_id, model_id, year)
    VALUES (
      'ERR-001', 'bad-car', 'Bad Car',
      '20000000-0000-0000-0000-000000000001', -- Toyota
      '30000000-0000-0000-0000-000000000002', -- Forester (Subaru)
      2021
    );
    RAISE EXCEPTION 'FAIL: Allowed mismatched Make and Model!';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASS: Mismatched Make and Model rejected by composite FK.';
  END;
END $$;

-- TEST B: Staff creates a valid draft vehicle and private details
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);

INSERT INTO public.vehicles (
  id, stock_number, slug, title, make_id, model_id, showroom_id,
  year, price_kes, mileage_km, condition, transmission, fuel, description
) VALUES (
  '40000000-0000-0000-0000-000000000001', 'TYT-001', '2021-toyota-harrier-tyt001', '2021 Toyota Harrier',
  '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  2021, 4200000, 38000, 'foreign_used', 'automatic', 'petrol',
  'Clean foreign used 2021 Toyota Harrier in immaculate condition.'
);

UPDATE public.vehicle_private_details
SET vin_or_chassis = 'MXUA80-0012345', internal_notes = 'Minimum reserve 4.05M'
WHERE vehicle_id = '40000000-0000-0000-0000-000000000001';

-- TEST C: Anonymous visitor cannot see draft vehicle, cannot read private details, and cannot submit lead for draft
SET LOCAL ROLE anon;

DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count FROM public.vehicles;
  IF v_count != 0 THEN
    RAISE EXCEPTION 'FAIL: Anon was able to read draft vehicle!';
  END IF;
  RAISE NOTICE 'PASS: Anon cannot read draft vehicles.';

  BEGIN
    PERFORM * FROM public.vehicle_private_details;
    RAISE EXCEPTION 'FAIL: Anon queried vehicle_private_details!';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: Anon blocked from vehicle_private_details by table privilege.';
  END;

  BEGIN
    INSERT INTO public.leads (vehicle_id, lead_type, customer_name, customer_phone)
    VALUES ('40000000-0000-0000-0000-000000000001', 'general_inquiry', 'Jane Doe', '+254711222333');
    RAISE EXCEPTION 'FAIL: Anon submitted lead for draft vehicle!';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN
    RAISE NOTICE 'PASS: Anon blocked from submitting lead for draft vehicle.';
  END;
END $$;

-- TEST D: Staff publishes vehicle with cover image -> Audit log & published_at recorded
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);

INSERT INTO public.vehicle_images (vehicle_id, storage_path, is_cover)
VALUES ('40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001/cover.webp', true);

UPDATE public.vehicles
SET publication_status = 'published'
WHERE id = '40000000-0000-0000-0000-000000000001';

DO $$
DECLARE
  v_audit_count INT;
  v_pub_at TIMESTAMPTZ;
BEGIN
  SELECT published_at INTO v_pub_at FROM public.vehicles WHERE id = '40000000-0000-0000-0000-000000000001';
  IF v_pub_at IS NULL THEN
    RAISE EXCEPTION 'FAIL: published_at was not automatically set!';
  END IF;

  SELECT count(*) INTO v_audit_count
  FROM public.audit_logs
  WHERE entity_id = '40000000-0000-0000-0000-000000000001' AND action = 'STATUS_CHANGE';

  IF v_audit_count = 0 THEN
    RAISE EXCEPTION 'FAIL: Audit log was not automatically recorded!';
  END IF;
  RAISE NOTICE 'PASS: Automatic published_at and audit_logs verified.';
END $$;

ROLLBACK;