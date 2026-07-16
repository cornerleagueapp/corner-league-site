import type {
  DemoRegistration,
  RegistrationEvent,
  RegistrationOrganization,
  RegistrationRacer,
} from "../types/registration.types";

export const demoRegistrationOrganizations: RegistrationOrganization[] = [
  {
    id: "org-ijsba",
    slug: "ijsba",
    name: "International Jet Sports Boating Association",
    abbreviation: "IJSBA",
    description:
      "International sanctioning organization supporting personal watercraft racing events, racers, teams, and promoters.",
    logoUrl: null,
    coverImageUrl: null,
    city: "Lake Havasu City",
    stateCode: "AZ",
    countryCode: "US",
    websiteUrl: "https://ijsba.com",
    squareConnected: false,
  },
  {
    id: "org-rpm-racing",
    slug: "rpm-racing-enterprises",
    name: "RPM Racing Enterprises",
    abbreviation: "RPM",
    description:
      "Personal watercraft race promotion and event organization serving racers throughout the western United States.",
    logoUrl: null,
    coverImageUrl: null,
    city: "Lake Havasu City",
    stateCode: "AZ",
    countryCode: "US",
    websiteUrl: null,
    squareConnected: false,
  },
];

export const demoRegistrationEvents: RegistrationEvent[] = [
  {
    id: "event-2026-lake-havasu-open",
    slug: "2026-lake-havasu-open",

    organizationId: "org-ijsba",
    organizationName: "International Jet Sports Boating Association",
    organizationAbbreviation: "IJSBA",

    name: "2026 Lake Havasu Open",
    description:
      "Join racers from across the United States and around the world for a full weekend of personal watercraft racing in Lake Havasu City.",

    city: "Lake Havasu City",
    stateCode: "AZ",
    countryCode: "US",
    formattedLocation: "Lake Havasu City, Arizona, United States",

    startDate: "2026-09-19T08:00:00.000Z",
    endDate: "2026-09-20T18:00:00.000Z",

    registrationOpenDate: "2026-07-15T08:00:00.000Z",
    registrationCloseDate: "2026-09-14T23:59:59.000Z",
    registrationStatus: "open",

    coverImageUrl: null,

    platformFee: 8,
    processingFee: 5.25,

    allowOnlinePayment: true,
    allowCashPayment: true,

    confirmedRacerCount: 12,

    refundPolicy:
      "Registration refunds and class transfers are subject to organizer approval. Cancelled classes may be transferred or refunded.",

    cashPaymentInstructions:
      "Cash registrations remain pending until the race organization confirms payment.",

    classes: [
      {
        id: "class-pro-ski-gp",
        eventId: "event-2026-lake-havasu-open",
        name: "Pro Ski GP",
        code: "SKI_GP",
        description:
          "Professional-level stand-up ski competition for modified and high-performance watercraft.",
        price: 165,
        availableDays: ["saturday", "sunday"],
        capacity: 30,
        confirmedRacerCount: 4,
        isOpen: true,
        displayOrder: 1,
      },
      {
        id: "class-amateur-ski-stock",
        eventId: "event-2026-lake-havasu-open",
        name: "Amateur Ski Stock",
        code: "SKI_STOCK_AM",
        description:
          "Amateur stand-up ski class using stock-production watercraft rules.",
        price: 135,
        availableDays: ["saturday"],
        capacity: 30,
        confirmedRacerCount: 3,
        isOpen: true,
        displayOrder: 2,
      },
      {
        id: "class-pro-runabout-gp",
        eventId: "event-2026-lake-havasu-open",
        name: "Pro Runabout GP",
        code: "RUNABOUT_GP",
        description:
          "Professional runabout competition featuring high-performance modified watercraft.",
        price: 185,
        availableDays: ["sunday"],
        capacity: 24,
        confirmedRacerCount: 2,
        isOpen: true,
        displayOrder: 3,
      },
      {
        id: "class-novice-runabout-stock",
        eventId: "event-2026-lake-havasu-open",
        name: "Novice Runabout Stock",
        code: "RUNABOUT_STOCK_NV",
        description:
          "Entry-level runabout class intended for newer racers using stock watercraft.",
        price: 120,
        availableDays: ["saturday", "sunday"],
        capacity: 30,
        confirmedRacerCount: 2,
        isOpen: true,
        displayOrder: 4,
      },
      {
        id: "class-junior-ski",
        eventId: "event-2026-lake-havasu-open",
        name: "Junior Ski",
        code: "JUNIOR_SKI",
        description:
          "Junior stand-up ski competition. Guardian registration and consent may be required.",
        price: 95,
        availableDays: ["saturday"],
        capacity: 20,
        confirmedRacerCount: 1,
        isOpen: true,
        displayOrder: 5,
      },
    ],
  },
  {
    id: "event-2026-socal-summer-classic",
    slug: "2026-socal-summer-classic",

    organizationId: "org-rpm-racing",
    organizationName: "RPM Racing Enterprises",
    organizationAbbreviation: "RPM",

    name: "2026 Southern California Summer Classic",
    description:
      "A two-day regional race weekend featuring ski and runabout competition for novice, amateur, and professional racers.",

    city: "Long Beach",
    stateCode: "CA",
    countryCode: "US",
    formattedLocation: "Long Beach, California, United States",

    startDate: "2026-10-10T08:00:00.000Z",
    endDate: "2026-10-11T18:00:00.000Z",

    registrationOpenDate: "2026-08-01T08:00:00.000Z",
    registrationCloseDate: "2026-10-05T23:59:59.000Z",
    registrationStatus: "upcoming",

    coverImageUrl: null,

    platformFee: 8,
    processingFee: 5.25,

    allowOnlinePayment: true,
    allowCashPayment: true,

    confirmedRacerCount: 0,

    refundPolicy:
      "Refund and transfer policies will be published before registration opens.",

    cashPaymentInstructions:
      "Cash payments must be completed before event check-in.",

    classes: [
      {
        id: "class-socal-amateur-ski-stock",
        eventId: "event-2026-socal-summer-classic",
        name: "Amateur Ski Stock",
        code: "SKI_STOCK_AM",
        description: "Amateur stand-up stock ski racing.",
        price: 130,
        availableDays: ["saturday", "sunday"],
        capacity: 30,
        confirmedRacerCount: 0,
        isOpen: false,
        displayOrder: 1,
      },
      {
        id: "class-socal-novice-runabout",
        eventId: "event-2026-socal-summer-classic",
        name: "Novice Runabout Stock",
        code: "RUNABOUT_STOCK_NV",
        description: "Novice stock runabout competition.",
        price: 115,
        availableDays: ["saturday", "sunday"],
        capacity: 30,
        confirmedRacerCount: 0,
        isOpen: false,
        displayOrder: 2,
      },
    ],
  },
];

