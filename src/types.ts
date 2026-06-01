/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EscapeRoute {
  id: string;
  destination: string;
  blurb: string;
}

export interface CarrierLane {
  id: string;
  origin: string;
  destination: string;
  activeCarrier: string;
}

export interface VRID {
  id: string; // Vehicle Route ID, e.g. "VRID-3908A"
  carrier: string;
  subCarrier?: string; // e.g. "FedEx Express"
  origin: string;
  destination: string;
  sdt: string; // Scheduled Departure Time, e.g., "14:30"
  sat?: string; // Scheduled Arrival Time, e.g., "18:30"
}

export interface SSPCompliance {
  id: string;
  carrier: string;
  origin: string;
  loadingComplianceWindow: string; // e.g., "10:00 - 16:00"
  startHour: number; // e.g., 10 for compliance check
  endHour: number; // e.g., 16 for compliance check
}

export interface AdhocCase {
  id: string;
  caseId: string;
  lane: string; // e.g., "SEA1 - BFI4"
}

export interface StepResults {
  caseId: string;
  lane: string;
  origin: string;
  destination: string;
  
  // Step 2 details
  escapeRouteChecks: {
    checked: boolean;
    found: boolean;
    blurb?: string;
  };

  // Step 3 details
  carrierChecks: {
    checked: boolean;
    found: boolean;
    activeCarrier?: string;
  };

  // Step 4 details
  sspChecks: {
    checked: boolean;
    loadingComplianceWindow?: string;
    vridFound: boolean;
    matchingVrids?: Array<{
      id: string;
      sdt: string;
      lane: string;
      carrier: string;
      subCarrier?: string;
      sat?: string;
    }>;
    recommendedAction?: 'CREATE_VRID' | 'USE_FOUND';
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  // Optional step execution attachment if this message represents a workflow run
  workflowResults?: StepResults;
}
