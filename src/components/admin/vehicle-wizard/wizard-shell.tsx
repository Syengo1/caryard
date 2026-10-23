"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronRight, Loader2, Save, CloudOff, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { saveDraftVehicleSchema, type SaveDraftVehicleInput } from "@/lib/validations/vehicle"
import { saveVehicleDraft, publishVehicle } from "@/lib/actions/vehicle-actions"
import { cn } from "@/lib/utils"

import { StepSpecs } from "./step-specs"
import { StepPricing } from "./step-pricing"
import { StepPhotos } from "./step-photos"
import { StepDescription } from "./step-description"
import { StepPreview } from "./step-preview"
import { StepFeatures } from "./step-features"
import { useSidebar } from "@/components/admin/sidebar-provider"

export interface TaxonomyData {
  makes: { id: string; name: string; slug: string }[]
  models: { id: string; make_id: string; name: string; slug: string; default_body_type?: string | null }[]
  categories: { id: string; name: string; slug: string }[]
  showrooms: { id: string; name: string; city: string }[]
}

const STEPS = [
  { id: 1, name: "Specs", fields: ["make_id", "model_id", "year", "body_type", "drive"] as (keyof SaveDraftVehicleInput)[] },
  { id: 2, name: "Features", fields: [] as (keyof SaveDraftVehicleInput)[] },
  { id: 3, name: "Commerce", fields: [] as (keyof SaveDraftVehicleInput)[] },
  { id: 4, name: "Photos", fields: [] as (keyof SaveDraftVehicleInput)[] },
  { id: 5, name: "Details", fields: [] as (keyof SaveDraftVehicleInput)[] },
  { id: 6, name: "Publish", fields: [] as (keyof SaveDraftVehicleInput)[] },
]

