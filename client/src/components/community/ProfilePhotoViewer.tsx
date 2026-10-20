import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import AccountAvatar from "./AccountAvatar";
import { safeProfileImage } from "@/lib/profileDirectory";
export default function ProfilePhotoViewer({
  picture,
  username,
}: {
  picture?: string | null;
  username: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const source = safeProfileImage(picture);
  if (!source || failed === source)
    return (
      <AccountAvatar username={username} className="profile-main-avatar" />
    );
  return (
    <Dialog.Root>
      <Dialog.Trigger
        className="profile-photo-trigger"
        aria-label={`View @${username}'s profile photo full screen`}
      >
        <img
          className="profile-main-avatar"
          src={source}
          alt={`${username} profile`}
          onError={() => setFailed(source)}
        />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="profile-photo-overlay" />
        <Dialog.Content
          className="profile-photo-viewer"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">
            {username}'s profile photo
          </Dialog.Title>
          <Dialog.Close
            className="profile-photo-close"
            aria-label="Close profile photo"
          >
            <X size={24} />
          </Dialog.Close>
          <img
            src={source}
            alt={`${username} profile photo`}
            onError={() => setFailed(source)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
