


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'staff'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."drive_type" AS ENUM (
    '2WD',
    '4WD',
    'AWD'
);


ALTER TYPE "public"."drive_type" OWNER TO "postgres";


CREATE TYPE "public"."fuel_type" AS ENUM (
    'petrol',
    'diesel',
    'hybrid',
    'plug_in_hybrid',
    'electric'
);


ALTER TYPE "public"."fuel_type" OWNER TO "postgres";


CREATE TYPE "public"."inventory_status" AS ENUM (
    'in_stock',
    'in_transit',
    'reserved',
    'sold'
);


ALTER TYPE "public"."inventory_status" OWNER TO "postgres";


CREATE TYPE "public"."lead_event_type" AS ENUM (
    'whatsapp_click',
    'phone_click',
    'share_click'
);


ALTER TYPE "public"."lead_event_type" OWNER TO "postgres";


CREATE TYPE "public"."lead_status" AS ENUM (
    'new',
    'contacted',
    'qualified',
    'closed_won',
    'closed_lost',
    'spam'
);


ALTER TYPE "public"."lead_status" OWNER TO "postgres";


CREATE TYPE "public"."lead_type" AS ENUM (
    'whatsapp_click',
    'general_inquiry',
    'test_drive',
    'trade_in',
    'financing',
    'direct_import'
);


ALTER TYPE "public"."lead_type" OWNER TO "postgres";


CREATE TYPE "public"."publication_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."publication_status" OWNER TO "postgres";


CREATE TYPE "public"."transmission_type" AS ENUM (
    'automatic',
    'manual'
);


ALTER TYPE "public"."transmission_type" OWNER TO "postgres";


CREATE TYPE "public"."vehicle_condition" AS ENUM (
    'foreign_used',
    'locally_used',
    'brand_new'
);


ALTER TYPE "public"."vehicle_condition" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_vehicle_images"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, entity_table, entity_id, action, old_values, new_values)
  VALUES (auth.uid(), 'vehicle_images', COALESCE(NEW.id, OLD.id), TG_OP, CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END, CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END);
  RETURN COALESCE(NEW, OLD);
END; $$;


ALTER FUNCTION "public"."audit_vehicle_images"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_vehicle_private_details"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, entity_table, entity_id, action, old_values, new_values)
  VALUES (auth.uid(), 'vehicle_private_details', COALESCE(NEW.vehicle_id, OLD.vehicle_id), TG_OP, CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END, CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END);
  RETURN COALESCE(NEW, OLD);
END; $$;


ALTER FUNCTION "public"."audit_vehicle_private_details"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_vehicles"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_action TEXT := TG_OP;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.price_kes IS DISTINCT FROM NEW.price_kes THEN v_action := 'UPDATE_PRICE';
    ELSIF OLD.publication_status IS DISTINCT FROM NEW.publication_status OR OLD.inventory_status IS DISTINCT FROM NEW.inventory_status THEN v_action := 'STATUS_CHANGE';
    END IF;
  END IF;
  INSERT INTO public.audit_logs (actor_id, entity_table, entity_id, action, old_values, new_values)
  VALUES (auth.uid(), 'vehicles', COALESCE(NEW.id, OLD.id), v_action, CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END, CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END);
  RETURN COALESCE(NEW, OLD);
END; $$;


ALTER FUNCTION "public"."audit_vehicles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_image_cover_on_publish"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_vehicle_id UUID := COALESCE(NEW.vehicle_id, OLD.vehicle_id);
  v_pub_status public.publication_status;
  v_has_cover BOOLEAN;
BEGIN
  SELECT publication_status INTO v_pub_status FROM public.vehicles WHERE id = v_vehicle_id;
  IF v_pub_status IS NULL OR v_pub_status != 'published' THEN RETURN NULL; END IF;
  SELECT EXISTS (SELECT 1 FROM public.vehicle_images WHERE vehicle_id = v_vehicle_id AND is_cover = true) INTO v_has_cover;
  IF NOT v_has_cover THEN RAISE EXCEPTION 'Cannot publish vehicle (%) without a designated cover image.', v_vehicle_id; END IF;
  RETURN NULL;
