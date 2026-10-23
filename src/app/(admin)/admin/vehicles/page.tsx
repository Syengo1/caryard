import { connection } from "next/server"
import Link from "next/link"
import { Plus, CarFront } from "lucide-react"
import { getAdminInventory } from "@/lib/queries/vehicles"
import { requireStaffOrAdmin } from "@/lib/auth/roles"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const instant = false

type AdminVehicle = {
  id: string
  title: string | null
  year: number | null
  stock_number: string | null
  price_kes: number | null
  inventory_status: string
  publication_status: string
  makes: { name: string } | { name: string }[] | null
  models: { name: string } | { name: string }[] | null
  vehicle_images: { storage_path: string; is_cover: boolean }[] | null
}

export default async function AdminVehiclesPage() {
  await connection()
  await requireStaffOrAdmin()

  // FIXED: Bypass stale SelectQueryError types via 'unknown'
  const vehicles = (await getAdminInventory()) as unknown as AdminVehicle[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage your vehicle listings and drafts.</p>
        </div>
        <Link href="/admin/vehicles/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {vehicles.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-dashed">
            <CarFront className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">No vehicles found</p>
            <p className="text-sm">Click &quot;Add Vehicle&quot; to create your first listing.</p>
          </Card>
        ) : (
          vehicles.map((vehicle: AdminVehicle) => {
            const makeObj = Array.isArray(vehicle.makes) ? vehicle.makes[0] : vehicle.makes
            const modelObj = Array.isArray(vehicle.models) ? vehicle.models[0] : vehicle.models
            
            const makeName = makeObj?.name || ''
            const modelName = modelObj?.name || ''
            const title = vehicle.title || `${vehicle.year || ''} ${makeName} ${modelName}`.trim() || 'Untitled'

            return (
              <Card key={vehicle.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-16 bg-muted rounded-md shrink-0 flex items-center justify-center overflow-hidden border">
                      {vehicle.vehicle_images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_SUPABASE_VEHICLE_BUCKET || 'vehicle-images'}/${vehicle.vehicle_images[0].storage_path}`}
                          className="w-full h-full object-cover"
                          alt="Cover"
                        />
                      ) : (
                        <CarFront className="w-6 h-6 opacity-20" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
                        <Badge variant={vehicle.publication_status === 'published' ? 'default' : 'secondary'} className="capitalize text-[10px] px-1.5 py-0">
                          {vehicle.publication_status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{vehicle.stock_number}</span>
                        <span>{vehicle.inventory_status.replace('_', ' ')}</span>
                        <span>{vehicle.price_kes ? `KSh ${vehicle.price_kes.toLocaleString()}` : 'Price TBD'}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/admin/vehicles/${vehicle.id}/edit`} className="w-full sm:w-auto shrink-0">
                    <Button variant="secondary" className="w-full">
                      Edit
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}