export const demoRegistrationRacers: RegistrationRacer[] = [
  {
    id: "racer-josh-simon",
    name: "Josh Simon",
    nickname: "Snake",
    imageUrl: null,
    city: "Riverside",
    stateCode: "CA",
    countryCode: "US",
    formattedLocation: "Riverside, California",
    raceNumber: "217",
    teamName: "Corner League Racing",
  },
  {
    id: "racer-riptide-21",
    name: "Riptide 21",
    nickname: null,
    imageUrl: null,
    city: "Lake Havasu City",
    stateCode: "AZ",
    countryCode: "US",
    formattedLocation: "Lake Havasu City, Arizona",
    raceNumber: "21",
    teamName: "Riptide Racing",
  },
  {
    id: "racer-jet-stream",
    name: "Jet Stream",
    nickname: null,
    imageUrl: null,
    city: "San Diego",
    stateCode: "CA",
    countryCode: "US",
    formattedLocation: "San Diego, California",
    raceNumber: "44",
    teamName: "Jet Stream Racing",
  },
  {
    id: "racer-aqua-ghost",
    name: "Aqua Ghost",
    nickname: null,
    imageUrl: null,
    city: "Phoenix",
    stateCode: "AZ",
    countryCode: "US",
    formattedLocation: "Phoenix, Arizona",
    raceNumber: "88",
    teamName: "Aqua Ghost Racing",
  },
];

