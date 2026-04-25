// Compatibility shim that re-exports sonner's toast so source files importing
// "@/hooks/use-toast" keep working without modification.
import { toast as sonnerToast } from "sonner";

type ToastInput = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
} | string;

export const toast = (input: ToastInput, opts?: { description?: React.ReactNode; variant?: "default" | "destructive" }) => {
  if (typeof input === "string") {
    return sonnerToast(input, opts as any);
  }
  const title = input.title;
  const description = input.description;
  const variant = input.variant;
  if (variant === "destructive") {
    return sonnerToast.error(typeof title === "string" ? title : "Error", { description });
  }
  return sonnerToast(typeof title === "string" ? title : "", { description });
};

export const useToast = () => ({ toast });
