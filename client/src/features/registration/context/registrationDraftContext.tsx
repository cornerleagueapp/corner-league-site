import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { calculateRegistrationPricing } from "../services/registrationDemoService";
import {
  clearRegistrationDraft,
  loadRegistrationDraft,
  saveRegistrationDraft,
} from "../utils/registrationStorage";
import type {
  RegistrationClassSelection,
  RegistrationContact,
  RegistrationDraft,
  RegistrationEvent,
  RegistrationPaymentMethod,
  RegistrationRacer,
  RegistrationWatercraft,
} from "../types/registration.types";

const EMPTY_CONTACT: RegistrationContact = {
  email: "",
  phone: "",
  city: "",
  stateCode: "",
  countryCode: "US",
};

const EMPTY_WATERCRAFT: RegistrationWatercraft = {
  boatNumber: "",
  make: "",
  model: "",
  year: "",
  useForAllClasses: true,
};

type RegistrationDraftContextValue = {
  event: RegistrationEvent;
  draft: RegistrationDraft;

  setCurrentStep: (step: number) => void;

  setRacer: (racer: RegistrationRacer | null) => void;

  updateContact: (contact: Partial<RegistrationContact>) => void;

  setSelectedClasses: (selections: RegistrationClassSelection[]) => void;

  toggleClassSelection: (selection: RegistrationClassSelection) => void;

  updateWatercraft: (watercraft: Partial<RegistrationWatercraft>) => void;

  setPaymentMethod: (paymentMethod: RegistrationPaymentMethod | null) => void;

  setRegisteredByUserId: (userId: string | null) => void;

  resetDraft: () => void;

  hasSelectedClass: (classId: string) => boolean;
};

const RegistrationDraftContext =
  createContext<RegistrationDraftContextValue | null>(null);

function createEmptyDraft(event: RegistrationEvent): RegistrationDraft {
  return {
    eventId: event.id,
    eventSlug: event.slug,

    registeredByUserId: null,

    racer: null,
    newRacer: null,

    contact: {
      ...EMPTY_CONTACT,
    },

    selectedClasses: [],

    watercraft: {
      ...EMPTY_WATERCRAFT,
    },

    paymentMethod: null,

    pricing: calculateRegistrationPricing(event, []),

    currentStep: 1,

    updatedAt: new Date().toISOString(),
  };
}

function normalizeLoadedDraft(
  event: RegistrationEvent,
  draft: RegistrationDraft,
): RegistrationDraft {
  const selectedClasses = Array.isArray(draft.selectedClasses)
    ? draft.selectedClasses
    : [];

  return {
    ...createEmptyDraft(event),
    ...draft,

    eventId: event.id,
    eventSlug: event.slug,

    contact: {
      ...EMPTY_CONTACT,
      ...(draft.contact ?? {}),
    },

    selectedClasses,

    watercraft: {
      ...EMPTY_WATERCRAFT,
      ...(draft.watercraft ?? {}),
    },

    pricing: calculateRegistrationPricing(
      event,
      selectedClasses.map((selection) => selection.price),
    ),

    updatedAt: new Date().toISOString(),
  };
}

