/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EscapeRoute, CarrierLane, VRID, SSPCompliance, AdhocCase } from './types';

export const INITIAL_ESCAPE_ROUTES: EscapeRoute[] = [];

export const INITIAL_CARRIER_LANES: CarrierLane[] = [];

export const INITIAL_SSP_COMPLIANCE: SSPCompliance[] = [];

export const INITIAL_VRIDS: VRID[] = [];

// Provide quick-start preset scenarios that the user can pick
export interface PresetCase {
  title: string;
  description: string;
  caseId: string;
  lane: string;
  expectedOutcome: string;
}

export const PRESET_CASES: PresetCase[] = [];
