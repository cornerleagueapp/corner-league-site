export type PollStatus = "draft" | "active" | "closed";

export type PollCategory =
  | "fan_vote"
  | "sponsor_research"
  | "event_award"
  | "general";

export type PollVotingMode = "fixed_options" | "racer_search";

export interface PollOption {
  id: string;
  label: string;
  description?: string | null;
  imageUrl?: string | null;
  racerId?: string | null;
  sortOrder: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string | null;
  isFeatured: boolean;
  isPublic: boolean;
  coverImageUrl?: string | null;
  slug?: string | null;
  category: PollCategory;
  votingMode: PollVotingMode;
  status: PollStatus;
  startsAt?: string | null;
  endsAt?: string | null;
  organizationId?: string | null;
  eventId?: string | null;
  allowAnonymousVotes: boolean;
  showResultsBeforeClose: boolean;
  rewardTitle?: string | null;
  rewardDescription?: string | null;
  options: PollOption[];
  createdAt: string;
  updatedAt: string;
}

export interface PollResultOption {
  optionId?: string | null;
  racerId?: string | null;
  label: string;
  description?: string | null;
  imageUrl?: string | null;
  votes: number;
  percentage: number;
}

export interface PollResults {
  pollId: string;
  title: string;
  status: PollStatus;
  votingMode: PollVotingMode;
  totalVotes: number;
  userHasVoted?: boolean;
  selectedOptionId?: string | null;
  selectedRacerId?: string | null;
  options: PollResultOption[];
}

export interface VotePollPayload {
  optionId?: string;
  racerId?: string;
  racerName?: string;
  racerImageUrl?: string | null;
  anonymousVoterKey?: string;
  userId?: string;
}

export interface VotePollResponse {
  success: boolean;
  message: string;
  pollId: string;
  optionId?: string | null;
  racerId?: string | null;
}

export interface CreatePollOptionInput {
  label: string;
  description?: string | null;
  imageUrl?: string | null;
  racerId?: string | null;
  sortOrder?: number;
}

export interface CreatePollInput {
  title: string;
  description?: string | null;
  category: PollCategory;
  votingMode?: PollVotingMode;
  status: PollStatus;
  isFeatured?: boolean;
  isPublic?: boolean;
  coverImageUrl?: string | null;
  slug?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  organizationId?: string | null;
  eventId?: string | null;
  allowAnonymousVotes?: boolean;
  showResultsBeforeClose?: boolean;
  rewardTitle?: string | null;
  rewardDescription?: string | null;
  options: CreatePollOptionInput[];
}

export type UpdatePollInput = Partial<CreatePollInput>;

export interface AdminPollListItem {
  id: string;
  title: string;
  description?: string | null;
  category: PollCategory;
  votingMode: PollVotingMode;
  status: PollStatus;
  isFeatured: boolean;
  isPublic: boolean;
  coverImageUrl?: string | null;
  slug?: string | null;
  totalVotes: number;
  optionsCount: number;
  startsAt?: string | null;
  endsAt?: string | null;
  organizationId?: string | null;
  eventId?: string | null;
  createdAt: string;
  updatedAt: string;
}
