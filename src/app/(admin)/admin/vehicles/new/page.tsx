import { connection } from "next/server"
import Link from "next/link"
import { getTaxonomyData } from "@/lib/queries/taxonomy"
import { getRecentDrafts } from "@/lib/queries/vehicles"
import { requireStaffOrAdmin } from "@/lib/auth/roles"
import { WizardShell } from "@/components/admin/vehicle-wizard/wizard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Plus, ArrowRight } from "lucide-react"

export const instant = false

// FIXED: Define explicit type to resolve the 'implicit any' warning on map()
type DraftRecord = {
  id: string
  title: string | null
  updated_at: string
  makes: { name: string } | { name: string }[] | null
  models: { name: string } | { name: string }[] | null
}

export default async function NewVehiclePage(props: {
  searchParams: Promise<{ force_new?: string }>
}) {
  await connection()
  await requireStaffOrAdmin()
  
  const searchParams = await props.searchParams
  const taxonomy = await getTaxonomyData()
  
  // FIXED: Bypass stale SelectQueryError types via 'unknown'
  const drafts = (await getRecentDrafts()) as unknown as DraftRecord[]

  if (drafts.length > 0 && searchParams.force_new !== "true") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold">Unfinished Drafts Found</h1>
          <p className="text-muted-foreground">
            You have incomplete vehicle listings. Would you like to resume where you left off?
          </p>
        </div>

        <div className="space-y-3 mt-8">
          {drafts.map((draft: DraftRecord) => {
            const makeObj = Array.isArray(draft.makes) ? draft.makes[0] : draft.makes
            const modelObj = Array.isArray(draft.models) ? draft.models[0] : draft.models
            
            const makeName = makeObj?.name || ''
            const modelName = modelObj?.name || ''
            const fallbackTitle = `${makeName} ${modelName}`.trim() || 'Untitled Draft'

            return (
              <Card key={draft.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {draft.title || fallbackTitle}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last edited: {new Date(draft.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/admin/vehicles/${draft.id}/edit`}>
                    <Button variant="secondary" size="sm">
                      Resume <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="pt-6 border-t flex flex-col items-center">
          <p className="text-sm text-muted-foreground mb-4">Or start a completely new vehicle listing</p>
          <Link href="?force_new=true">
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Create New Vehicle
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <WizardShell taxonomy={taxonomy} />
}