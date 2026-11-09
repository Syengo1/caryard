// src/components/vehicles/finance-estimator.tsx
"use client"

import React, { useState, useMemo } from "react"
import { Calculator, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const TENURE_OPTIONS = [12, 24, 36, 48, 60]

export function FinanceEstimator({
  priceKes,
  minDepositPct = 30,
  defaultMonths = 24,
  annualInterestPct = 14,
  onApplyFinancing,
}: {
  priceKes: number | null
  minDepositPct?: number
  defaultMonths?: number
  annualInterestPct?: number
  onApplyFinancing?: (plan: {
    depositKes: number
    months: number
    monthlyInstallmentKes: number
  }) => void
}) {
  const basePrice = priceKes && priceKes > 0 ? priceKes : 2_500_000
  const [depositPct, setDepositPct] = useState(Math.max(10, minDepositPct))
  const [months, setMonths] = useState(
    TENURE_OPTIONS.includes(defaultMonths) ? defaultMonths : 24
  )

  const calculation = useMemo(() => {
    const depositKes = Math.round((basePrice * depositPct) / 100)
    const principal = Math.max(0, basePrice - depositKes)
    const monthlyRate = annualInterestPct / 100 / 12

    let monthlyInstallmentKes = 0
    if (monthlyRate > 0 && months > 0) {
      const factor = Math.pow(1 + monthlyRate, months)
      monthlyInstallmentKes = Math.round(
        (principal * (monthlyRate * factor)) / (factor - 1)
      )
    } else if (months > 0) {
      monthlyInstallmentKes = Math.round(principal / months)
    }

    return {
      depositKes,
      principal,
      monthlyInstallmentKes,
    }
  }, [basePrice, depositPct, months, annualInterestPct])

  if (!priceKes) return null

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-foreground">
              Asset Financing Calculator
            </h3>
            <p className="text-xs text-muted-foreground">
              Estimated bank &amp; hire-purchase monthly plan ({annualInterestPct}% p.a.)
            </p>
          </div>
        </div>
      </div>

      {/* Deposit Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="font-medium text-muted-foreground">
            Initial Deposit ({depositPct}%)
          </span>
          <span className="font-heading font-bold text-foreground">
            KSh {calculation.depositKes.toLocaleString("en-KE")}
          </span>
        </div>
        <input
          type="range"
          min={minDepositPct}
          max={80}
          step={5}
          value={depositPct}
          onChange={(e) => setDepositPct(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>Min {minDepositPct}%</span>
          <span>50%</span>
          <span>80%</span>
        </div>
      </div>

      {/* Repayment Period Pills */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Repayment Period (Months)
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {TENURE_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonths(m)}
              className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                months === m
                  ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                  : "bg-background text-foreground border-border hover:border-primary/40"
              }`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>

      {/* Estimated Monthly Output Box */}
      <div className="rounded-xl bg-primary/8 border border-primary/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Estimated Monthly Installment
          </p>
          <p className="text-2xl font-heading font-extrabold text-foreground mt-0.5">
            KSh {calculation.monthlyInstallmentKes.toLocaleString("en-KE")}
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              / month
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Financed amount: KSh {calculation.principal.toLocaleString("en-KE")}
          </p>
        </div>

        {onApplyFinancing && (
          <Button
            type="button"
            onClick={() =>
              onApplyFinancing({
                depositKes: calculation.depositKes,
                months,
                monthlyInstallmentKes: calculation.monthlyInstallmentKes,
              })
            }
            className="rounded-xl bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground font-semibold text-xs px-4 shrink-0"
          >
            Apply with This Plan
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}