export function RegistrationDraftProvider({
  event,
  children,
}: {
  event: RegistrationEvent;
  children: ReactNode;
}) {
  const [draft, setDraft] = useState<RegistrationDraft>(() => {
    const stored = loadRegistrationDraft(event.slug);

    return stored
      ? normalizeLoadedDraft(event, stored)
      : createEmptyDraft(event);
  });

  useEffect(() => {
    const stored = loadRegistrationDraft(event.slug);

    setDraft(
      stored ? normalizeLoadedDraft(event, stored) : createEmptyDraft(event),
    );
  }, [event.id, event.slug]);

  useEffect(() => {
    saveRegistrationDraft(draft);
  }, [draft]);

  const updateDraft = useCallback(
    (
      updater:
        | Partial<RegistrationDraft>
        | ((current: RegistrationDraft) => RegistrationDraft),
    ) => {
      setDraft((current) => {
        const next =
          typeof updater === "function"
            ? updater(current)
            : {
                ...current,
                ...updater,
              };

        return {
          ...next,
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [],
  );

  const setCurrentStep = useCallback(
    (step: number) => {
      updateDraft((current) => ({
        ...current,
        currentStep: Math.max(1, Math.min(6, step)),
      }));
    },
    [updateDraft],
  );

  const setRacer = useCallback(
    (racer: RegistrationRacer | null) => {
      updateDraft((current) => ({
        ...current,
        racer,
        newRacer: null,
      }));
    },
    [updateDraft],
  );

  const updateContact = useCallback(
    (contact: Partial<RegistrationContact>) => {
      updateDraft((current) => ({
        ...current,
        contact: {
          ...current.contact,
          ...contact,
        },
      }));
    },
    [updateDraft],
  );

  const setSelectedClasses = useCallback(
    (selections: RegistrationClassSelection[]) => {
      updateDraft((current) => ({
        ...current,
        selectedClasses: selections,
        pricing: calculateRegistrationPricing(
          event,
          selections.map((selection) => selection.price),
        ),
      }));
    },
    [event, updateDraft],
  );

  const toggleClassSelection = useCallback(
    (selection: RegistrationClassSelection) => {
      updateDraft((current) => {
        const exists = current.selectedClasses.some(
          (item) => item.classId === selection.classId,
        );

        const selectedClasses = exists
          ? current.selectedClasses.filter(
              (item) => item.classId !== selection.classId,
            )
          : [...current.selectedClasses, selection];

        return {
          ...current,
          selectedClasses,
          pricing: calculateRegistrationPricing(
            event,
            selectedClasses.map((item) => item.price),
          ),
        };
      });
    },
    [event, updateDraft],
  );

  const updateWatercraft = useCallback(
    (watercraft: Partial<RegistrationWatercraft>) => {
      updateDraft((current) => ({
        ...current,
        watercraft: {
          ...current.watercraft,
          ...watercraft,
        },
      }));
    },
    [updateDraft],
  );

  const setPaymentMethod = useCallback(
    (paymentMethod: RegistrationPaymentMethod | null) => {
      updateDraft((current) => ({
        ...current,
        paymentMethod,
      }));
    },
    [updateDraft],
  );

  const setRegisteredByUserId = useCallback(
    (registeredByUserId: string | null) => {
      updateDraft((current) => ({
        ...current,
        registeredByUserId,
      }));
    },
    [updateDraft],
  );

  const resetDraft = useCallback(() => {
    clearRegistrationDraft(event.slug);

    setDraft(createEmptyDraft(event));
  }, [event]);

  const hasSelectedClass = useCallback(
    (classId: string) => {
      return draft.selectedClasses.some(
        (selection) => selection.classId === classId,
      );
    },
    [draft.selectedClasses],
  );

  const value = useMemo<RegistrationDraftContextValue>(
    () => ({
      event,
      draft,

      setCurrentStep,
      setRacer,
      updateContact,
      setSelectedClasses,
      toggleClassSelection,
      updateWatercraft,
      setPaymentMethod,
      setRegisteredByUserId,
      resetDraft,
      hasSelectedClass,
    }),
    [
      event,
      draft,
      setCurrentStep,
      setRacer,
      updateContact,
      setSelectedClasses,
      toggleClassSelection,
      updateWatercraft,
      setPaymentMethod,
      setRegisteredByUserId,
      resetDraft,
      hasSelectedClass,
    ],
  );

  return (
    <RegistrationDraftContext.Provider value={value}>
      {children}
    </RegistrationDraftContext.Provider>
  );
}

export function useRegistrationDraft() {
  const context = useContext(RegistrationDraftContext);

  if (!context) {
    throw new Error(
      "useRegistrationDraft must be used inside RegistrationDraftProvider.",
    );
  }

  return context;
}
