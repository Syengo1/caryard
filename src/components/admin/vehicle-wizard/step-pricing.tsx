// src/components/admin/vehicle-wizard/step-pricing.tsx
"use client"

import { useFormContext } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
          <p className="text-sm text-muted-foreground">
            Pricing, mileage, stock status, and showroom location.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="price_kes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Listing Price (KES) <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g. 4200000"
                    {...field}
                    value={field.value ?? ""}
                  />
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
                <FormLabel>
                  Mileage (km) <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g. 38000"
                    {...field}
                    value={field.value ?? ""}
                  />
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
                <FormLabel>
                  Condition <span className="text-destructive">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                  </FormControl>
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
            name="inventory_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inventory Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "in_stock"}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select inventory status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="in_transit">In Transit (Importing)</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
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
                <FormLabel>
                  Showroom Location <span className="text-destructive">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {taxonomy.showrooms.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="stock_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Yard Stock Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Auto-generated (e.g. CY-123456)"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
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
                <FormDescription>
                  Show a &quot;Negotiable&quot; badge next to the price.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-6 pt-6 border-t">
        <div>
          <h2 className="text-xl font-heading font-semibold text-destructive">
            Private Internal Data
          </h2>
          <p className="text-sm text-muted-foreground">
            Hidden from public. Only visible to active staff and admins.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={control}
            name="vin_or_chassis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VIN / Chassis Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Internal tracking number"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="purchase_price_kes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Price / Cost (KES)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Landed cost price"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="supplier_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier / Auction House</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. USS Tokyo / Local Trade-in"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
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
              <FormControl>
                <Textarea
                  placeholder="Supplier details, inspection sheet remarks, minimum acceptable reserve price..."
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}