export const demoEventRegistrations: DemoRegistration[] = [
  {
    id: "demo-registration-1",

    eventId: "event-2026-lake-havasu-open",
    eventSlug: "2026-lake-havasu-open",

    registeredByUserId: "demo-user-1",

    racer: demoRegistrationRacers[1],

    contact: {
      email: "riptide@example.com",
      phone: "(928) 555-0101",
      city: "Lake Havasu City",
      stateCode: "AZ",
      countryCode: "US",
    },

    selectedClasses: [
      {
        classId: "class-pro-ski-gp",
        className: "Pro Ski GP",
        raceDays: ["saturday", "sunday"],
        price: 165,
      },
    ],

    watercraft: {
      boatNumber: "21",
      make: "Kawasaki",
      model: "SX-R",
      year: "2025",
      useForAllClasses: true,
    },

    paymentMethod: "online",
    paymentStatus: "completed",
    status: "confirmed",

    pricing: {
      classSubtotal: 165,
      platformFee: 8,
      processingFee: 5.25,
      total: 178.25,
    },

    createdAt: "2026-07-10T17:00:00.000Z",
    updatedAt: "2026-07-10T17:00:00.000Z",
  },
  {
    id: "demo-registration-2",

    eventId: "event-2026-lake-havasu-open",
    eventSlug: "2026-lake-havasu-open",

    registeredByUserId: "demo-user-2",

    racer: demoRegistrationRacers[2],

    contact: {
      email: "jetstream@example.com",
      phone: "(619) 555-0133",
      city: "San Diego",
      stateCode: "CA",
      countryCode: "US",
    },

    selectedClasses: [
      {
        classId: "class-amateur-ski-stock",
        className: "Amateur Ski Stock",
        raceDays: ["saturday"],
        price: 135,
      },
    ],

    watercraft: {
      boatNumber: "44",
      make: "Yamaha",
      model: "SuperJet",
      year: "2024",
      useForAllClasses: true,
    },

    paymentMethod: "online",
    paymentStatus: "completed",
    status: "confirmed",

    pricing: {
      classSubtotal: 135,
      platformFee: 8,
      processingFee: 5.25,
      total: 148.25,
    },

    createdAt: "2026-07-11T17:00:00.000Z",
    updatedAt: "2026-07-11T17:00:00.000Z",
  },
  {
    id: "demo-registration-3",

    eventId: "event-2026-lake-havasu-open",
    eventSlug: "2026-lake-havasu-open",

    registeredByUserId: "demo-user-3",

    racer: demoRegistrationRacers[3],

    contact: {
      email: "aquaghost@example.com",
      phone: "(602) 555-0155",
      city: "Phoenix",
      stateCode: "AZ",
      countryCode: "US",
    },

    selectedClasses: [
      {
        classId: "class-pro-runabout-gp",
        className: "Pro Runabout GP",
        raceDays: ["sunday"],
        price: 185,
      },
    ],

    watercraft: {
      boatNumber: "88",
      make: "Sea-Doo",
      model: "RXP-X",
      year: "2025",
      useForAllClasses: true,
    },

    paymentMethod: "online",
    paymentStatus: "completed",
    status: "confirmed",

    pricing: {
      classSubtotal: 185,
      platformFee: 8,
      processingFee: 5.25,
      total: 198.25,
    },

    createdAt: "2026-07-12T17:00:00.000Z",
    updatedAt: "2026-07-12T17:00:00.000Z",
  },
];
