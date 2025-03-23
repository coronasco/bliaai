"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  variant = "default",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  variant?: "default" | "blue" | "emerald" | "amber" | "purple"
}) {
  const indicatorClassName = {
    default: "bg-green-500",
    blue: "bg-gradient-to-r from-blue-500 to-blue-600",
    emerald: "bg-gradient-to-r from-emerald-500 to-emerald-600",
    amber: "bg-gradient-to-r from-amber-500 to-amber-600",
    purple: "bg-gradient-to-r from-purple-500 to-purple-600"
  }[variant];

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-gray-800 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full w-full flex-1 transition-all", indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
