// src/components/admin/vehicle-wizard/step-description.tsx
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import type { TaxonomyData } from "./wizard-shell"

export function StepDescription({ taxonomy }: { taxonomy: TaxonomyData }) {
  const { control, watch, setValue } = useFormContext()
  const selectedCategories: string[] = watch("category_ids") || []

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setValue(
        "category_ids",
        selectedCategories.filter((val: string) => val !== id),
        { shouldDirty: true }
      )
    } else {
      setValue("category_ids", [...selectedCategories, id], { shouldDirty: true })
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
              <FormLabel>
                Listing Title <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. 2021 Toyota Harrier Z Leather Package"
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Public Description (min. 20 characters) <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detail the key selling points, auction grade, service history, and condition..."
                  className="min-h-[150px]"
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
          name="is_featured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Feature on Homepage</FormLabel>
                <FormDescription>
                  Pin this vehicle to the homepage Featured Inventory section and boost its search ranking.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4 pt-4 border-t">
        <FormLabel className="text-base font-semibold">Lifestyle Categories</FormLabel>
        <p className="text-sm text-muted-foreground mb-4">
          Tag the vehicle to appear in specific storefront filters.
        </p>

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