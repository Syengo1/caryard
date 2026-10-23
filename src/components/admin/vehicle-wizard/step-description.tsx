"use client"

import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { TaxonomyData } from "./wizard-shell"

export function StepDescription({ taxonomy }: { taxonomy: TaxonomyData }) {
  const { control, watch, setValue } = useFormContext()
  const selectedCategories = watch("category_ids") || []

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setValue("category_ids", selectedCategories.filter((val: string) => val !== id))
    } else {
      setValue("category_ids", [...selectedCategories, id])
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-heading font-semibold">Marketing & SEO</h2>
          <p className="text-sm text-muted-foreground">Craft the public listing details.</p>
        </div>

        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Listing Title <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input placeholder="e.g. 2021 Toyota Harrier Premium Edition" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Public Description <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detail the key selling points, service history, and condition..." 
                  className="min-h-[150px]" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4 pt-4 border-t">
        <FormLabel className="text-base font-semibold">Lifestyle Categories</FormLabel>
        <p className="text-sm text-muted-foreground mb-4">Tag the vehicle to appear in specific storefront filters.</p>
        
        <div className="flex flex-wrap gap-2">
          {taxonomy.categories.map((cat) => {
            const isSelected = selectedCategories.includes(cat.id)
            return (
              <Badge
                key={cat.id}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer text-sm py-1.5 px-3"
                onClick={() => toggleCategory(cat.id)}
              >
                {cat.name}
              </Badge>
            )
          })}
        </div>
      </div>
    </div>
  )
}