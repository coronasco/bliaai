import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-gray-500/50 transition-all overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gray-800 text-gray-100",
        secondary:
          "border-transparent bg-gray-700 text-gray-200",
        destructive:
          "border-transparent bg-gradient-to-r from-red-600 to-red-700 text-white",
        outline:
          "border-gray-700 bg-gray-800 text-gray-100",
        success:
          "border-transparent bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
        warning:
          "border-transparent bg-gradient-to-r from-amber-500 to-amber-600 text-white",
        info:
          "border-transparent bg-gradient-to-r from-blue-500 to-blue-600 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