export function WizardShell({ 
  taxonomy, 
  initialData 
}: { 
  taxonomy: TaxonomyData
  initialData?: Partial<SaveDraftVehicleInput> & { id?: string }
}) {
  const router = useRouter()
  const { isCollapsed } = useSidebar()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [vehicleId, setVehicleId] = useState<string | null>(initialData?.id || null)
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'unsaved' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(initialData ? new Date() : null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const isPublishedRef = useRef(false)

  const form = useForm<SaveDraftVehicleInput>({
    resolver: zodResolver(saveDraftVehicleSchema) as Resolver<SaveDraftVehicleInput>,
    defaultValues: initialData || {
      is_negotiable: true,
      inventory_status: "in_stock",
      publication_status: "draft",
      images: [],
      category_ids: [],
      features: {},
    },
  })

  const performSave = async (data: SaveDraftVehicleInput, silent = true) => {
    if (isPublishedRef.current) return false

    setSaveStatus('saving')
    
    const payload = {
      ...data,
      id: vehicleId || undefined,
      publication_status: "draft" as const
    }
    
    const res = await saveVehicleDraft(payload)
    
    if (res.success && res.data) {
      if (!vehicleId) {
        setVehicleId(res.data.id)
        form.setValue("id", res.data.id)
        window.history.replaceState(null, '', `/admin/vehicles/${res.data.id}/edit`)
      }
      setSaveStatus('saved')
      setLastSaved(new Date())
      if (!silent) toast.success("Draft saved successfully.")
      return true
    } else {
      setSaveStatus('error')
      if (!silent) {
        if (res.fieldErrors) {
          const firstError = Object.values(res.fieldErrors)[0]?.[0]
          toast.error(`Validation Error: ${firstError}`)
        } else {
          toast.error(res.error || "Failed to save draft.")
        }
      }
      return false
    }
  }

  const handleFormChange = () => {
    if (!vehicleId || isPublishedRef.current) return 
    
    setSaveStatus('unsaved')
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    
    debounceTimerRef.current = setTimeout(() => {
      performSave(form.getValues() as SaveDraftVehicleInput, true)
    }, 1500)
  }

  const handleNext = async () => {
    const fieldsToValidate = STEPS[currentStep - 1].fields
    const isStepValid = await form.trigger(fieldsToValidate)
    
    if (!isStepValid) {
      // EXPLICIT LOGGING: If "Next Step" fails, it will print exactly which field caused it in the browser console
      console.error("Next Step Validation Errors:", form.formState.errors)
      toast.error("Please clear errors before proceeding.")
      return
    }

    const saved = await performSave(form.getValues() as SaveDraftVehicleInput, true)
    if (saved) setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
  }

  const handlePublish = async () => {
    const isFormValid = await form.trigger()
    if (!isFormValid) {
      // EXPLICIT LOGGING: Prints exact publishing errors to browser console
      console.error("Publish Validation Errors:", form.formState.errors)
      toast.error("Please fill in all required fields before publishing.")
      return
    }

    setSaveStatus('saving')
    
    const publishPayload = { 
      ...form.getValues(), 
      id: vehicleId || undefined, 
      publication_status: "published" as const 
    }
    
    const res = await publishVehicle(publishPayload)
    
    if (res.success) {
      isPublishedRef.current = true
      setSaveStatus('saved')
      toast.success("Vehicle published successfully!")
      router.push("/admin/vehicles")
    } else {
      setSaveStatus('error')
      if (res.fieldErrors) {
        const firstError = Object.values(res.fieldErrors)[0]?.[0]
        toast.error(`Cannot Publish: ${firstError}`)
      } else {
        toast.error(res.error || "Failed to publish vehicle.")
      }
    }
  }

  return (
    <div className={cn(
      "mx-auto space-y-8 pb-12 w-full transition-[max-width] duration-500 ease-in-out",
      isCollapsed ? "max-w-7xl" : "max-w-5xl"
    )}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">{vehicleId ? "Edit Vehicle" : "Add New Vehicle"}</h1>
          <p className="text-muted-foreground mt-1">Follow the steps to list a vehicle in your inventory.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-right hidden sm:block">
            {saveStatus === 'unsaved' && <span className="text-muted-foreground flex items-center"><CloudOff className="w-4 h-4 mr-1.5"/> Unsaved changes</span>}
            {saveStatus === 'saving' && <span className="text-primary flex items-center"><Loader2 className="w-4 h-4 mr-1.5 animate-spin"/> Saving draft...</span>}
            {saveStatus === 'saved' && lastSaved && <span className="text-muted-foreground flex items-center"><CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500"/> Saved {lastSaved.toLocaleTimeString()}</span>}
            {saveStatus === 'error' && <span className="text-destructive flex items-center"><CloudOff className="w-4 h-4 mr-1.5"/> Save failed</span>}
          </div>
          <Button variant="outline" onClick={() => performSave(form.getValues() as SaveDraftVehicleInput, false)} disabled={saveStatus === 'saving'}>
            <Save className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline-block">Save Draft</span>
          </Button>
        </div>
      </div>

      <nav aria-label="Progress" className="py-2">
        <ol role="list" className="flex items-center w-full">
          {STEPS.map((step, stepIdx) => (
            <li key={step.name} className={cn("flex items-center", stepIdx !== STEPS.length - 1 ? "flex-1 pr-4 sm:pr-0" : "")}>
              <div className="flex items-center gap-3 shrink-0">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors bg-background relative z-10",
                  currentStep > step.id ? "bg-primary border-primary text-primary-foreground" :
                  currentStep === step.id ? "border-primary text-primary" : "border-muted-foreground/30 text-muted-foreground"
                )}>
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className={cn("hidden sm:block text-sm font-medium", currentStep >= step.id ? "text-foreground" : "text-muted-foreground")}>
                  {step.name}
                </span>
              </div>
              {stepIdx !== STEPS.length - 1 && (
                <div className="hidden sm:block flex-1 h-0.5 mx-4 bg-muted-foreground/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500 ease-in-out" style={{ width: currentStep > step.id ? '100%' : '0%' }} />
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden min-h-[500px] flex flex-col transition-all duration-500">
        <div className="p-6 md:p-8 flex-1">
          <Form {...form}>
            <form className="space-y-6" onChange={handleFormChange} onSubmit={(e) => e.preventDefault()}>
              <div className={currentStep === 1 ? "block" : "hidden"}><StepSpecs taxonomy={taxonomy} /></div>
              <div className={currentStep === 2 ? "block" : "hidden"}><StepFeatures /></div>
              <div className={currentStep === 3 ? "block" : "hidden"}><StepPricing taxonomy={taxonomy} /></div>
              <div className={currentStep === 4 ? "block" : "hidden"}><StepPhotos vehicleId={vehicleId} /></div>
              <div className={currentStep === 5 ? "block" : "hidden"}><StepDescription taxonomy={taxonomy} /></div>
              <div className={currentStep === 6 ? "block" : "hidden"}><StepPreview taxonomy={taxonomy} /></div>
            </form>
          </Form>
        </div>

        <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))} disabled={currentStep === 1 || saveStatus === 'saving'} type="button">
            Previous
          </Button>
          
          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} disabled={saveStatus === 'saving'} type="button">
              {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Next Step"}
              {saveStatus !== 'saving' && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={saveStatus === 'saving'} type="button">
              {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Publish to Storefront"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}