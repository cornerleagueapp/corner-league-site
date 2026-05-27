export type RacerSkillLevel = "junior" | "amateur" | "pro";

export type Racer = {
  id: string | number;
  athleteId?: string;
  racerName: string;
  nickname?: string | null;
  skillLevel?: RacerSkillLevel | null;
  racerAge?: number;
  dateOfBirth?: string | null;
  bio?: string | null;
  racerImage?: string | null;
  headerImageUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  facebookUrl?: string | null;
  websiteUrl?: string | null;
  location?: string | null;

  formattedAddress?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  placeId?: string | null;
  locationProvider?: string | null;

  boatManufacturers?: string | null;
  careerWins?: number;
  seasonWins?: number;
  seasonPodiums?: number;
  careerWorldFinalsWins?: number;
  height?: number | null;
  weight?: number | null;
  claimedByUserId?: string | null;
  claimedByUsername?: string | null;
  isClaimed?: boolean;
};

export type AthleteHistoryItem = {
  resultId: string;
  athleteId: string;
  eventId?: string | null;
  eventName?: string | null;
  eventStartDate?: string | null;
  divisionId?: string | null;
  divisionName?: string | null;
  matchId: string;
  matchName?: string | null;
  motoId?: string | null;
  motoSequence?: number | null;
  position?: number | null;
  score?: number | null;
  status?: string | null;
};

export type RacerRatingCard = {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteImage?: string | null;
  stateCode?: string | null;
  countryCode?: string | null;
  classGroupCode?: string | null;
  classGroupName?: string | null;
  rankingPeriodName?: string | null;
  seasonYear?: number | null;
  overallRating?: number | null;
  speedRating?: number | null;
  consistencyRating?: number | null;
  strengthRating?: number | null;
  momentumRating?: number | null;
  versatilityRating?: number | null;
  activityRating?: number | null;
  confidenceScore?: number | null;
  racesCount?: number | null;
  winsCount?: number | null;
  podiumsCount?: number | null;
  computedAt?: string | null;

  nationalRankingPosition?: number | null;
  nationalRankingScore?: number | null;

  organizationRankingPosition?: number | null;
  organizationRankingScore?: number | null;
  organizationId?: string | null;
  organizationName?: string | null;
  organizationAbbreviation?: string | null;
};

export type RacerGalleryItem = {
  id: string;
  athleteId?: string;
  athlete_id?: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string | null;
  thumbnail_url?: string | null;
  title?: string | null;
  caption?: string | null;
  sortOrder?: number;
  sort_order?: number;
  isFeatured?: boolean;
  is_featured?: boolean;
  createdAt?: string;
  created_at?: string;
};

export type RacerSponsor = {
  id: string;
  athleteId?: string;
  athlete_id?: string;
  name: string;
  logoUrl?: string | null;
  logo_url?: string | null;
  websiteUrl?: string | null;
  website_url?: string | null;
  sortOrder?: number;
  sort_order?: number;
};

export type SponsorDraft = {
  id: string;
  name: string;
  websiteUrl?: string;
  logoFile?: File | null;
};

export type GalleryUploadDraft = {
  id: string;
  title: string;
  caption: string;
  file: File | null;
  isFeatured: boolean;
};

export type EditValues = {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  skillLevel?: RacerSkillLevel;
  dateOfBirth?: string;
  bio?: string;
  heightInches?: number | string;
  origin?: string;
  boatManufacturers?: string;

  formattedAddress?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  placeId?: string | null;
  locationProvider?: string | null;
  city?: string | null;
  stateCode?: string | null;
  countryCode?: string | null;

  instagramUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  websiteUrl?: string;

  imageFile?: File | null;
  headerImageFile?: File | null;

  sponsorsToCreate?: SponsorDraft[];
};