END; $$;


ALTER FUNCTION "public"."enforce_image_cover_on_publish"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_published_vehicle_has_cover"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."enforce_published_vehicle_has_cover"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_vehicle_cover_on_publish"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE v_has_cover BOOLEAN;
BEGIN
  IF NEW.publication_status != 'published' THEN RETURN NULL; END IF;
  SELECT EXISTS (SELECT 1 FROM public.vehicle_images WHERE vehicle_id = NEW.id AND is_cover = true) INTO v_has_cover;
  IF NOT v_has_cover THEN RAISE EXCEPTION 'Cannot publish vehicle (%) without a designated cover image.', NEW.id; END IF;
  RETURN NULL;
END; $$;


ALTER FUNCTION "public"."enforce_vehicle_cover_on_publish"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_vehicle_lifecycle"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."handle_vehicle_lifecycle"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
      AND is_active = true
      AND role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_staff_or_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
      AND is_active = true
      AND role IN ('staff', 'admin')
  );
$$;


ALTER FUNCTION "public"."is_staff_or_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."queue_deleted_vehicle_image"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.storage_cleanup_queue (bucket_id, storage_path)
  VALUES ('vehicle-images', OLD.storage_path);
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."queue_deleted_vehicle_image"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_vehicle_cover_image"("p_vehicle_id" "uuid", "p_image_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."set_vehicle_cover_image"("p_vehicle_id" "uuid", "p_image_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_vehicle_private_lifecycle"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."sync_vehicle_private_lifecycle"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."write_audit_log"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."write_audit_log"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid",
    "entity_table" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "old_values" "jsonb",
    "new_values" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid",
    "event_type" "public"."lead_event_type" NOT NULL,
    "source_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lead_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid",
    "lead_type" "public"."lead_type" NOT NULL,
    "status" "public"."lead_status" DEFAULT 'new'::"public"."lead_status" NOT NULL,
    "customer_name" "text",
    "customer_phone" "text",
    "customer_email" "text",
    "message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "assigned_to" "uuid",
    "internal_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "leads_customer_email_check" CHECK ((("customer_email" IS NULL) OR ("length"("btrim"("customer_email")) <= 254))),
    CONSTRAINT "leads_customer_name_check" CHECK ((("customer_name" IS NOT NULL) AND (("length"("btrim"("customer_name")) >= 2) AND ("length"("btrim"("customer_name")) <= 120)))),
    CONSTRAINT "leads_customer_phone_check" CHECK ((("customer_phone" IS NOT NULL) AND (("length"("btrim"("customer_phone")) >= 7) AND ("length"("btrim"("customer_phone")) <= 30)))),
    CONSTRAINT "leads_message_length_check" CHECK ((("message" IS NULL) OR ("length"("message") <= 2000))),
    CONSTRAINT "leads_no_click_events_check" CHECK (("lead_type" <> 'whatsapp_click'::"public"."lead_type"))
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."makes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "logo_url" "text",
    "is_popular" boolean DEFAULT false NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."makes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "make_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "default_body_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."models" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."showrooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "city" "text" NOT NULL,
    "address" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "whatsapp_number" "text" NOT NULL,
    "google_maps_url" "text",
    "opening_hours" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."showrooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "business_name" "text" DEFAULT 'Car Yard Motors'::"text" NOT NULL,
    "primary_phone" "text" NOT NULL,
    "primary_whatsapp" "text" NOT NULL,
    "finance_min_deposit_pct" numeric(5,2) DEFAULT 30.00 NOT NULL,
    "finance_default_months" integer DEFAULT 24 NOT NULL,
    "finance_annual_interest_pct" numeric(5,2) DEFAULT 14.00 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "site_settings_deposit_pct_check" CHECK ((("finance_min_deposit_pct" >= (0)::numeric) AND ("finance_min_deposit_pct" <= (100)::numeric))),
    CONSTRAINT "site_settings_id_check" CHECK (("id" = 1)),
    CONSTRAINT "site_settings_interest_pct_check" CHECK ((("finance_annual_interest_pct" >= (0)::numeric) AND ("finance_annual_interest_pct" <= (100)::numeric))),
    CONSTRAINT "site_settings_months_check" CHECK ((("finance_default_months" >= 1) AND ("finance_default_months" <= 120)))
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."storage_cleanup_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "text" DEFAULT 'vehicle-images'::"text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "queued_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    "attempts" integer DEFAULT 0 NOT NULL,
    "last_error" "text"
);


