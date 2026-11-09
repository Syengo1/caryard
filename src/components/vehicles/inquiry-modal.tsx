// src/components/vehicles/inquiry-modal.tsx
"use client"

import React, { useState } from "react"
import { Loader2, CheckCircle2, CarFront } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitPublicLead } from "@/lib/actions/lead-actions"

export type InquiryLeadType =
  | "general_inquiry"
  | "test_drive"
  | "trade_in"
  | "financing"

export function InquiryModal({
  open,
  onOpenChange,
  vehicleId,
  vehicleTitle,
  stockNumber,
  defaultTab = "general_inquiry",
  prefilledFinance,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicleId: string
  vehicleTitle: string
  stockNumber: string
  defaultTab?: InquiryLeadType
  prefilledFinance?: {
    depositKes: number
    months: number
    monthlyInstallmentKes: number
  } | null
}) {
  const [leadType, setLeadType] = useState<InquiryLeadType>(defaultTab)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [message, setMessage] = useState("")
  const [tradeInMake, setTradeInMake] = useState("")
  const [tradeInModel, setTradeInModel] = useState("")
  const [tradeInYear, setTradeInYear] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Track the previous 'open' state to reset the form cleanly when the modal opens
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setLeadType(defaultTab)
      setIsSuccess(false)
      // Optionally reset form fields here if you want a blank slate every time it opens:
      // setCustomerName("")
      // setCustomerPhone("")
      // setCustomerEmail("")
      // setMessage("")
      // setTradeInMake("")
      // setTradeInModel("")
      // setTradeInYear("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const res = await submitPublicLead({
      vehicle_id: vehicleId,
      lead_type: leadType,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      message:
        message ||
        `Inquiry regarding ${vehicleTitle} (Stock #${stockNumber})`,
      metadata: {
        ...(leadType === "trade_in"
          ? {
              trade_in_make: tradeInMake || undefined,
              trade_in_model: tradeInModel || undefined,
              trade_in_year: tradeInYear ? Number(tradeInYear) : undefined,
            }
          : {}),
        ...(leadType === "financing" && prefilledFinance
          ? {
              financing_deposit_kes: prefilledFinance.depositKes,
              financing_period_months: prefilledFinance.months,
            }
          : {}),
      },
    })

    setIsSubmitting(false)

    if (res.success) {
      setIsSuccess(true)
      toast.success("Your request has been sent to our showroom team!")
    } else {
      const firstFieldError = res.fieldErrors
        ? Object.values(res.fieldErrors)[0]?.[0]
        : null
      toast.error(firstFieldError || res.error || "Failed to send inquiry.")
    }
  }

  const tabs: { id: InquiryLeadType; label: string }[] = [
    { id: "general_inquiry", label: "Inquire" },
    { id: "test_drive", label: "Test Drive" },
    { id: "trade_in", label: "Trade-In" },
    { id: "financing", label: "Financing" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            Showroom Concierge
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-xs">
            <CarFront className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">
              {vehicleTitle} • Stock #{stockNumber}
            </span>
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-heading font-bold">
                Request Received!
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Our sales executive will contact you shortly on{" "}
                <span className="font-semibold text-foreground">
                  {customerPhone}
                </span>
                .
              </p>
            </div>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full px-6 bg-primary text-primary-foreground"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Inquiry Type Switcher */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-muted">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLeadType(tab.id)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    leadType === tab.id
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="lead-name">
                  Full Name <span className="text-brand-red">*</span>
                </Label>
                <Input
                  id="lead-name"
                  required
                  placeholder="e.g. Anton Mwangi"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lead-phone">
                  Kenyan Phone <span className="text-brand-red">*</span>
                </Label>
                <Input
                  id="lead-phone"
                  required
                  placeholder="e.g. 0712 345 678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lead-email">Email Address (Optional)</Label>
              <Input
                id="lead-email"
                type="email"
                placeholder="you@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>

            {/* Trade-in Extra Fields */}
            {leadType === "trade_in" && (
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-muted/50 border border-border/60">
                <div className="space-y-1">
                  <Label className="text-xs">Your Car Make</Label>
                  <Input
                    placeholder="e.g. Toyota"
                    value={tradeInMake}
                    onChange={(e) => setTradeInMake(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Model</Label>
                  <Input
                    placeholder="e.g. Fielder"
                    value={tradeInModel}
                    onChange={(e) => setTradeInModel(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Year</Label>
                  <Input
                    type="number"
                    placeholder="2017"
                    value={tradeInYear}
                    onChange={(e) => setTradeInYear(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="lead-msg">Message / Preferred Viewing Time</Label>
              <Textarea
                id="lead-msg"
                placeholder="Let us know when you'd like to inspect this unit..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl h-11 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Request...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}