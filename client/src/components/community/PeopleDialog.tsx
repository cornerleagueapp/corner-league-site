import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { X } from "lucide-react";
import { PeoplePanel } from "./UserSocialControls";
export default function PeopleDialog({
  username,
  kind,
  onClose,
  returnFocus,
}: {
  username: string;
  kind: "followers" | "following";
  onClose: () => void;
  returnFocus: HTMLElement | null;
}) {
  const [location] = useLocation();
  const initial = useRef(location);
  useEffect(() => {
    if (location !== initial.current) onClose();
  }, [location, onClose]);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="community-dialog-overlay" />
        <Dialog.Content
          className="community-people-dialog"
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocus?.focus();
          }}
        >
          <Dialog.Title className="text-xl font-bold">
            {kind === "followers" ? "Followers" : "Following users"}
          </Dialog.Title>
          <Dialog.Close
            className="community-dialog-close"
            aria-label="Close people"
          >
            <X size={22} />
          </Dialog.Close>
          <PeoplePanel username={username} kind={kind} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
