import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import AuthForm from "./auth-form"
// Remove SupabaseClient import
// import { SupabaseClient } from "@supabase/supabase-js"
import { AuthViewType } from "@/lib/auth"

// Modified to remove supabase dependency
export function AuthDialog({ open, setOpen, view }: { open: boolean, setOpen: (open: boolean) => void, view: AuthViewType }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle></DialogTitle>
        <AuthForm view={view} />
      </DialogContent>
    </Dialog>
  )
}
