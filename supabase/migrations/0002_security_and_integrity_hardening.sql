-- ============================================================================
-- MIGRATION: 0002_security_and_integrity_hardening.sql
-- Purpose: Enforces composite Make/Model FKs, separates public/private vehicle
--          columns, hardens RLS & table GRANTs, separates lead events, adds
--          automatic lifecycle/audit triggers, and secures Storage objects.
-- ============================================================================

-- ============================================================================
-- 1. COMPOSITE MAKE / MODEL INTEGRITY (Review Item #1)
-- ============================================================================
ALTER TABLE public.models
  ADD CONSTRAINT models_make_id_id_unique UNIQUE (make_id, id);

ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_model_make_match_fk
  FOREIGN KEY (make_id, model_id)
  REFERENCES public.models (make_id, id)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

-- Showroom deletion should never orphan a published vehicle; deactivate instead
ALTER TABLE public.vehicles
  DROP CONSTRAINT IF EXISTS vehicles_showroom_id_fkey,
  ADD CONSTRAINT vehicles_showroom_id_fkey
  FOREIGN KEY (showroom_id)
  REFERENCES public.showrooms (id)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

-- ============================================================================
-- 2. SEPARATE PUBLIC CATALOG FROM PRIVATE VEHICLE DATA (Review Item #2)
-- ============================================================================
CREATE TABLE public.vehicle_private_details (
  vehicle_id UUID PRIMARY KEY REFERENCES public.vehicles(id) ON DELETE CASCADE,
  vin_or_chassis TEXT,
  purchase_price_kes BIGINT CHECK (purchase_price_kes IS NULL OR purchase_price_kes >= 0),
  supplier_name TEXT,
  internal_notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migrate any existing rows if present, then drop internal columns from public.vehicles
INSERT INTO public.vehicle_private_details (vehicle_id, vin_or_chassis, created_by, updated_by, sold_at)
SELECT id, vin_or_chassis, created_by, updated_by, sold_at
FROM public.vehicles
ON CONFLICT (vehicle_id) DO NOTHING;

ALTER TABLE public.vehicles
  DROP COLUMN IF EXISTS vin_or_chassis,
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS updated_by,
  DROP COLUMN IF EXISTS sold_at;

-- ============================================================================
-- 3. IMMUTABLE CHECK CONSTRAINTS &PUBLISHED COMPLETENESS (Review Item #7)
-- ============================================================================
-- Replace time-dependent year CHECK with an immutable bound (dynamic year+1 checked via trigger)
ALTER TABLE public.vehicles
  DROP CONSTRAINT IF EXISTS vehicles_year_check,
  ADD CONSTRAINT vehicles_year_immutable_check CHECK (year >= 1980 AND year <= 2100);

-- Require description to be non-empty when published
ALTER TABLE public.vehicles
  DROP CONSTRAINT IF EXISTS vehicles_publish_completeness_check,
  ADD CONSTRAINT vehicles_publish_completeness_check CHECK (
    publication_status != 'published' OR (
      price_kes IS NOT NULL AND
      mileage_km IS NOT NULL AND
      condition IS NOT NULL AND
      transmission IS NOT NULL AND
      fuel IS NOT NULL AND
      showroom_id IS NOT NULL AND
      description IS NOT NULL AND
      length(btrim(description)) >= 20
    )
  );

-- Add updated_at to showrooms and enforce financial bounds on site_settings
ALTER TABLE public.showrooms
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.site_settings
  ADD CONSTRAINT site_settings_deposit_pct_check
    CHECK (finance_min_deposit_pct >= 0 AND finance_min_deposit_pct <= 100),
  ADD CONSTRAINT site_settings_months_check
    CHECK (finance_default_months >= 1 AND finance_default_months <= 120),
  ADD CONSTRAINT site_settings_interest_pct_check
    CHECK (finance_annual_interest_pct >= 0 AND finance_annual_interest_pct <= 100);

-- Seed initial site_settings row so public queries and admin updates always have row id=1
INSERT INTO public.site_settings (
  id, business_name, primary_phone, primary_whatsapp,
  finance_min_deposit_pct, finance_default_months, finance_annual_interest_pct
) VALUES (
  1, 'Car Yard Motors Kenya', '+254700000000', '254700000000', 30.00, 24, 14.00
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. SEPARATE WHATSAPP CLICKS INTO LEAD_EVENTS & HARDEN LEADS (Review Item #4)
-- ============================================================================
CREATE TYPE public.lead_event_type AS ENUM ('whatsapp_click', 'phone_click', 'share_click');

CREATE TABLE public.lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  event_type public.lead_event_type NOT NULL,
  source_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_events_vehicle_created ON public.lead_events (vehicle_id, created_at DESC);

-- Prevent whatsapp_click from being used as a formal customer lead
-- and enforce input length/validity on public.leads
ALTER TABLE public.leads
  ADD CONSTRAINT leads_no_click_events_check CHECK (lead_type != 'whatsapp_click'),
  ADD CONSTRAINT leads_customer_name_check CHECK (
    customer_name IS NOT NULL AND length(btrim(customer_name)) BETWEEN 2 AND 120
  ),
  ADD CONSTRAINT leads_customer_phone_check CHECK (
    customer_phone IS NOT NULL AND length(btrim(customer_phone)) BETWEEN 7 AND 30
  ),
  ADD CONSTRAINT leads_customer_email_check CHECK (
    customer_email IS NULL OR length(btrim(customer_email)) <= 254
  ),
  ADD CONSTRAINT leads_message_length_check CHECK (
    message IS NULL OR length(message) <= 2000
  );

-- ============================================================================
-- 5. STORAGE PATH SINGLE SOURCE OF TRUTH & ORPHAN CLEANUP QUEUE (Review Item #5)
-- ============================================================================
-- Remove redundant public_url column; derive URL in app from storage_path
ALTER TABLE public.vehicle_images
  DROP COLUMN IF EXISTS public_url;

-- Queue table to track Storage files that must be deleted after DB rows are removed
CREATE TABLE public.storage_cleanup_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT NOT NULL DEFAULT 'vehicle-images',
  storage_path TEXT NOT NULL,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT
);

CREATE INDEX idx_storage_cleanup_unprocessed
  ON public.storage_cleanup_queue (queued_at ASC)
  WHERE processed_at IS NULL;

-- Trigger to automatically queue storage_path whenever a vehicle_image row is deleted
-- (Fires on both individual image deletions and vehicle ON DELETE CASCADE)
CREATE OR REPLACE FUNCTION public.queue_deleted_vehicle_image()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.storage_cleanup_queue (bucket_id, storage_path)
  VALUES ('vehicle-images', OLD.storage_path);
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_vehicle_images_queue_storage_cleanup
  AFTER DELETE ON public.vehicle_images
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_deleted_vehicle_image();

-- Atomic helper for staff to swap cover photo in a single transaction
CREATE OR REPLACE FUNCTION public.set_vehicle_cover_image(
  p_vehicle_id UUID,
  p_image_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (SELECT public.is_staff_or_admin()) THEN
    RAISE EXCEPTION 'Unauthorized: Only active staff or admins can change cover images.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.vehicle_images
    WHERE id = p_image_id AND vehicle_id = p_vehicle_id
  ) THEN
    RAISE EXCEPTION 'Image % does not belong to vehicle %.', p_image_id, p_vehicle_id;
  END IF;

  UPDATE public.vehicle_images
  SET is_cover = false
  WHERE vehicle_id = p_vehicle_id AND is_cover = true AND id != p_image_id;

  UPDATE public.vehicle_images
  SET is_cover = true
  WHERE id = p_image_id AND vehicle_id = p_vehicle_id;
END;
$$;

-- ============================================================================
-- 6. LIFECYCLE TIMESTAMPS, COVER PHOTO ENFORCEMENT & AUDIT TRIGGERS (Review #6)
-- ============================================================================

-- 6A. Generic updated_at maintenance trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_vehicle_private_details_updated_at
  BEFORE UPDATE ON public.vehicle_private_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_showrooms_updated_at
  BEFORE UPDATE ON public.showrooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6B. Vehicle lifecycle & upper-year validation trigger
CREATE OR REPLACE FUNCTION public.handle_vehicle_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_max_year INT := EXTRACT(YEAR FROM now())::INT + 1;
BEGIN
  -- Enforce current-year + 1 rule dynamically on write without breaking immutable CHECK
  IF NEW.year > v_max_year THEN
    RAISE EXCEPTION 'Vehicle year (%) cannot exceed %.', NEW.year, v_max_year;
  END IF;

  -- Automatically set published_at on first transition to 'published'
  IF NEW.publication_status = 'published' AND
     (TG_OP = 'INSERT' OR OLD.publication_status != 'published') AND
     NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vehicles_lifecycle
  BEFORE INSERT OR UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.handle_vehicle_lifecycle();

-- Automatically maintain vehicle_private_details (created_by, updated_by, sold_at)
CREATE OR REPLACE FUNCTION public.sync_vehicle_private_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor UUID := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.vehicle_private_details (
      vehicle_id, created_by, updated_by, sold_at
    ) VALUES (
      NEW.id,
      v_actor,
      v_actor,
      CASE WHEN NEW.inventory_status = 'sold' THEN now() ELSE NULL END
    )
    ON CONFLICT (vehicle_id) DO UPDATE
      SET updated_by = COALESCE(v_actor, public.vehicle_private_details.updated_by),
          sold_at = CASE
            WHEN NEW.inventory_status = 'sold' THEN COALESCE(public.vehicle_private_details.sold_at, now())
            ELSE NULL
          END;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.vehicle_private_details
    SET updated_by = COALESCE(v_actor, updated_by),
        sold_at = CASE
          WHEN NEW.inventory_status = 'sold' AND OLD.inventory_status != 'sold' THEN now()
          WHEN NEW.inventory_status != 'sold' AND OLD.inventory_status = 'sold' THEN NULL
          ELSE sold_at
        END
    WHERE vehicle_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vehicles_sync_private_lifecycle
  AFTER INSERT OR UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.sync_vehicle_private_lifecycle();

-- 6C. Deferrable Constraint Trigger: Published vehicles MUST have a cover image
CREATE OR REPLACE FUNCTION public.enforce_published_vehicle_has_cover()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_vehicle_id UUID;
  v_pub_status public.publication_status;
  v_has_cover BOOLEAN;
BEGIN
  v_vehicle_id := CASE
    WHEN TG_TABLE_NAME = 'vehicles' THEN COALESCE(NEW.id, OLD.id)
    ELSE COALESCE(NEW.vehicle_id, OLD.vehicle_id)
  END;

  SELECT publication_status INTO v_pub_status
  FROM public.vehicles
  WHERE id = v_vehicle_id;

  -- If vehicle was deleted or is not published, no cover requirement applies
  IF v_pub_status IS NULL OR v_pub_status != 'published' THEN
    RETURN NULL;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.vehicle_images
    WHERE vehicle_id = v_vehicle_id AND is_cover = true
  ) INTO v_has_cover;

  IF NOT v_has_cover THEN
    RAISE EXCEPTION 'Cannot publish vehicle (%) without a designated cover image.', v_vehicle_id;
  END IF;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_vehicles_require_cover_on_publish
  AFTER INSERT OR UPDATE OF publication_status ON public.vehicles
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.enforce_published_vehicle_has_cover();

CREATE CONSTRAINT TRIGGER trg_vehicle_images_preserve_published_cover
  AFTER UPDATE OF is_cover, vehicle_id OR DELETE ON public.vehicle_images
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.enforce_published_vehicle_has_cover();

-- 6D. Automatic Append-Only Audit Trigger
CREATE OR REPLACE FUNCTION public.write_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_entity_id UUID;
  v_action TEXT := TG_OP;
BEGIN
  v_entity_id := CASE
    WHEN TG_TABLE_NAME = 'vehicle_private_details' THEN COALESCE(NEW.vehicle_id, OLD.vehicle_id)
    ELSE COALESCE(NEW.id, OLD.id)
  END;

  IF TG_TABLE_NAME = 'vehicles' AND TG_OP = 'UPDATE' THEN
    IF OLD.price_kes IS DISTINCT FROM NEW.price_kes THEN
      v_action := 'UPDATE_PRICE';
    ELSIF OLD.publication_status IS DISTINCT FROM NEW.publication_status
       OR OLD.inventory_status IS DISTINCT FROM NEW.inventory_status THEN
      v_action := 'STATUS_CHANGE';
    END IF;
  END IF;

  INSERT INTO public.audit_logs (
    actor_id, entity_table, entity_id, action, old_values, new_values
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    v_entity_id,
    v_action,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_vehicles
  AFTER INSERT OR UPDATE OR DELETE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER trg_audit_vehicle_private_details
  AFTER UPDATE OR DELETE ON public.vehicle_private_details
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER trg_audit_vehicle_images
  AFTER INSERT OR UPDATE OR DELETE ON public.vehicle_images
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

-- ============================================================================
-- 7. INDEX REFINEMENTS (Review Item #8)
-- ============================================================================
DROP INDEX IF EXISTS public.idx_vehicles_public_catalog;

CREATE INDEX idx_vehicles_public_catalog
  ON public.vehicles (inventory_status, created_at DESC)
  WHERE publication_status = 'published';

CREATE INDEX IF NOT EXISTS idx_vehicle_categories_category_vehicle
  ON public.vehicle_categories (category_id, vehicle_id);

-- ============================================================================
-- 8. COMPLETE RLS POLICIES & EXPLICIT TABLE GRANTS (Review Items #3 & #4)
-- ============================================================================
ALTER TABLE public.vehicle_private_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_cleanup_queue ENABLE ROW LEVEL SECURITY;

-- 8A. Fix vehicle_categories leak of unpublished vehicle associations
DROP POLICY IF EXISTS "Public can view vehicle categories" ON public.vehicle_categories;

CREATE POLICY "Public can view published vehicle categories"
  ON public.vehicle_categories FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles AS v
      WHERE v.id = vehicle_categories.vehicle_id
        AND v.publication_status = 'published'
    )
    OR (SELECT public.is_staff_or_admin())
  );

-- 8B. Private vehicle details: Staff and Admins ONLY
CREATE POLICY "Staff and Admins can view private vehicle details"
  ON public.vehicle_private_details FOR SELECT TO authenticated
  USING ((SELECT public.is_staff_or_admin()));

CREATE POLICY "Staff and Admins can insert private vehicle details"
  ON public.vehicle_private_details FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_staff_or_admin()));

CREATE POLICY "Staff and Admins can update private vehicle details"
  ON public.vehicle_private_details FOR UPDATE TO authenticated
  USING ((SELECT public.is_staff_or_admin()))
  WITH CHECK ((SELECT public.is_staff_or_admin()));

-- 8C. Missing Admin Management Policies for Taxonomy, Showrooms, and Settings
CREATE POLICY "Admins manage makes"
  ON public.makes FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins manage models"
  ON public.models FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins manage showrooms"
  ON public.showrooms FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins update site settings"
  ON public.site_settings FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 8D. Harden Public Lead Submission & Lead Events Policies
DROP POLICY IF EXISTS "Public can submit leads" ON public.leads;

CREATE POLICY "Public can submit leads for published vehicles only"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND assigned_to IS NULL
    AND internal_notes IS NULL
    AND metadata = '{}'::jsonb
    AND (
      vehicle_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.vehicles AS v
        WHERE v.id = leads.vehicle_id
          AND v.publication_status = 'published'
      )
    )
  );

CREATE POLICY "Only Admins can delete leads"
  ON public.leads FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

CREATE POLICY "Public can log lead events for published vehicles"
  ON public.lead_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    vehicle_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.vehicles AS v
      WHERE v.id = lead_events.vehicle_id
        AND v.publication_status = 'published'
    )
  );

CREATE POLICY "Staff and Admins can view lead events"
  ON public.lead_events FOR SELECT TO authenticated
  USING ((SELECT public.is_staff_or_admin()));

CREATE POLICY "Staff and Admins manage storage cleanup queue"
  ON public.storage_cleanup_queue FOR ALL TO authenticated
  USING ((SELECT public.is_staff_or_admin()))
  WITH CHECK ((SELECT public.is_staff_or_admin()));

-- 8E. Explicit Table & Column-Level GRANT / REVOKE Model
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- Grant execution on helper functions
GRANT EXECUTE ON FUNCTION public.is_staff_or_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_vehicle_cover_image(UUID, UUID) TO authenticated;

-- Anonymous visitors: Read-only on public catalog tables + column-restricted insert on leads/events
GRANT SELECT ON
  public.makes,
  public.models,
  public.categories,
  public.showrooms,
  public.vehicles,
  public.vehicle_categories,
  public.vehicle_images,
  public.site_settings
TO anon;

GRANT INSERT (vehicle_id, lead_type, customer_name, customer_phone, customer_email, message)
  ON public.leads TO anon, authenticated;

GRANT INSERT (vehicle_id, event_type, source_path)
  ON public.lead_events TO anon, authenticated;

-- Authenticated users (RLS enforces staff/admin boundaries)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT INSERT, UPDATE ON
  public.vehicles,
  public.vehicle_private_details,
  public.vehicle_categories,
  public.vehicle_images,
  public.leads,
  public.storage_cleanup_queue
TO authenticated;

GRANT DELETE ON
  public.vehicles,
  public.vehicle_categories,
  public.vehicle_images,
  public.leads,
  public.storage_cleanup_queue
TO authenticated;

GRANT INSERT, UPDATE, DELETE ON
  public.makes,
  public.models,
  public.categories,
  public.showrooms,
  public.user_roles
TO authenticated;

GRANT UPDATE ON public.site_settings TO authenticated;
-- Note: public.audit_logs intentionally receives ZERO INSERT/UPDATE/DELETE grants (append-only via SECURITY DEFINER trigger)

-- ============================================================================
-- 9. SUPABASE STORAGE BUCKET & OBJECT RLS (Review Item #5)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-images',
  'vehicle-images',
  true,
  5242880, -- 5 MB hard cap per image
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Public can view vehicle images in storage"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'vehicle-images');

CREATE POLICY "Staff and Admins can upload vehicle images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vehicle-images'
    AND (SELECT public.is_staff_or_admin())
  );

CREATE POLICY "Staff and Admins can update vehicle images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'vehicle-images'
    AND (SELECT public.is_staff_or_admin())
  )
  WITH CHECK (
    bucket_id = 'vehicle-images'
    AND (SELECT public.is_staff_or_admin())
  );

CREATE POLICY "Staff and Admins can delete vehicle images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vehicle-images'
    AND (SELECT public.is_staff_or_admin())
  );