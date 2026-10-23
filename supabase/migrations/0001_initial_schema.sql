-- ============================================================================
-- 1. EXTENSIONS & CUSTOM ENUMS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.app_role AS ENUM ('admin', 'staff');
CREATE TYPE public.inventory_status AS ENUM ('in_stock', 'in_transit', 'reserved', 'sold');
CREATE TYPE public.publication_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.vehicle_condition AS ENUM ('foreign_used', 'locally_used', 'brand_new');
CREATE TYPE public.transmission_type AS ENUM ('automatic', 'manual');
CREATE TYPE public.fuel_type AS ENUM ('petrol', 'diesel', 'hybrid', 'plug_in_hybrid', 'electric');
CREATE TYPE public.drive_type AS ENUM ('2WD', '4WD', 'AWD');
CREATE TYPE public.lead_type AS ENUM ('whatsapp_click', 'general_inquiry', 'test_drive', 'trade_in', 'financing', 'direct_import');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'closed_won', 'closed_lost', 'spam');

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- Staff Roles & Profiles (Server-controlled role assignment)
CREATE TABLE public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'staff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Showrooms / Branches
CREATE TABLE public.showrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  google_maps_url TEXT,
  opening_hours TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Canonical Makes (e.g., Toyota, Subaru, Mercedes-Benz)
CREATE TABLE public.makes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Canonical Models linked to Makes (e.g., Harrier, Forester, Prado)
CREATE TABLE public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make_id UUID NOT NULL REFERENCES public.makes(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  default_body_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (make_id, slug)
);

-- Editable Lifestyle/Buyer Categories (e.g., Family, Luxury, Off-Road, Uber-Ready)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vehicles (Core Inventory Table)
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_number TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  
  -- Relations
  make_id UUID NOT NULL REFERENCES public.makes(id) ON DELETE RESTRICT,
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE RESTRICT,
  showroom_id UUID REFERENCES public.showrooms(id) ON DELETE SET NULL,
  
  -- Independent Statuses
  inventory_status public.inventory_status NOT NULL DEFAULT 'in_stock',
  publication_status public.publication_status NOT NULL DEFAULT 'draft',
  
  -- Specifications (Nullable during 'draft', enforced via CHECK when 'published')
  year INT NOT NULL CHECK (year >= 1980 AND year <= EXTRACT(YEAR FROM now())::INT + 2),
  price_kes BIGINT CHECK (price_kes > 0),
  is_negotiable BOOLEAN NOT NULL DEFAULT true,
  mileage_km INT CHECK (mileage_km >= 0),
  engine_cc INT CHECK (engine_cc >= 0),
  condition public.vehicle_condition,
  transmission public.transmission_type,
  fuel public.fuel_type,
  drive public.drive_type,
  body_type TEXT,
  exterior_color TEXT,
  interior_color TEXT,
  vin_or_chassis TEXT,
  
  -- Flexible Features & Presentation
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  
  -- Audit Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent incomplete drafts from being published
  CONSTRAINT vehicles_publish_completeness_check CHECK (
    publication_status != 'published' OR (
      price_kes IS NOT NULL AND
      mileage_km IS NOT NULL AND
      condition IS NOT NULL AND
      transmission IS NOT NULL AND
      fuel IS NOT NULL AND
      showroom_id IS NOT NULL
    )
  )
);

-- Many-to-Many Join Table: Vehicles <-> Categories
CREATE TABLE public.vehicle_categories (
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (vehicle_id, category_id)
);

-- Vehicle Gallery Images
CREATE TABLE public.vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE, -- Path inside Supabase Storage bucket
  public_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  width INT,
  height INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure at most one cover image per vehicle
CREATE UNIQUE INDEX idx_single_cover_per_vehicle 
  ON public.vehicle_images (vehicle_id) 
  WHERE is_cover = true;

-- Customer Leads & Inquiries
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  lead_type public.lead_type NOT NULL,
  status public.lead_status NOT NULL DEFAULT 'new',
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- Trade-in details, UTM params, etc.
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Logs for Inventory Mutations
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_table TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- e.g., 'CREATE', 'UPDATE_PRICE', 'STATUS_CHANGE', 'ARCHIVE'
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Global Site Settings (Single-row configuration table)
CREATE TABLE public.site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  business_name TEXT NOT NULL DEFAULT 'Car Yard Motors',
  primary_phone TEXT NOT NULL,
  primary_whatsapp TEXT NOT NULL,
  finance_min_deposit_pct NUMERIC(5,2) NOT NULL DEFAULT 30.00,
  finance_default_months INT NOT NULL DEFAULT 24,
  finance_annual_interest_pct NUMERIC(5,2) NOT NULL DEFAULT 14.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. PERFORMANCE INDEXES FOR FILTERING & SORTING