ALTER TABLE "public"."storage_cleanup_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "public"."app_role" DEFAULT 'staff'::"public"."app_role" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_categories" (
    "vehicle_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL
);


ALTER TABLE "public"."vehicle_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "alt_text" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_cover" boolean DEFAULT false NOT NULL,
    "width" integer,
    "height" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vehicle_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_private_details" (
    "vehicle_id" "uuid" NOT NULL,
    "vin_or_chassis" "text",
    "purchase_price_kes" bigint,
    "supplier_name" "text",
    "internal_notes" "text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "sold_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "vehicle_private_details_purchase_price_kes_check" CHECK ((("purchase_price_kes" IS NULL) OR ("purchase_price_kes" >= 0)))
);


ALTER TABLE "public"."vehicle_private_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stock_number" "text",
    "slug" "text",
    "title" "text",
    "make_id" "uuid",
    "model_id" "uuid",
    "showroom_id" "uuid",
    "inventory_status" "public"."inventory_status" DEFAULT 'in_stock'::"public"."inventory_status" NOT NULL,
    "publication_status" "public"."publication_status" DEFAULT 'draft'::"public"."publication_status" NOT NULL,
    "year" integer,
    "price_kes" bigint,
    "is_negotiable" boolean DEFAULT true NOT NULL,
    "mileage_km" integer,
    "engine_cc" integer,
    "condition" "public"."vehicle_condition",
    "transmission" "public"."transmission_type",
    "fuel" "public"."fuel_type",
    "drive" "public"."drive_type",
    "body_type" "text",
    "exterior_color" "text",
    "interior_color" "text",
    "features" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "description" "text",
    "is_featured" boolean DEFAULT false NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "vehicles_engine_cc_check" CHECK (("engine_cc" >= 0)),
    CONSTRAINT "vehicles_make_model_paired" CHECK (((("make_id" IS NULL) AND ("model_id" IS NULL)) OR (("make_id" IS NOT NULL) AND ("model_id" IS NOT NULL)))),
    CONSTRAINT "vehicles_mileage_km_check" CHECK (("mileage_km" >= 0)),
    CONSTRAINT "vehicles_price_kes_check" CHECK (("price_kes" > 0)),
    CONSTRAINT "vehicles_publish_completeness_check" CHECK ((("publication_status" <> 'published'::"public"."publication_status") OR (("make_id" IS NOT NULL) AND ("model_id" IS NOT NULL) AND ("year" IS NOT NULL) AND ("stock_number" IS NOT NULL) AND ("slug" IS NOT NULL) AND ("title" IS NOT NULL) AND ("price_kes" IS NOT NULL) AND ("mileage_km" IS NOT NULL) AND ("condition" IS NOT NULL) AND ("transmission" IS NOT NULL) AND ("fuel" IS NOT NULL) AND ("showroom_id" IS NOT NULL) AND ("description" IS NOT NULL) AND ("length"("btrim"("description")) >= 20)))),
    CONSTRAINT "vehicles_year_immutable_check" CHECK ((("year" >= 1980) AND ("year" <= 2100)))
);


