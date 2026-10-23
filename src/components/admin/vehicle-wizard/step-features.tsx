"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { Plus, X } from "lucide-react"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function StepFeatures() {
  const { control, watch, setValue } = useFormContext()
  const [newFeature, setNewFeature] = useState("")
  
  const additionalFeatures = watch("features.additional_features") || []

  const handleAddFeature = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFeature.trim()) return
    setValue("features.additional_features", [...additionalFeatures, newFeature.trim()], { shouldValidate: true })
    setNewFeature("")
  }

  const handleRemoveFeature = (indexToRemove: number) => {
    // FIXED: Typed `_` as string to clear the 'any' error
    setValue("features.additional_features", additionalFeatures.filter((_: string, idx: number) => idx !== indexToRemove), { shouldValidate: true })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-heading font-semibold">Detailed Specifications</h2>
          <p className="text-sm text-muted-foreground">Fill in the performance and interior features for buyers to compare.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField control={control} name="features.horsepower" render={({ field }) => (
            <FormItem><FormLabel>Horsepower</FormLabel><FormControl><Input placeholder="e.g. 130 hp" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="features.torque" render={({ field }) => (
            <FormItem><FormLabel>Torque</FormLabel><FormControl><Input placeholder="e.g. 127 lb-ft" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="features.zero_to_hundred" render={({ field }) => (
            <FormItem><FormLabel>0-100 km/h</FormLabel><FormControl><Input placeholder="e.g. 9.5 seconds" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="features.fuel_efficiency" render={({ field }) => (
            <FormItem><FormLabel>Fuel Efficiency</FormLabel><FormControl><Input placeholder="e.g. 18 km/L" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="features.ground_clearance" render={({ field }) => (
            <FormItem><FormLabel>Ground Clearance</FormLabel><FormControl><Input placeholder="e.g. 5.5 inches" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="features.towing_capacity" render={({ field }) => (
            <FormItem><FormLabel>Towing Capacity</FormLabel><FormControl><Input placeholder="e.g. 1500 kg" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          
          <FormField control={control} name="features.seat_capacity" render={({ field }) => (
            <FormItem><FormLabel>Seat Capacity</FormLabel><FormControl><Input type="number" placeholder="e.g. 5" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="features.upholstery" render={({ field }) => (
            <FormItem>
              <FormLabel>Upholstery</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Fabric">Fabric</SelectItem>
                  <SelectItem value="Leather">Leather</SelectItem>
                  <SelectItem value="Synthetic Leather">Synthetic Leather</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={control} name="features.cargo_space" render={({ field }) => (
            <FormItem><FormLabel>Cargo Space</FormLabel><FormControl><Input placeholder="e.g. 16.6 cubic feet" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="features.climate_control" render={({ field }) => (
            <FormItem><FormLabel>Climate Control</FormLabel><FormControl><Input placeholder="e.g. Automatic Dual-Zone" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="features.sound_system" render={({ field }) => (
            <FormItem><FormLabel>Sound System</FormLabel><FormControl><Input placeholder="e.g. 4-speaker audio" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="features.infotainment" render={({ field }) => (
            <FormItem><FormLabel>Infotainment</FormLabel><FormControl><Input placeholder="e.g. 7-inch touchscreen, Bluetooth" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-xl font-heading font-semibold">Additional Features</h2>
        {/* FIXED: Properly escaped double quotes */}
        <p className="text-sm text-muted-foreground">Add specific highlights like &quot;Heated Seats&quot; or &quot;Electric Power Steering&quot;.</p>
        
        <div className="flex gap-2 items-start max-w-lg">
          <Input 
            placeholder="Type a feature and press Add..." 
            value={newFeature} 
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddFeature(e) }}
          />
          <Button onClick={handleAddFeature} type="button" variant="secondary"><Plus className="w-4 h-4 mr-2"/> Add</Button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {additionalFeatures.map((feat: string, index: number) => (
            <Badge key={index} variant="default" className="pl-3 pr-1.5 py-1.5 flex items-center gap-1 font-normal bg-muted text-foreground border hover:bg-muted">
              {feat}
              <Button size="icon" variant="ghost" className="h-5 w-5 ml-1 rounded-full hover:bg-destructive/20 hover:text-destructive" onClick={() => handleRemoveFeature(index)}>
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
          {additionalFeatures.length === 0 && <span className="text-sm text-muted-foreground italic">No additional features added.</span>}
        </div>
      </div>
    </div>
  )
}