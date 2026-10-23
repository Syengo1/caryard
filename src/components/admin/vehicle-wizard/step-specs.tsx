"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { Check, ChevronsUpDown, Loader2, PlusCircle } from "lucide-react"
import { toast } from "sonner"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { createMake, createModel } from "@/lib/actions/catalog-actions"
import type { TaxonomyData } from "./wizard-shell"

const BODY_TYPES = [
  "Saloon", "Hatchback", "SUV", "Station Wagon", "Pickup", 
  "Mini-Van", "Crossover", "Coupe", "Convertible", "Van", "Truck"
]

export function StepSpecs({ taxonomy }: { taxonomy: TaxonomyData }) {
  const { control, watch, setValue, clearErrors } = useFormContext()
  
  const [localMakes, setLocalMakes] = useState(taxonomy.makes)
  const [localModels, setLocalModels] = useState(taxonomy.models)

  const [openMake, setOpenMake] = useState(false)
  const [openModel, setOpenModel] = useState(false)
  
  const [makeSearch, setMakeSearch] = useState("")
  const [modelSearch, setModelSearch] = useState("")

  const [isCreatingMake, setIsCreatingMake] = useState(false)
  const [isCreatingModel, setIsCreatingModel] = useState(false)

  const selectedMakeId = watch("make_id")
  const filteredModels = localModels.filter((m) => m.make_id === selectedMakeId)

  const handleCreateMake = async (name: string, fieldOnChange: (val: string) => void) => {
    if (!name.trim()) return
    setIsCreatingMake(true)
    const res = await createMake(name.trim())
    setIsCreatingMake(false)

    if (res.success && res.data) {
      setLocalMakes((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)))
      fieldOnChange(res.data.id)
      clearErrors("make_id")
      setValue("model_id", undefined)
      setOpenMake(false)
      setMakeSearch("")
      toast.success(`Make "${res.data.name}" added successfully!`)
    } else {
      toast.error(res.error || "Failed to create Make")
    }
  }

  const handleCreateModel = async (name: string, fieldOnChange: (val: string) => void) => {
    if (!selectedMakeId || !name.trim()) return
    setIsCreatingModel(true)
    const res = await createModel(selectedMakeId, name.trim())
    setIsCreatingModel(false)

    if (res.success && res.data) {
      const newModel = { ...res.data, default_body_type: null }
      setLocalModels((prev) => [...prev, newModel].sort((a, b) => a.name.localeCompare(b.name)))
      
      fieldOnChange(newModel.id)
      clearErrors("model_id")
      setOpenModel(false)
      setModelSearch("")
      toast.success(`Model "${newModel.name}" added successfully!`)
    } else {
      toast.error(res.error || "Failed to create Model")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h2 className="text-xl font-heading font-semibold">Core Specifications</h2>
        <p className="text-sm text-muted-foreground">Select or search for the vehicle make and model.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="make_id"
          render={({ field }) => (
            <FormItem className="flex flex-col mt-2">
              <FormLabel>Make <span className="text-destructive">*</span></FormLabel>
              <Popover open={openMake} onOpenChange={setOpenMake}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" role="combobox" aria-expanded={openMake} className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}>
                      {field.value ? localMakes.find((make) => make.id === field.value)?.name : "Search makes..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] md:w-[380px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search makes..." value={makeSearch} onValueChange={setMakeSearch} />
                    <CommandList>
                      <CommandEmpty className="p-4 text-center text-sm flex flex-col items-center">
                        <span className="text-muted-foreground mb-3">No make found.</span>
                        <Button size="sm" variant="secondary" className="w-full" onClick={() => handleCreateMake(makeSearch, field.onChange)} disabled={isCreatingMake || !makeSearch.trim()}>
                          {isCreatingMake ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                          Add &quot;{makeSearch}&quot; to database
                        </Button>
                      </CommandEmpty>
                      <CommandGroup>
                        {localMakes.map((make) => (
                          <CommandItem
                            key={make.id}
                            value={make.name}
                            onSelect={() => {
                              field.onChange(make.id)
                              clearErrors("make_id")
                              setValue("model_id", undefined)
                              setOpenMake(false)
                              setMakeSearch("")
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", make.id === field.value ? "opacity-100" : "opacity-0")} />
                            {make.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="model_id"
          render={({ field }) => (
            <FormItem className="flex flex-col mt-2">
              <FormLabel>Model <span className="text-destructive">*</span></FormLabel>
              <Popover open={openModel} onOpenChange={setOpenModel}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" role="combobox" aria-expanded={openModel} disabled={!selectedMakeId} className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}>
                      {field.value ? filteredModels.find((model) => model.id === field.value)?.name : selectedMakeId ? "Search models..." : "Select a Make first"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] md:w-[380px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search models..." value={modelSearch} onValueChange={setModelSearch} />
                    <CommandList>
                      <CommandEmpty className="p-4 text-center text-sm flex flex-col items-center">
                        <span className="text-muted-foreground mb-3">No model found.</span>
                        <Button size="sm" variant="secondary" className="w-full" onClick={() => handleCreateModel(modelSearch, field.onChange)} disabled={isCreatingModel || !modelSearch.trim()}>
                          {isCreatingModel ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                          Add &quot;{modelSearch}&quot; to database
                        </Button>
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredModels.map((model) => (
                          <CommandItem
                            key={model.id}
                            value={model.name}
                            onSelect={() => {
                              field.onChange(model.id)
                              clearErrors("model_id")
                              if (model.default_body_type) {
                                setValue("body_type", model.default_body_type, { shouldValidate: true })
                              }
                              setOpenModel(false)
                              setModelSearch("")
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", model.id === field.value ? "opacity-100" : "opacity-0")} />
                            {model.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year of Manufacture <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input type="number" placeholder="2021" {...field} value={field.value || ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="body_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select Body Type" /></SelectTrigger></FormControl>
                <SelectContent>
                  {BODY_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="transmission"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transmission</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="fuel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fuel Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="plug_in_hybrid">Plug-in Hybrid</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="drive"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Drive Type <span className="text-destructive">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select Drive" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="2WD">2WD</SelectItem>
                  <SelectItem value="4WD">4WD</SelectItem>
                  <SelectItem value="AWD">AWD</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="engine_cc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Engine Size (CC)</FormLabel>
              <FormControl><Input type="number" placeholder="e.g. 1500" {...field} value={field.value || ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="exterior_color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exterior Color</FormLabel>
              <FormControl><Input placeholder="e.g. Pearl White" {...field} value={field.value || ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="interior_color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interior Color</FormLabel>
              <FormControl><Input placeholder="e.g. Black Leather" {...field} value={field.value || ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}