"use client"

import { useEffect, useState } from "react"

const RECENT_KEY = "mota_recent_vehicles"
const MAX_RECENT = 10

export function useRecentVehicles() {
  const [recentIds, setRecentIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY)
      if (stored) {
        // Next.js requires localStorage to be hydrated post-mount to prevent server/client mismatches.
        // Since this effect only runs once on mount ([]), this state update is perfectly safe and will not cascade.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRecentIds(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Failed to parse recent vehicles", error)
    }
  }, [])

  const addRecentVehicle = (id: string) => {
    setRecentIds((prev) => {
      // Remove duplicate if exists, then add to front
      const filtered = prev.filter((v) => v !== id)
      const updated = [id, ...filtered].slice(0, MAX_RECENT)
      
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const clearRecentVehicles = () => {
    localStorage.removeItem(RECENT_KEY)
    setRecentIds([])
  }

  return { recentIds, addRecentVehicle, clearRecentVehicles }
}