ALTER TABLE "public"."vehicles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."lead_events"
    ADD CONSTRAINT "lead_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."makes"
    ADD CONSTRAINT "makes_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."makes"
    ADD CONSTRAINT "makes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."makes"
    ADD CONSTRAINT "makes_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_make_id_id_unique" UNIQUE ("make_id", "id");



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_make_id_slug_key" UNIQUE ("make_id", "slug");



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."showrooms"
    ADD CONSTRAINT "showrooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."showrooms"
    ADD CONSTRAINT "showrooms_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."storage_cleanup_queue"
    ADD CONSTRAINT "storage_cleanup_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."vehicle_categories"
    ADD CONSTRAINT "vehicle_categories_pkey" PRIMARY KEY ("vehicle_id", "category_id");



ALTER TABLE ONLY "public"."vehicle_images"
    ADD CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_images"
    ADD CONSTRAINT "vehicle_images_storage_path_key" UNIQUE ("storage_path");



ALTER TABLE ONLY "public"."vehicle_private_details"
    ADD CONSTRAINT "vehicle_private_details_pkey" PRIMARY KEY ("vehicle_id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_stock_number_key" UNIQUE ("stock_number");



CREATE INDEX "idx_lead_events_vehicle_created" ON "public"."lead_events" USING "btree" ("vehicle_id", "created_at" DESC);



CREATE INDEX "idx_leads_status_created" ON "public"."leads" USING "btree" ("status", "created_at" DESC);



CREATE UNIQUE INDEX "idx_single_cover_per_vehicle" ON "public"."vehicle_images" USING "btree" ("vehicle_id") WHERE ("is_cover" = true);



CREATE INDEX "idx_storage_cleanup_unprocessed" ON "public"."storage_cleanup_queue" USING "btree" ("queued_at") WHERE ("processed_at" IS NULL);



CREATE INDEX "idx_vehicle_categories_category_vehicle" ON "public"."vehicle_categories" USING "btree" ("category_id", "vehicle_id");



CREATE INDEX "idx_vehicle_images_vehicle_order" ON "public"."vehicle_images" USING "btree" ("vehicle_id", "display_order");



CREATE INDEX "idx_vehicles_make_model" ON "public"."vehicles" USING "btree" ("make_id", "model_id");



CREATE INDEX "idx_vehicles_price" ON "public"."vehicles" USING "btree" ("price_kes");



CREATE INDEX "idx_vehicles_public_catalog" ON "public"."vehicles" USING "btree" ("inventory_status", "created_at" DESC) WHERE ("publication_status" = 'published'::"public"."publication_status");



CREATE INDEX "idx_vehicles_showroom" ON "public"."vehicles" USING "btree" ("showroom_id");



CREATE INDEX "idx_vehicles_year" ON "public"."vehicles" USING "btree" ("year" DESC);



CREATE OR REPLACE TRIGGER "trg_audit_vehicle_images" AFTER INSERT OR DELETE OR UPDATE ON "public"."vehicle_images" FOR EACH ROW EXECUTE FUNCTION "public"."audit_vehicle_images"();



CREATE OR REPLACE TRIGGER "trg_audit_vehicle_private_details" AFTER DELETE OR UPDATE ON "public"."vehicle_private_details" FOR EACH ROW EXECUTE FUNCTION "public"."audit_vehicle_private_details"();



CREATE OR REPLACE TRIGGER "trg_audit_vehicles" AFTER INSERT OR DELETE OR UPDATE ON "public"."vehicles" FOR EACH ROW EXECUTE FUNCTION "public"."audit_vehicles"();



CREATE OR REPLACE TRIGGER "trg_leads_updated_at" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_showrooms_updated_at" BEFORE UPDATE ON "public"."showrooms" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_site_settings_updated_at" BEFORE UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE CONSTRAINT TRIGGER "trg_vehicle_images_preserve_published_cover" AFTER DELETE OR UPDATE OF "is_cover", "vehicle_id" ON "public"."vehicle_images" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "public"."enforce_image_cover_on_publish"();



CREATE OR REPLACE TRIGGER "trg_vehicle_images_queue_storage_cleanup" AFTER DELETE ON "public"."vehicle_images" FOR EACH ROW EXECUTE FUNCTION "public"."queue_deleted_vehicle_image"();



CREATE OR REPLACE TRIGGER "trg_vehicle_private_details_updated_at" BEFORE UPDATE ON "public"."vehicle_private_details" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_vehicles_lifecycle" BEFORE INSERT OR UPDATE ON "public"."vehicles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_vehicle_lifecycle"();



CREATE CONSTRAINT TRIGGER "trg_vehicles_require_cover_on_publish" AFTER INSERT OR UPDATE OF "publication_status" ON "public"."vehicles" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "public"."enforce_vehicle_cover_on_publish"();



CREATE OR REPLACE TRIGGER "trg_vehicles_sync_private_lifecycle" AFTER INSERT OR UPDATE ON "public"."vehicles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_vehicle_private_lifecycle"();



CREATE OR REPLACE TRIGGER "trg_vehicles_updated_at" BEFORE UPDATE ON "public"."vehicles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_events"
    ADD CONSTRAINT "lead_events_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_make_id_fkey" FOREIGN KEY ("make_id") REFERENCES "public"."makes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_categories"
    ADD CONSTRAINT "vehicle_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_categories"
    ADD CONSTRAINT "vehicle_categories_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_images"
    ADD CONSTRAINT "vehicle_images_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_private_details"
    ADD CONSTRAINT "vehicle_private_details_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vehicle_private_details"
    ADD CONSTRAINT "vehicle_private_details_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vehicle_private_details"
    ADD CONSTRAINT "vehicle_private_details_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_make_id_fkey" FOREIGN KEY ("make_id") REFERENCES "public"."makes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_model_make_match_fk" FOREIGN KEY ("make_id", "model_id") REFERENCES "public"."models"("make_id", "id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_showroom_id_fkey" FOREIGN KEY ("showroom_id") REFERENCES "public"."showrooms"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



CREATE POLICY "Admins manage categories" ON "public"."categories" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins manage makes" ON "public"."makes" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins manage models" ON "public"."models" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins manage showrooms" ON "public"."showrooms" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins update site settings" ON "public"."site_settings" FOR UPDATE TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Only Admins can delete leads" ON "public"."leads" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Only Admins can hard delete vehicles" ON "public"."vehicles" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Only Admins manage roles" ON "public"."user_roles" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Public can log lead events for published vehicles" ON "public"."lead_events" FOR INSERT TO "authenticated", "anon" WITH CHECK ((("vehicle_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."vehicles" "v"
  WHERE (("v"."id" = "lead_events"."vehicle_id") AND ("v"."publication_status" = 'published'::"public"."publication_status"))))));



CREATE POLICY "Public can submit leads for published vehicles only" ON "public"."leads" FOR INSERT TO "authenticated", "anon" WITH CHECK ((("status" = 'new'::"public"."lead_status") AND ("assigned_to" IS NULL) AND ("internal_notes" IS NULL) AND ("metadata" = '{}'::"jsonb") AND (("vehicle_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."vehicles" "v"
  WHERE (("v"."id" = "leads"."vehicle_id") AND ("v"."publication_status" = 'published'::"public"."publication_status")))))));



