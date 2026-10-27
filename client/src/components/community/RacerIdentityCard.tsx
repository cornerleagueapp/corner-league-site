import type { PublicAthlete } from "@/lib/communityApi";
import AthleteAccountLinks from "@/components/sport-registration/AthleteAccountLinks";
export default function RacerIdentityCard({
  profile,
  isOwn,
  username,
}: {
  profile: PublicAthlete | null;
  isOwn: boolean;
  username: string;
}) {
  return (
    <AthleteAccountLinks
      username={username}
      racer={profile}
      variant="identity"
      isOwn={isOwn}
    />
  );
}
