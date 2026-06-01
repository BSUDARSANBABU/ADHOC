/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EscapeRoute, CarrierLane, VRID, SSPCompliance, StepResults } from '../types';

/**
 * Robustly parses a lane text into Origin and Destination.
 * Supported formats:
 * - "SEA1 - BFI4"
 * - "SEA1-BFI4"
 * - "SEA1 BFI4"
 * - "SEA1 to BFI4"
 * - "SEA1 -> BFI4"
 */
export function parseLane(laneStr: string): { origin: string; destination: string } {
  const normalized = laneStr.trim().toUpperCase();
  
  // Try splitting by common separators
  const separators = ['-', 'TO', '->', '>', ' '];
  for (const sep of separators) {
    const parts = sep === ' ' 
      ? normalized.split(/\s+/) 
      : normalized.split(sep);
      
    if (parts.length >= 2) {
      const origin = parts[0].trim();
      const destination = parts[parts.length - 1].trim();
      if (origin.length > 0 && destination.length > 0) {
        return { origin, destination };
      }
    }
  }

  // Fallback default
  return {
    origin: normalized.substring(0, Math.floor(normalized.length / 2)).trim() || "UNKNOWN_ORIGIN",
    destination: normalized.substring(Math.floor(normalized.length / 2)).trim() || "UNKNOWN_DEST"
  };
}

/**
 * Compares "14:30" string with numerical start and end hours.
 */
export function isTimeInCompliance(timeStr: string, startH: number, endH: number): boolean {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes || 0)) return false;
    const decimalTime = hours + (minutes || 0) / 60;
    return decimalTime >= startH && decimalTime <= endH;
  } catch (e) {
    return false;
  }
}

/**
 * Runs the 4-step logistics determination algorithm.
 */
export function runLogisticsWorkflow(
  caseId: string,
  lane: string,
  escapeRoutes: EscapeRoute[],
  carrierLanes: CarrierLane[],
  sspCompliances: SSPCompliance[],
  vrids: VRID[]
): StepResults {
  const cleanCaseId = caseId.trim() || `CASE-${Math.floor(1000 + Math.random() * 9000)}`;
  const cleanLane = lane.trim() || "SEA1 - BFI4";
  const { origin, destination } = parseLane(cleanLane);

  // --- Step 2: Escape Route Check ---
  // Take the destination and check first in Escape Route list.
  const matchedRoute = escapeRoutes.find(
    r => r.destination.toUpperCase() === destination.toUpperCase()
  );
  const escapeRouteFound = !!matchedRoute;
  const escapeRouteBlurb = matchedRoute?.blurb;

  // --- Step 3: Active Carrier Check ---
  // Take the full lane origin & destination. Check active Carrier dashboard.
  const matchedCarrierLane = carrierLanes.find(
    cl => cl.origin.toUpperCase() === origin.toUpperCase() && 
          cl.destination.toUpperCase() === destination.toUpperCase()
  );
  
  const activeCarrier = matchedCarrierLane 
    ? matchedCarrierLane.activeCarrier 
    : "Unlisted Carrier";

  // --- Step 4: Loading Compliance in SSP ---
  // Based on active Carrier and Origin, load Compliance check in SSP.
  const matchedCompliance = sspCompliances.find(
    c => c.carrier.toLowerCase() === activeCarrier.toLowerCase() && 
          c.origin.toUpperCase() === origin.toUpperCase()
  );

  // Fallback defaults if compliance rule doesn't exist
  const complianceWindow = matchedCompliance 
    ? matchedCompliance.loadingComplianceWindow 
    : "09:00 - 17:00 (Default)";
  const startHour = matchedCompliance ? matchedCompliance.startHour : 9;
  const endHour = matchedCompliance ? matchedCompliance.endHour : 17;

  // Check scheduled VRID within compliance window
  // "check any scheduled VRID in with in loading compliance."
  const matchingScheduledVrids = vrids.filter(v => {
    const carrierMatches = v.carrier.toLowerCase() === activeCarrier.toLowerCase();
    const originMatches = v.origin.toUpperCase() === origin.toUpperCase();
    const destMatches = v.destination.toUpperCase() === destination.toUpperCase();
    
    if (carrierMatches && originMatches && destMatches) {
      // Check if time matches loading compliance window
      return isTimeInCompliance(v.sdt, startHour, endHour);
    }
    return false;
  });

  const vridFound = matchingScheduledVrids.length > 0;
  
  const results: StepResults = {
    caseId: cleanCaseId,
    lane: cleanLane,
    origin,
    destination,
    escapeRouteChecks: {
      checked: true,
      found: escapeRouteFound,
      blurb: escapeRouteBlurb
    },
    carrierChecks: {
      checked: true,
      found: matchedCarrierLane !== undefined,
      activeCarrier
    },
    sspChecks: {
      checked: true,
      loadingComplianceWindow: complianceWindow,
      vridFound,
      matchingVrids: matchingScheduledVrids.map(v => ({
        id: v.id,
        sdt: v.sdt,
        lane: `${v.origin} - ${v.destination}`,
        carrier: v.carrier,
        subCarrier: v.subCarrier || "Standard Trunkline",
        sat: v.sat || "TBA"
      })),
      recommendedAction: vridFound ? 'USE_FOUND' : 'CREATE_VRID'
    }
  };

  return results;
}
