import { connection } from "next/server"
import { notFound } from "next/navigation"
import { getTaxonomyData } from "@/lib/queries/taxonomy"
import { getVehicleForEdit } from "@/lib/queries/vehicles"
import { requireStaffOrAdmin } from "@/lib/auth/roles"
import { WizardShell } from "@/components/admin/vehicle-wizard/wizard-shell"

export const instant = false

export default async function EditVehiclePage(props: {
  params: Promise<{ id: string }>
}) {
  // Opt out of static prerendering for strict DB authorization
  await connection()
  await requireStaffOrAdmin()
  
  const { id } = await props.params
  
  // Parallel fetch taxonomy and the specific vehicle data
  const [taxonomy, vehicleData] = await Promise.all([
    getTaxonomyData(),
    getVehicleForEdit(id).catch(() => null) // Catch errors (like bad UUIDs) to prevent unhandled crashes
  ])
  
  // If the vehicle doesn't exist, throw a 404
  if (!vehicleData) {
    return notFound()
  }

  // Map the nested Supabase database response into the flat Zod Form Input Shape
  const initialData = {
    ...vehicleData,
    // Safely cast publication_status to satisfy the Zod Partial<SaveDraftVehicleInput> strict literal
    publication_status: vehicleData.publication_status as "draft",
    
    // Safely cast Json to the expected Zod Record, defaulting to empty object if null
    features: (vehicleData.features as Record<string, boolean>) || {},
    
    // Properly type 'c' to eliminate the implicit any error
    category_ids: vehicleData.vehicle_categories?.map((c: { category_id: string }) => c.category_id) || [],
    images: vehicleData.vehicle_images || [],
    purchase_price_kes: vehicleData.vehicle_private_details?.purchase_price_kes ?? undefined,
    supplier_name: vehicleData.vehicle_private_details?.supplier_name ?? undefined,
    vin_or_chassis: vehicleData.vehicle_private_details?.vin_or_chassis ?? undefined,
    internal_notes: vehicleData.vehicle_private_details?.internal_notes ?? undefined,
  }

  return <WizardShell taxonomy={taxonomy} initialData={initialData} />
}