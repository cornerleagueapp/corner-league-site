import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";
import { useLocation } from "wouter";
import UserSearchPanel from "./UserSearchPanel";

export default function ProfileUserSearch() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  useEffect(() => setOpen(false), [location]);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="profile-search-trigger">
        <Search size={18} aria-hidden="true" /> Search Users
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="profile-search-overlay" />
        <Dialog.Content className="profile-search-dialog">
          <Dialog.Title className="text-xl font-bold">Search Users</Dialog.Title>
          <Dialog.Description className="mt-2 pr-6 text-sm text-cl-muted">
            Find your community by name or username.
          </Dialog.Description>
          <Dialog.Close className="profile-search-close" aria-label="Close user search">
            <X size={20} aria-hidden="true" />
          </Dialog.Close>
          <UserSearchPanel />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
