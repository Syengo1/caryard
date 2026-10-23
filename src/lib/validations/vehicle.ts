import { z } from 'zod'

const currentYear = new Date().getFullYear()

const emptyStringToUndefined = (value: unknown) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === '$undefined') return undefined;
  }
  return value;
}

export const inventoryStatusSchema = z.enum(['in_stock', 'in_transit', 'reserved', 'sold'])
export const publicationStatusSchema = z.enum(['draft', 'published', 'archived'])
export const vehicleConditionSchema = z.enum(['foreign_used', 'locally_used', 'brand_new'])
export const transmissionSchema = z.enum(['automatic', 'manual'])
export const fuelTypeSchema = z.enum(['petrol', 'diesel', 'hybrid', 'plug_in_hybrid', 'electric'])
export const driveTypeSchema = z.enum(['2WD', '4WD', 'AWD'])

export const vehicleImageSchema = z.object({
  id: z.string().optional(),
  storage_path: z.string().trim().min(1, 'Storage path is required'),
  alt_text: z.string().trim().max(160).optional().nullable(),
  display_order: z.number().int().min(0).default(0),
  is_cover: z.boolean().default(false),
  width: z.number().int().positive().max(10_000).optional().nullable(),
  height: z.number().int().positive().max(10_000).optional().nullable(),
})

export const stepSpecsSchema = z.object({
  make_id: z.string().trim().min(1, 'Please select a valid make'),
  model_id: z.string().trim().min(1, 'Please select a valid model'),
  year: z.coerce
    .number()
    .int()
    .min(1980, 'Year must be 1980 or newer')
    .max(currentYear + 1, `Year cannot exceed ${currentYear + 1}`),
  body_type: z.preprocess(emptyStringToUndefined, z.string().trim().max(50).optional().nullable()),
  engine_cc: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive('Engine CC must be positive').optional().nullable()),
  transmission: z.preprocess(emptyStringToUndefined, transmissionSchema.optional().nullable()),
  fuel: z.preprocess(emptyStringToUndefined, fuelTypeSchema.optional().nullable()),
  drive: z.preprocess(emptyStringToUndefined, driveTypeSchema.optional().nullable()),
  exterior_color: z.preprocess(emptyStringToUndefined, z.string().trim().max(50).optional().nullable()),
  interior_color: z.preprocess(emptyStringToUndefined, z.string().trim().max(50).optional().nullable()),
})

export const stepFeaturesSchema = z.object({
  features: z.object({
    horsepower: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    torque: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    zero_to_hundred: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    seat_capacity: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().optional().nullable()),
    upholstery: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    cargo_space: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    sound_system: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    climate_control: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    fuel_efficiency: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    ground_clearance: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    towing_capacity: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    interior_lighting: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    infotainment: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    duty_status: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    additional_features: z.array(z.string().trim()).default([])
  }).default({ additional_features: [] }) 
})

export const stepPricingSchema = z.object({
  price_kes: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(100_000, 'Price must be at least KSh 100,000').optional().nullable()),
  is_negotiable: z.boolean().default(true),
  mileage_km: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(0, 'Mileage cannot be negative').optional().nullable()),
  condition: z.preprocess(emptyStringToUndefined, vehicleConditionSchema.optional().nullable()),
  inventory_status: inventoryStatusSchema.default('in_stock'),
  showroom_id: z.preprocess(emptyStringToUndefined, z.string().trim().min(1, 'Please select a valid showroom').optional().nullable()),
  purchase_price_kes: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(0).optional().nullable()),
  supplier_name: z.preprocess(emptyStringToUndefined, z.string().trim().max(120).optional().nullable()),
  vin_or_chassis: z.preprocess(emptyStringToUndefined, z.string().trim().max(50).optional().nullable()),
  internal_notes: z.preprocess(emptyStringToUndefined, z.string().trim().max(2000).optional().nullable()),
})

export const stepPhotosSchema = z.object({
  images: z.array(vehicleImageSchema).max(25).default([]),
})

export const stepDescriptionSchema = z.object({
  title: z.preprocess(emptyStringToUndefined, z.string().trim().min(5, 'Title must be at least 5 characters').max(150).optional().nullable()),
  description: z.preprocess(emptyStringToUndefined, z.string().trim().max(5000).optional().nullable()),
  category_ids: z.array(z.string().trim().min(1)).default([]),
  is_featured: z.boolean().default(false),
})

// ============================================================================
// COMBINED SCHEMAS: Draft vs. Publish
// ============================================================================

export const saveDraftVehicleSchema = stepSpecsSchema
  .partial()
  .merge(stepFeaturesSchema.partial())
  .merge(stepPricingSchema.partial())
  .merge(stepDescriptionSchema.partial())
  .extend({
    id: z.preprocess(emptyStringToUndefined, z.string().optional()),
    stock_number: z.preprocess(emptyStringToUndefined, z.string().trim().max(50).optional()),
    // FIXED: Accept any valid publication status to allow editing published vehicles
    publication_status: publicationStatusSchema.default('draft'),
    images: z.array(vehicleImageSchema).max(25).default([]),
  })

export const publishVehicleSchema = z
  .object({
    id: z.string().trim().min(1, 'Vehicle ID is required for publishing'),
    stock_number: z.string().trim().min(2, 'Stock number is required'),
    title: z.string().trim().min(5, 'Title must be at least 5 characters'),
    make_id: z.string().trim().min(1, 'Make is required'),
    model_id: z.string().trim().min(1, 'Model is required'),
    showroom_id: z.string().trim().min(1, 'Showroom is required'),
    year: z.coerce.number().int().min(1980).max(currentYear + 1),
    price_kes: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(100_000, 'Price is required')),
    is_negotiable: z.boolean().default(true),
    mileage_km: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(0, 'Mileage is required')),
    condition: vehicleConditionSchema,
    transmission: transmissionSchema,
    fuel: fuelTypeSchema,
    drive: driveTypeSchema,
    body_type: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    engine_cc: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().optional().nullable()),
    exterior_color: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    interior_color: z.preprocess(emptyStringToUndefined, z.string().trim().optional().nullable()),
    description: z.string().trim().min(20, 'Published vehicles must have a description of at least 20 characters'),
    inventory_status: inventoryStatusSchema.default('in_stock'),
    publication_status: z.literal('published').default('published'),
    category_ids: z.array(z.string().trim().min(1)).default([]),
    features: stepFeaturesSchema.shape.features,
    is_featured: z.boolean().default(false),
    images: z.array(vehicleImageSchema).min(1, 'Published vehicles must have at least one photo'),
    vin_or_chassis: z.preprocess(emptyStringToUndefined, z.string().trim().max(50).optional().nullable()),
    purchase_price_kes: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(0).optional().nullable()),
    supplier_name: z.preprocess(emptyStringToUndefined, z.string().trim().max(120).optional().nullable()),
    internal_notes: z.preprocess(emptyStringToUndefined, z.string().trim().max(2000).optional().nullable()),
  })
  .refine((data) => data.images.filter((img) => img.is_cover).length === 1, {
    message: 'Exactly one image must be designated as the cover photo.',
    path: ['images'],
  })

export type SaveDraftVehicleInput = z.input<typeof saveDraftVehicleSchema>
export type SaveDraftVehicleData = z.output<typeof saveDraftVehicleSchema>

export type PublishVehicleInput = z.input<typeof publishVehicleSchema>
export type PublishVehicleData = z.output<typeof publishVehicleSchema>