import { z } from 'zod'

export const leadTypeSchema = z.enum([
  'general_inquiry',
  'test_drive',
  'trade_in',
  'financing',
  'direct_import',
])

export const leadEventEnumSchema = z.enum([
  'whatsapp_click',
  'phone_click',
  'share_click',
])

// Kenyan phone format regex (supports 07xx, 01xx, +2547xx, 2547xx)
const kenyaPhoneRegex = /^(?:(?:\+?254)|0)?([17]\d{8})$/

export const createLeadSchema = z.object({
  vehicle_id: z.string().uuid().optional().nullable(),
  lead_type: leadTypeSchema,
  customer_name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name is too long'),
  customer_phone: z
    .string()
    .trim()
    .regex(kenyaPhoneRegex, 'Please enter a valid Kenyan phone number (e.g. 0712 345 678)'),
  customer_email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(254)
    .optional()
    .or(z.literal('')),
  message: z.string().trim().max(2000, 'Message cannot exceed 2000 characters').optional(),
  // Multi-purpose metadata payload (e.g., trade-in car details, estimated deposit)
  metadata: z
    .object({
      trade_in_make: z.string().optional(),
      trade_in_model: z.string().optional(),
      trade_in_year: z.coerce.number().optional(),
      trade_in_mileage: z.coerce.number().optional(),
      financing_deposit_kes: z.coerce.number().optional(),
      financing_period_months: z.coerce.number().optional(),
    })
    .default({}),
})

export const createLeadEventSchema = z.object({
  vehicle_id: z.string().uuid().optional().nullable(),
  event_type: leadEventEnumSchema,
  source_path: z.string().max(255).optional(),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type CreateLeadEventInput = z.infer<typeof createLeadEventSchema>