-- ============================================================================
CREATE INDEX idx_vehicles_public_catalog 
  ON public.vehicles (publication_status, inventory_status, created_at DESC)
  WHERE publication_status = 'published';

CREATE INDEX idx_vehicles_make_model ON public.vehicles (make_id, model_id);
CREATE INDEX idx_vehicles_price ON public.vehicles (price_kes);
CREATE INDEX idx_vehicles_year ON public.vehicles (year DESC);
CREATE INDEX idx_vehicles_showroom ON public.vehicles (showroom_id);
CREATE INDEX idx_vehicle_images_vehicle_order ON public.vehicle_images (vehicle_id, display_order ASC);
CREATE INDEX idx_leads_status_created ON public.leads (status, created_at DESC);

-- ============================================================================
-- 4. ROW-LEVEL SECURITY (RLS) & AUTHORIZATION HELPERS
-- ============================================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Secure helper to check if the current user is active staff or admin
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
      AND is_active = true
      AND role IN ('staff', 'admin')
  );
$$;

-- Secure helper to check if the current user is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
      AND is_active = true
      AND role = 'admin'
  );
$$;

-- PUBLIC READ POLICIES (Anon + Authenticated)
CREATE POLICY "Public can view published vehicles"
  ON public.vehicles FOR SELECT
  TO anon, authenticated
  USING (publication_status = 'published' OR (SELECT public.is_staff_or_admin()));

CREATE POLICY "Public can view images of published vehicles"
  ON public.vehicle_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_images.vehicle_id
        AND v.publication_status = 'published'
    )
    OR (SELECT public.is_staff_or_admin())
  );

CREATE POLICY "Public can view makes" ON public.makes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can view models" ON public.models FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT TO anon, authenticated USING (is_active = true OR (SELECT public.is_staff_or_admin()));
CREATE POLICY "Public can view vehicle categories" ON public.vehicle_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can view active showrooms" ON public.showrooms FOR SELECT TO anon, authenticated USING (is_active = true OR (SELECT public.is_staff_or_admin()));
CREATE POLICY "Public can view site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

-- STAFF & ADMIN INVENTORY POLICIES
CREATE POLICY "Staff and Admins can insert vehicles"
  ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_staff_or_admin()));

CREATE POLICY "Staff and Admins can update vehicles"
  ON public.vehicles FOR UPDATE TO authenticated
  USING ((SELECT public.is_staff_or_admin()))
  WITH CHECK ((SELECT public.is_staff_or_admin()));

CREATE POLICY "Only Admins can hard delete vehicles"
  ON public.vehicles FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

CREATE POLICY "Staff and Admins manage vehicle images"
  ON public.vehicle_images FOR ALL TO authenticated
  USING ((SELECT public.is_staff_or_admin()))
  WITH CHECK ((SELECT public.is_staff_or_admin()));

CREATE POLICY "Staff and Admins manage vehicle categories"
  ON public.vehicle_categories FOR ALL TO authenticated
  USING ((SELECT public.is_staff_or_admin()))
  WITH CHECK ((SELECT public.is_staff_or_admin()));

-- LEADS POLICIES (Public Insert, Staff Read/Update)
CREATE POLICY "Public can submit leads"
  ON public.leads FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'new' AND assigned_to IS NULL AND internal_notes IS NULL);

CREATE POLICY "Staff and Admins can view and manage leads"
  ON public.leads FOR SELECT TO authenticated
  USING ((SELECT public.is_staff_or_admin()));

CREATE POLICY "Staff and Admins can update leads"
  ON public.leads FOR UPDATE TO authenticated
  USING ((SELECT public.is_staff_or_admin()))
  WITH CHECK ((SELECT public.is_staff_or_admin()));

-- ROLES & AUDIT POLICIES
CREATE POLICY "Users can read own role or Admins read all"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

CREATE POLICY "Only Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Staff and Admins can view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING ((SELECT public.is_staff_or_admin()));