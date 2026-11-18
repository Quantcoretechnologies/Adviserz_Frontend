import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AuthUser,
  OtpIssued,
  VerifyOtpRequest,
} from "@/features/auth/api/auth.types";
import { authKeys } from "@/features/auth/api/auth.api";
import type { ApiError } from "@/lib/api";
import {
  onboardingApi,
  onboardingKeys,
  type CapitalAllocation,
  type ContactInput,
  type MarketExperience,
  type OnboardingState,
  type RiskAllocation,
} from "../api/onboarding.api";

/** Where the signed-in user is in onboarding, with everything needed to render a step. */
export function useOnboardingState() {
  return useQuery<OnboardingState, ApiError>({
    queryKey: onboardingKeys.state,
    queryFn: onboardingApi.getState,
  });
}

/**
 * A mutation that saves one step. The API answers with the full updated
 * state, which replaces the cached one, so no refetch is needed.
 */
function useStepMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<OnboardingState>,
  { changesUser = false }: { changesUser?: boolean } = {},
) {
  const queryClient = useQueryClient();
  return useMutation<OnboardingState, ApiError, TVariables>({
    mutationFn,
    onSuccess: (state) => {
      queryClient.setQueryData(onboardingKeys.state, state);
      if (changesUser) {
        void queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
      }
    },
  });
}

/** Contact step, part 1: send a code to the email or phone being added. */
export function useSendContactOtp() {
  return useMutation<OtpIssued, ApiError, ContactInput>({
    mutationFn: onboardingApi.sendContactOtp,
  });
}

/** Contact step, part 2: verify the code, which attaches the contact to the account. */
export function useVerifyContact() {
  return useStepMutation<VerifyOtpRequest>(onboardingApi.verifyContact, {
    changesUser: true,
  });
}

export function useSaveSegments() {
  return useStepMutation<string[]>(onboardingApi.saveSegments);
}

export function useSaveExperience() {
  return useStepMutation<MarketExperience>(onboardingApi.saveExperience);
}

export function useSaveCapital() {
  return useStepMutation<CapitalAllocation[]>(onboardingApi.saveCapital);
}

export function useSaveRisk() {
  return useStepMutation<RiskAllocation[]>(onboardingApi.saveRisk);
}

/** Connecting a broker is optional and has no screen yet, so it is recorded as skipped. */
export function useSkipBroker() {
  return useStepMutation<void>(onboardingApi.skipBroker);
}

export function useAcceptPolicies() {
  return useStepMutation<string[]>(onboardingApi.acceptPolicies);
}

/** Final step: activate the risk profile and mark the user as onboarded. */
export function useConfirmOnboarding() {
  const queryClient = useQueryClient();
  return useMutation<{ user: AuthUser }, ApiError, void>({
    mutationFn: onboardingApi.confirm,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: onboardingKeys.state });
      void queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
    },
  });
}
