"use client"

import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { TaxonomyData } from "./wizard-shell"

export function StepPricing({ taxonomy }: { taxonomy: TaxonomyData }) {
  const { control } = useFormContext()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-heading font-semibold">Commerce & Location</h2>
          <p className="text-sm text-muted-foreground">Pricing, mileage, and current showroom location.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="price_kes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Listing Price (KES)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 4200000" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="mileage_km"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mileage (km)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 38000" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="foreign_used">Foreign Used</SelectItem>
                    <SelectItem value="locally_used">Locally Used</SelectItem>
                    <SelectItem value="brand_new">Brand New</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="showroom_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Showroom Location</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {taxonomy.showrooms.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="is_negotiable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Price Negotiable</FormLabel>
                <FormDescription>Show a &quot;Negotiable&quot; badge next to the price.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-6 pt-6 border-t">
        <div>
          <h2 className="text-xl font-heading font-semibold text-destructive">Private Internal Data</h2>
          <p className="text-sm text-muted-foreground">Hidden from public. Only visible to active staff and admins.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="vin_or_chassis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VIN / Chassis Number</FormLabel>
                <FormControl><Input placeholder="Internal tracking number" {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="purchase_price_kes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Price / Reserve (KES)</FormLabel>
                <FormControl><Input type="number" placeholder="Cost price" {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name="internal_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Staff Notes</FormLabel>
              <FormControl><Textarea placeholder="Supplier details, transport damage, minimum acceptable bid..." className="resize-none" {...field} value={field.value || ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}