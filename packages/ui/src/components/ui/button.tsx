import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-card text-foreground border border-border hover:bg-secondary hover:border-border-strong",
        primary: "bg-action text-action-foreground font-semibold hover:bg-action-hover border border-action",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent",
        ghost: "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent",
        outline: "bg-transparent text-foreground border border-border hover:bg-secondary hover:border-border-strong",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive",
        link: "bg-transparent text-primary underline-offset-4 hover:underline border border-transparent p-0 h-auto",
      },
      size: {
        default: "h-8 px-3 text-[13.5px]",
        sm: "h-[26px] px-2 text-[12px]",
        lg: "h-9 px-4 text-[14px]",
        icon: "h-8 w-8 p-0 justify-center",
        "icon-sm": "h-[26px] w-[26px] p-0 justify-center",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