CREATE POLICY "Public can view active categories" ON "public"."categories" FOR SELECT TO "authenticated", "anon" USING ((("is_active" = true) OR ( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin")));



CREATE POLICY "Public can view active showrooms" ON "public"."showrooms" FOR SELECT TO "authenticated", "anon" USING ((("is_active" = true) OR ( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin")));



CREATE POLICY "Public can view images of published vehicles" ON "public"."vehicle_images" FOR SELECT TO "authenticated", "anon" USING (((EXISTS ( SELECT 1
   FROM "public"."vehicles" "v"
  WHERE (("v"."id" = "vehicle_images"."vehicle_id") AND ("v"."publication_status" = 'published'::"public"."publication_status")))) OR ( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin")));



CREATE POLICY "Public can view makes" ON "public"."makes" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public can view models" ON "public"."models" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public can view published vehicle categories" ON "public"."vehicle_categories" FOR SELECT TO "authenticated", "anon" USING (((EXISTS ( SELECT 1
   FROM "public"."vehicles" "v"
  WHERE (("v"."id" = "vehicle_categories"."vehicle_id") AND ("v"."publication_status" = 'published'::"public"."publication_status")))) OR ( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin")));



CREATE POLICY "Public can view published vehicles" ON "public"."vehicles" FOR SELECT TO "authenticated", "anon" USING ((("publication_status" = 'published'::"public"."publication_status") OR ( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin")));



CREATE POLICY "Public can view site settings" ON "public"."site_settings" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Staff and Admins can insert private vehicle details" ON "public"."vehicle_private_details" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin"));



CREATE POLICY "Staff and Admins can insert vehicles" ON "public"."vehicles" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin"));



CREATE POLICY "Staff and Admins can update leads" ON "public"."leads" FOR UPDATE TO "authenticated" USING (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin")) WITH CHECK (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin"));



CREATE POLICY "Staff and Admins can update private vehicle details" ON "public"."vehicle_private_details" FOR UPDATE TO "authenticated" USING (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin")) WITH CHECK (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin"));



CREATE POLICY "Staff and Admins can update vehicles" ON "public"."vehicles" FOR UPDATE TO "authenticated" USING (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin")) WITH CHECK (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin"));



CREATE POLICY "Staff and Admins can view and manage leads" ON "public"."leads" FOR SELECT TO "authenticated" USING (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin"));



CREATE POLICY "Staff and Admins can view audit logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin"));



CREATE POLICY "Staff and Admins can view lead events" ON "public"."lead_events" FOR SELECT TO "authenticated" USING (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin"));



CREATE POLICY "Staff and Admins can view private vehicle details" ON "public"."vehicle_private_details" FOR SELECT TO "authenticated" USING (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin"));



CREATE POLICY "Staff and Admins manage storage cleanup queue" ON "public"."storage_cleanup_queue" TO "authenticated" USING (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin")) WITH CHECK (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin"));



CREATE POLICY "Staff and Admins manage vehicle categories" ON "public"."vehicle_categories" TO "authenticated" USING (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin")) WITH CHECK (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin"));



CREATE POLICY "Staff and Admins manage vehicle images" ON "public"."vehicle_images" TO "authenticated" USING (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin")) WITH CHECK (( SELECT "public"."is_staff_or_admin"() AS "is_staff_or_admin"));



CREATE POLICY "Users can read own role or Admins read all" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "public"."is_admin"() AS "is_admin")));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."makes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."models" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."showrooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."storage_cleanup_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_private_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."audit_vehicle_images"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_vehicle_private_details"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_vehicles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_image_cover_on_publish"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."enforce_published_vehicle_has_cover"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."enforce_published_vehicle_has_cover"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."enforce_published_vehicle_has_cover"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_vehicle_cover_on_publish"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_vehicle_lifecycle"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_vehicle_lifecycle"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."handle_vehicle_lifecycle"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_staff_or_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_staff_or_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_staff_or_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_staff_or_admin"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."is_staff_or_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."queue_deleted_vehicle_image"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."queue_deleted_vehicle_image"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."queue_deleted_vehicle_image"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_vehicle_cover_image"("p_vehicle_id" "uuid", "p_image_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_vehicle_cover_image"("p_vehicle_id" "uuid", "p_image_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_vehicle_cover_image"("p_vehicle_id" "uuid", "p_image_id" "uuid") TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."set_vehicle_cover_image"("p_vehicle_id" "uuid", "p_image_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_vehicle_private_lifecycle"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_vehicle_private_lifecycle"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."sync_vehicle_private_lifecycle"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."write_audit_log"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."write_audit_log"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."write_audit_log"() TO "service_role";


















GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";
GRANT SELECT ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "supabase_admin";



GRANT ALL ON TABLE "public"."categories" TO "service_role";
GRANT SELECT ON TABLE "public"."categories" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "supabase_admin";



GRANT ALL ON TABLE "public"."lead_events" TO "service_role";
GRANT SELECT ON TABLE "public"."lead_events" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_events" TO "supabase_admin";



GRANT INSERT("vehicle_id") ON TABLE "public"."lead_events" TO "anon";
GRANT INSERT("vehicle_id") ON TABLE "public"."lead_events" TO "authenticated";



GRANT INSERT("event_type") ON TABLE "public"."lead_events" TO "anon";
GRANT INSERT("event_type") ON TABLE "public"."lead_events" TO "authenticated";



GRANT INSERT("source_path") ON TABLE "public"."lead_events" TO "anon";
GRANT INSERT("source_path") ON TABLE "public"."lead_events" TO "authenticated";



GRANT ALL ON TABLE "public"."leads" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "supabase_admin";



GRANT INSERT("vehicle_id") ON TABLE "public"."leads" TO "anon";
GRANT INSERT("vehicle_id") ON TABLE "public"."leads" TO "authenticated";



GRANT INSERT("lead_type") ON TABLE "public"."leads" TO "anon";
GRANT INSERT("lead_type") ON TABLE "public"."leads" TO "authenticated";



GRANT INSERT("customer_name") ON TABLE "public"."leads" TO "anon";
GRANT INSERT("customer_name") ON TABLE "public"."leads" TO "authenticated";



GRANT INSERT("customer_phone") ON TABLE "public"."leads" TO "anon";
GRANT INSERT("customer_phone") ON TABLE "public"."leads" TO "authenticated";



GRANT INSERT("customer_email") ON TABLE "public"."leads" TO "anon";
GRANT INSERT("customer_email") ON TABLE "public"."leads" TO "authenticated";



GRANT INSERT("message") ON TABLE "public"."leads" TO "anon";
GRANT INSERT("message") ON TABLE "public"."leads" TO "authenticated";



GRANT ALL ON TABLE "public"."makes" TO "service_role";
GRANT SELECT ON TABLE "public"."makes" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."makes" TO "authenticated";
GRANT ALL ON TABLE "public"."makes" TO "supabase_admin";



GRANT ALL ON TABLE "public"."models" TO "service_role";
GRANT SELECT ON TABLE "public"."models" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."models" TO "authenticated";
GRANT ALL ON TABLE "public"."models" TO "supabase_admin";



GRANT ALL ON TABLE "public"."showrooms" TO "service_role";
GRANT SELECT ON TABLE "public"."showrooms" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."showrooms" TO "authenticated";
GRANT ALL ON TABLE "public"."showrooms" TO "supabase_admin";



GRANT ALL ON TABLE "public"."site_settings" TO "service_role";
GRANT SELECT ON TABLE "public"."site_settings" TO "anon";
GRANT SELECT,UPDATE ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "supabase_admin";



GRANT ALL ON TABLE "public"."storage_cleanup_queue" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."storage_cleanup_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."storage_cleanup_queue" TO "supabase_admin";



GRANT ALL ON TABLE "public"."user_roles" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "supabase_admin";



GRANT ALL ON TABLE "public"."vehicle_categories" TO "service_role";
GRANT SELECT ON TABLE "public"."vehicle_categories" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vehicle_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_categories" TO "supabase_admin";



GRANT ALL ON TABLE "public"."vehicle_images" TO "service_role";
GRANT SELECT ON TABLE "public"."vehicle_images" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vehicle_images" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_images" TO "supabase_admin";



GRANT ALL ON TABLE "public"."vehicle_private_details" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."vehicle_private_details" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_private_details" TO "supabase_admin";



GRANT ALL ON TABLE "public"."vehicles" TO "service_role";
GRANT SELECT ON TABLE "public"."vehicles" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles" TO "supabase_admin";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































