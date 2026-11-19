import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import * as Primitive from "@radix-ui/react-dialog";
export const ConcessionDialogContent = forwardRef<
  ElementRef<typeof Primitive.Content>,
  ComponentPropsWithoutRef<typeof Primitive.Content>
>(({ className = "", children, ...props }, ref) => (
  <Primitive.Portal>
    <Primitive.Overlay className="cc-overlay" />
    <Primitive.Content
      {...props}
      ref={ref}
      className={`cc-dialog ${className}`}
    >
      <div className="cc-dialog-body">{children}</div>
      <Primitive.Close className="cc-dialog-close" aria-label="Close dialog">
        <span aria-hidden="true">×</span>
      </Primitive.Close>
    </Primitive.Content>
  </Primitive.Portal>
));
ConcessionDialogContent.displayName = "ConcessionDialogContent";
