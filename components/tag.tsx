import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const tagVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-border text-foreground hover:bg-muted/50",
        outlined: "border-border text-foreground bg-muted/40 hover:bg-muted/50",
        primary: "border-primary text-primary hover:bg-primary/10",
        secondary: "border-secondary text-secondary hover:bg-secondary/10",
        destructive:
          "border-destructive text-destructive hover:bg-destructive/10",
        success: "border-green-500 text-green-500 hover:bg-green-500/10",
        warning: "border-amber-500 text-amber-500 hover:bg-amber-500/10",
      },
      size: {
        sm: "h-5 text-[10px]",
        md: "h-6",
        lg: "h-7 px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface TagProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tagVariants> {
  onRemove?: () => void;
}

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  ({ className, variant, size, onRemove, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(tagVariants({ variant, size }), className)}
        {...props}
      >
        <span>{children}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 -mr-1 h-3.5 w-3.5 rounded-full hover:bg-muted/30 inline-flex items-center justify-center"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove</span>
          </button>
        )}
      </div>
    );
  }
);
Tag.displayName = "Tag";

export { Tag, tagVariants };
