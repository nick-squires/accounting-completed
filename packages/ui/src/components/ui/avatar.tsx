"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "../../lib/utils"

const AvatarRoot = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-lg",
      className
    )}
    {...props}
  />
))
AvatarRoot.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-lg bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Square Avatar wrapper with gradient (from ui.jsx)
interface AvatarProps {
  name?: string;
  src?: string;
  size?: number;
  className?: string;
}

function Avatar({ name, src, size = 32, className }: AvatarProps) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  return (
    <AvatarRoot
      className={cn("rounded-lg bg-gradient-to-br from-[hsl(207_45%_85%)] to-[hsl(207_35%_72%)] text-primary", className)}
      style={{ width: size, height: size }}
    >
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className="bg-transparent text-primary text-xs font-semibold rounded-lg">
        {initials}
      </AvatarFallback>
    </AvatarRoot>
  );
}

// Round AvatarRound wrapper with gradient (from ui.jsx)
function AvatarRound({ name, src, size = 28, className }: AvatarProps) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  return (
    <AvatarRoot
      className={cn("rounded-full bg-gradient-to-br from-[hsl(213_25%_88%)] to-[hsl(213_18%_72%)] text-foreground", className)}
      style={{ width: size, height: size }}
    >
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className="bg-transparent text-foreground text-xs font-semibold rounded-full">
        {initials}
      </AvatarFallback>
    </AvatarRoot>
  );
}

export { Avatar, AvatarRound, AvatarRoot, AvatarImage, AvatarFallback }
