// src/app/(admin)/admin/vehicles/[id]/edit/page.tsx
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { getTaxonomyData } from "@/lib/queries/taxonomy"
import { getVehicleForEdit } from "@/lib/queries/vehicles"
import { requireStaffOrAdmin } from "@/lib/auth/roles"
import { WizardShell } from "@/components/admin/vehicle-wizard/wizard-shell"
import type { SaveDraftVehicleInput } from "@/lib/validations/vehicle"

export const instant = false

export default async function EditVehiclePage(props: {
  params: Promise<{ id: string }>
}) {
  await connection()
  await requireStaffOrAdmin()

  const { id } = await props.params

  const [taxonomy, vehicleData] = await Promise.all([
    getTaxonomyData(),
    getVehicleForEdit(id).catch(() => null),
  ])

  if (!vehicleData) {
    return notFound()
  }

  // Strip null values and convert them to undefined to satisfy Zod/React Hook Form types
  const cleanVehicleData = Object.fromEntries(
    Object.entries(vehicleData).map(([key, value]) => [key, value === null ? undefined : value])
  )

  const initialData: Partial<SaveDraftVehicleInput> & { id: string } = {
    ...(cleanVehicleData as Partial<SaveDraftVehicleInput>),
    id: vehicleData.id,
    stock_number: vehicleData.stock_number ?? undefined,
    publication_status: vehicleData.publication_status,
    features: (vehicleData.features as SaveDraftVehicleInput["features"]) || {
      additional_features: [],
    },
    category_ids:
      vehicleData.vehicle_categories?.map((c: { category_id: string }) => c.category_id) || [],
    images: vehicleData.vehicle_images || [],
    purchase_price_kes: vehicleData.vehicle_private_details?.purchase_price_kes ?? undefined,
    supplier_name: vehicleData.vehicle_private_details?.supplier_name ?? undefined,
    vin_or_chassis: vehicleData.vehicle_private_details?.vin_or_chassis ?? undefined,
    internal_notes: vehicleData.vehicle_private_details?.internal_notes ?? undefined,
  }

  return <WizardShell taxonomy={taxonomy} initialData={initialData} />
}