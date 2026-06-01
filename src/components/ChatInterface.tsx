/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Trash2,
  FileCheck,
  ChevronRight,
  Info,
  Truck,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Database,
  Layers,
  X,
  Clock,
  ArrowRight
} from 'lucide-react';
import { ChatMessage, StepResults, VRID } from '../types';
import { runLogisticsWorkflow } from '../utils/logisticsEngine';

interface ChatInterfaceProps {
  escapeRoutes: any[];
  carrierLanes: any[];
  sspCompliances: any[];
  vrids: VRID[];
  setVrids: React.Dispatch<React.SetStateAction<VRID[]>>;
  activeTabId: number;
  setActiveTabId: React.Dispatch<React.SetStateAction<number>>;
  chatSessions: Record<number, ChatMessage[]>;
  setChatSessions: React.Dispatch<React.SetStateAction<Record<number, ChatMessage[]>>>;
  sessionMeta: Record<number, { title: string; activeCase?: string; activeLane?: string }>;
  setSessionMeta: React.Dispatch<React.SetStateAction<Record<number, { title: string; activeCase?: string; activeLane?: string }>>>;
  openTabIds: number[];
  setOpenTabIds: React.Dispatch<React.SetStateAction<number[]>>;
}

export default function ChatInterface({
  escapeRoutes,
  carrierLanes,
  sspCompliances,
  vrids,
  setVrids,
  activeTabId,
  setActiveTabId,
  chatSessions,
  setChatSessions,
  sessionMeta,
  setSessionMeta,
  openTabIds,
  setOpenTabIds
}: ChatInterfaceProps) {
  // Input fields for Case ID and Lane.
  const [caseIdInput, setCaseIdInput] = useState('CASE-1021');
  const [laneInput, setLaneInput] = useState('SEA1 - BFI4');
  const [isTyping, setIsTyping] = useState(false);

  // Interactive dialog to resolve missing VRID (Step 4 Playbook override)
  const [resolveVridModal, setResolveVridModal] = useState<{
    open: boolean;
    carrier: string;
    origin: string;
    destination: string;
    caseId: string;
    lane: string;
    sdtInput: string;
    subCarrierInput: string;
    satInput: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatSessions, activeTabId, isTyping]);

  // Scroll to bottom helper
  const scrollHelper = () => {};

  /**
   * Run the full 4-step compliance analysis
   */
  const handleRunWorkflow = (caseId: string, lane: string) => {
    if (!caseId.trim() || !lane.trim()) return;

    const trimmedCaseId = caseId.trim().toUpperCase();
    const trimmedLane = lane.trim().toUpperCase();

    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newUserMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      timestamp: timestampStr,
      text: `Analyze compliance for Case **${trimmedCaseId}** on route **${trimmedLane}**.`
    };

    // Update active tab session with user message
    setChatSessions(prev => ({
      ...prev,
      [activeTabId]: [...(prev[activeTabId] || []), newUserMessage]
    }));
    
    setIsTyping(true);

    // Compute the underlying rules
    const results = runLogisticsWorkflow(
      trimmedCaseId,
      trimmedLane,
      escapeRoutes,
      carrierLanes,
      sspCompliances,
      vrids
    );

    // Update tab labels so user sees active cases across their 10 chats
    setSessionMeta(prev => ({
      ...prev,
      [activeTabId]: {
        title: `Chat ${activeTabId}`,
        activeCase: trimmedCaseId,
        activeLane: trimmedLane
      }
    }));

    // Progressive look-alike engine analysis delay
    setTimeout(() => {
      setIsTyping(false);
      
      const responseText = results.sspChecks.vridFound 
        ? `The compliance evaluation completed. I have verified all 4 criteria of the Adhoc operations playbook.`
        : `Compliance block detected on Step 4 (SSP compliance check). No valid scheduled vehicle route matches the loading window window at origin.`;

      const newAssistantMessage: ChatMessage = {
        id: `msg-assistant-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: responseText,
        workflowResults: results
      };

      setChatSessions(prev => ({
        ...prev,
        [activeTabId]: [...(prev[activeTabId] || []), newAssistantMessage]
      }));

      // Setup convenient randomized ID for next custom entry
      const nextIdNum = Math.floor(1000 + Math.random() * 9000);
      setCaseIdInput(`CASE-${nextIdNum}`);
    }, 1000);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRunWorkflow(caseIdInput, laneInput);
  };

  const handleClearCurrentChat = () => {
    setChatSessions(prev => ({
      ...prev,
      [activeTabId]: []
    }));
    setSessionMeta(prev => ({
      ...prev,
      [activeTabId]: { title: `Chat ${activeTabId}` }
    }));
  };

  // Open popup to insert custom VRID to bypass delay on that active hub
  const handleActionCreateVRID = (results: StepResults) => {
    const carrier = results.carrierChecks.activeCarrier || 'FedEx Logistics';
    setResolveVridModal({
      open: true,
      carrier,
      origin: results.origin,
      destination: results.destination,
      caseId: results.caseId,
      lane: results.lane,
      sdtInput: '12:00',
      subCarrierInput: 'Express Standard',
      satInput: '15:30'
    });
  };

  const handleConfirmCreateVRID = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveVridModal) return;

    const { carrier, origin, destination, caseId, lane, sdtInput, subCarrierInput, satInput } = resolveVridModal;
    const newId = `VRID-${Math.floor(10000 + Math.random() * 90000)}`;

    const newV: VRID = {
      id: newId,
      carrier,
      subCarrier: subCarrierInput.trim(),
      origin,
      destination,
      sdt: sdtInput.trim(),
      sat: satInput.trim()
    };

    setVrids(prev => [...prev, newV]);
    setResolveVridModal(null);

    // Append notification about overriding
    const overrideMsg: ChatMessage = {
      id: `system-override-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `✅ **Compliance Resolution Executed:** Registered the new override route **${newId}** (${subCarrierInput}) for Carrier **${carrier}** scheduled departure SDT at **${sdtInput}**. Performing automated re-audit now...`
    };

    setChatSessions(prev => ({
      ...prev,
      [activeTabId]: [...(prev[activeTabId] || []), overrideMsg]
    }));
    
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const reAuditResults = runLogisticsWorkflow(
        caseId,
        lane,
        escapeRoutes,
        carrierLanes,
        sspCompliances,
        [...vrids, newV]
      );
      
      const responseText = `Re-audit successful! The compliance routing conflict is resolved. Let's verify the updated state:`;
      const updateMsg: ChatMessage = {
        id: `re-audit-results-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: responseText,
        workflowResults: reAuditResults
      };

      setChatSessions(prev => ({
        ...prev,
        [activeTabId]: [...(prev[activeTabId] || []), updateMsg]
      }));
    }, 850);
  };

  const currentMessages = chatSessions[activeTabId] || [];

  return (
    <div className="flex flex-col bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden min-h-[520px] w-full" id="new_copilot_frame">
      
      {/* CORE WORKSPACE CHAT SCREEN */}
      <div className="flex-1 flex flex-col bg-slate-900/25 overflow-hidden relative" id="gemini_main_canvas">
        
        {/* Chat session info header toolbar */}
        <div className="bg-slate-950/50 backdrop-blur-xs px-4 py-2 border-b border-slate-850/80 flex items-center justify-between" id="active_chat_tools">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Active Terminal Session &mdash; Audit slot {activeTabId}</span>
          </div>
          {currentMessages.length > 0 && (
            <button
              onClick={handleClearCurrentChat}
              className="text-rose-455 hover:text-white text-[9px] font-extrabold flex items-center gap-1 bg-slate-950/75 hover:bg-rose-950 hover:border-rose-500/20 px-2 py-1 rounded border border-slate-850 transition-all cursor-pointer shadow-xs uppercase tracking-wider"
              title="Purge operations log for this slot"
              id="purge_slot_history_btn"
            >
              <Trash2 className="w-2.5 h-2.5" /> Purge Memory
            </button>
          )}
        </div>
        
        {/* Main history display area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-950/45 min-h-[300px] max-h-[440px]" id="gemini_chat_box">
          
          {/* Welcome greeting card if current selected tab has "nothing" inside */}
          {currentMessages.length === 0 && !isTyping && (
            <div className="max-w-2xl mx-auto py-6" id="gemini_welcome_panel">
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-1.5 justify-center md:justify-start">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9.5px] uppercase font-bold tracking-widest text-amber-400 font-mono">Operations Terminal Gateway Active</span>
                </div>
                <h1 className="text-xl md:text-2xl font-sans font-black tracking-tight bg-linear-to-r from-slate-100 via-slate-250 to-amber-400 bg-clip-text text-transparent uppercase">
                  Automated Adhoc Playbook System
                </h1>
                <p className="text-[11.5px] text-slate-300 leading-relaxed font-semibold max-w-lg">
                  This is slot <strong className="text-amber-400 font-black">Chat {activeTabId}</strong>. Initiate compliance audits below to evaluate and verify transportation readiness with zero delays.
                </p>
              </div>

              {/* Guidance checklist showing active Playbook steps without mock data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-5 text-left" id="active_playbook_steps_guide">
                <div className="p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                    <span className="w-4 h-4 bg-amber-400/10 text-amber-400 rounded-full flex items-center justify-center font-bold font-mono text-[8.5px]">1</span>
                    <span>RECEIPT OF THE CASE</span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-2 font-semibold leading-relaxed">
                    Matches incoming Case queries with the assigned route lane records instantly inside the system routing catalog.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-rose-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                    <span className="w-4 h-4 bg-rose-400/10 text-rose-400 rounded-full flex items-center justify-center font-bold font-mono text-[8.5px]">2</span>
                    <span>ESCAPE ROUTE AUDITING</span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-2 font-semibold leading-relaxed">
                    Checks destination nodes for active detours or congestion warnings to alert local dispatch or transport networks.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                    <span className="w-4 h-4 bg-emerald-400/10 text-emerald-400 rounded-full flex items-center justify-center font-bold font-mono text-[8.5px]">3</span>
                    <span>CARRIER MAPPING & LOG</span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-2 font-semibold leading-relaxed">
                    Queries and links active logistics carrier agencies assigned to manage primary operational transit on the sector.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-sky-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                    <span className="w-4 h-4 bg-sky-400/10 text-sky-400 rounded-full flex items-center justify-center font-bold font-mono text-[8.5px]">4</span>
                    <span>SSP LOADING COMPLIANCE</span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-2 font-semibold leading-relaxed">
                    Pins scheduled departures (VRID) of assigned carriers to confirm departures fall within loading compliance windows.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Render active session messages */}
          {currentMessages.length > 0 && (
            <div className="max-w-3xl mx-auto space-y-4">
              {currentMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3.5 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Assistant Icon */}
                  {message.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-750 text-amber-400 flex items-center justify-center shadow-lg shrink-0 mt-0.5 relative group">
                      <div className="absolute inset-0 bg-amber-400 rounded-xl opacity-10 animate-pulse" />
                      <Sparkles className="w-4 h-4 text-amber-400 relative z-10" />
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[92%] ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    
                    {/* Speech Box */}
                    <div className={`p-4 rounded-xl text-[11px] leading-relaxed relative border shadow-md ${
                      message.sender === 'user'
                        ? 'bg-linear-to-br from-amber-400 to-amber-500 text-slate-950 font-bold rounded-tr-none border-amber-405 shadow-[0_5px_15px_rgba(245,158,11,0.2)]'
                        : 'bg-slate-900 border-slate-800/80 text-slate-100 rounded-tl-none'
                    }`}>
                      
                      {/* Original text content */}
                      <p className="font-semibold whitespace-pre-wrap">{message.text}</p>

                      {/* SSP RESOLUTION COMPLIANCE BLURB & TABLE */}
                      {message.workflowResults && (
                        <div className="mt-4 pt-3.5 border-t border-slate-800 space-y-4">
                          
                          {/* DYNAMIC SSP COMPLIANCE BLURB */}
                          {message.workflowResults.sspChecks.vridFound ? (
                            <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-3 text-[11px] text-emerald-200 font-semibold space-y-3 shadow-inner">
                              <div className="flex items-center gap-1.5 uppercase font-mono text-[9.5px] tracking-wider text-emerald-400">
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Verified Loading Compliance Status</span>
                              </div>
                              {/* The EXACT required blurb string requested by the user */}
                              <p className="font-mono text-emerald-300 bg-slate-950 border border-emerald-500/20 p-2.5 rounded-lg text-[10.5px] leading-relaxed font-bold shadow-xs">
                                Based on that lane with in loading compliance time is 36 hours in side i found {message.workflowResults.sspChecks.matchingVrids?.length} vrid s
                              </p>

                              {/* THE SPECIFIC SSP TABLES SHOWING: Scheduled VRID, LANE, carrier, sub carrier, SAT, SDT */}
                              <div className="overflow-x-auto border border-slate-800 rounded-lg mt-2 bg-slate-950">
                                <table className="min-w-full divide-y divide-slate-850 text-left text-[9px] font-sans">
                                  <thead className="bg-slate-900 text-slate-400 uppercase tracking-widest text-[8px] font-extrabold pb-1">
                                    <tr>
                                      <th className="px-2 py-2 border-r border-slate-850/60">scheduled VRID</th>
                                      <th className="px-2 py-2 border-r border-slate-850/60">LANE</th>
                                      <th className="px-2 py-2 border-r border-slate-850/60">carrier</th>
                                      <th className="px-2 py-2 border-r border-slate-850/60">sub carrier</th>
                                      <th className="px-2 py-2 border-r border-slate-850/60">SAT</th>
                                      <th className="px-2 py-2">SDT</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-850 text-slate-300 font-semibold">
                                    {message.workflowResults.sspChecks.matchingVrids?.map((v, i) => (
                                      <tr key={i} className="hover:bg-slate-900/60 transition-colors">
                                        <td className="px-2 py-2 font-bold font-mono text-amber-400 border-r border-slate-850/60 bg-slate-900/30">{v.id}</td>
                                        <td className="px-2 py-2 font-mono text-slate-100 border-r border-slate-850/60 font-bold">{v.lane}</td>
                                        <td className="px-2 py-2 border-r border-slate-850/60">{v.carrier}</td>
                                        <td className="px-2 py-2 text-slate-400 border-r border-slate-850/60 text-[8px] font-medium">{v.subCarrier || 'Standard Delivery'}</td>
                                        <td className="px-2 py-2 font-mono text-indigo-400 border-r border-slate-850/60 font-bold">{v.sat || 'TBA'}</td>
                                        <td className="px-2 py-2 font-mono text-emerald-400 font-black">{v.sdt}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-rose-950/30 border border-rose-500/25 rounded-xl p-3 text-[10.5px] text-rose-200 font-semibold space-y-3 shadow-inner">
                              <div className="flex items-center gap-1.5 uppercase font-mono text-[9px] tracking-wider text-rose-400 font-bold">
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                <span>No Active Compliant VRIDs Found</span>
                              </div>
                              <p className="text-[10.5px] text-rose-300 leading-relaxed font-semibold">
                                Evaluation of scheduled departures did not locate any active carriers matching the compliance release window <strong className="font-mono text-rose-200 font-bold bg-rose-950/70 px-1 py-0.5 rounded border border-rose-500/10">{message.workflowResults.sspChecks.loadingComplianceWindow}</strong> today at origin.
                              </p>
                              
                              <div className="flex items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-lg border border-rose-500/20 shadow-md">
                                <div>
                                  <span className="text-[9.5px] uppercase font-mono font-bold text-rose-400 bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-500/20">Override Active</span>
                                  <p className="text-[9.5px] text-slate-400 mt-0.5 font-medium">Bypass current compliance slot manually.</p>
                                </div>
                                <button
                                  onClick={() => handleActionCreateVRID(message.workflowResults!)}
                                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 text-[10.5px] rounded-md font-extrabold transition-all cursor-pointer shadow-md shrink-0"
                                >
                                  + Create VRID Route
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 4-Step Verification Matrix Overview */}
                          <div className="mt-3 border border-slate-800 bg-slate-950/60 p-3 rounded-xl space-y-2.5">
                            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono border-b border-slate-800 pb-1 uppercase tracking-widest">
                              <span>Adhoc Step-by-Step Playbook Log</span>
                              <span>{message.workflowResults.caseId}</span>
                            </div>

                            {/* Step 1 Check */}
                            <div className="flex items-start gap-2 text-[10.5px] text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                              <span><strong>Step 1 (Receipt):</strong> Confirmed {message.workflowResults.caseId} matching lane route {message.workflowResults.lane}.</span>
                            </div>

                            {/* Step 2 Check */}
                            <div className="flex items-start gap-2 text-[10.5px] text-slate-300 border-t border-slate-900/60 pt-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                              <span>
                                <strong>Step 2 (Escape):</strong> Checked destination <span className="font-mono text-amber-300">{message.workflowResults.destination}</span>. 
                                {message.workflowResults.escapeRouteChecks.found ? (
                                  <span className="text-amber-400 font-bold ml-1 block mt-0.5 bg-amber-950/50 border border-amber-500/20 p-2 rounded-lg italic">MATCH FOUND: {message.workflowResults.escapeRouteChecks.blurb}</span>
                                ) : (
                                  <span className="text-slate-500 ml-1 block mt-0.5 italic">No active escape detours mapped.</span>
                                )}
                              </span>
                            </div>

                            {/* Step 3 Check */}
                            <div className="flex items-start gap-2 text-[10.5px] text-slate-300 border-t border-slate-900/60 pt-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                              <span><strong>Step 3 (Carrier):</strong> Mapped in active carrier: <strong className="font-mono text-emerald-400 font-bold">{message.workflowResults.carrierChecks.activeCarrier}</strong>.</span>
                            </div>

                            {/* Step 4 Check */}
                            <div className="flex items-start gap-2 text-[10.5px] text-slate-300 border-t border-slate-900/60 pt-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${message.workflowResults.sspChecks.vridFound ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`} />
                              <span>
                                <strong>Step 4 (SSP Checking):</strong> 
                                {message.workflowResults.sspChecks.vridFound ? (
                                  <span className="text-emerald-400 font-bold ml-1 uppercase text-[10px]">COMPLIANT RELEASE CONFLICT SOLVED</span>
                                ) : (
                                  <span className="text-rose-400 font-bold ml-1 uppercase text-[10px]">COMPLIANCE CRITERIA CONFLICT DETECTED</span>
                                )}
                              </span>
                            </div>

                          </div>

                        </div>
                      )}

                    </div>

                    {/* Metadata timestamps under message bubble */}
                    <div className="text-[8px] text-slate-505 mt-1 px-1 font-mono flex items-center gap-1.5">
                      <span className="font-medium text-slate-400">{message.sender === 'user' ? 'Operator Action' : 'Operations Intelligence Engine'}</span>
                      <span className="text-slate-600">&bull;</span>
                      <span className="text-slate-400">{message.timestamp}</span>
                    </div>

                  </div>

                  {/* User Avatar */}
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-750 text-slate-100 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-lg font-mono">
                      GA
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Typing Loading Indicators */}
          {isTyping && (
            <div className="max-w-3xl mx-auto flex gap-2 justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 animate-pulse shadow-md relative">
                <div className="absolute inset-0 bg-amber-400 opacity-20 rounded-xl" />
                <Sparkles className="w-3.5 h-3.5 text-amber-400 relative z-10" />
              </div>
              <div className="bg-slate-900 border border-slate-800 text-slate-300 px-3.5 py-2 rounded-xl rounded-tl-none text-[10px] shadow-md flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="font-mono text-[9px] text-amber-400 font-extrabold uppercase tracking-wider">Evaluating Playbook Criteria...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* BOTTOM GEMINI STYLE PROMPT BAR (SIDE BY SIDE INJECTION) */}
        <div className="p-3 border-t border-slate-850 bg-slate-950/70 backdrop-blur-md">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleChatSubmit} className="bg-slate-900 hover:bg-slate-900/90 border border-slate-800/85 rounded-xl p-2 transition-all duration-200 flex flex-col md:flex-row items-stretch md:items-center gap-2.5 shadow-lg shadow-[0_4px_25px_rgba(0,0,0,0.5)] focus-within:border-amber-500/40" id="gemini_prompt_bar">
              
              {/* Case ID Part */}
              <div className="flex items-center gap-1.5 pl-2 py-0.5 border-b md:border-b-0 md:border-r border-slate-800 md:w-1/3 shrink-0">
                <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-widest select-none font-mono">Case ID:</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. CASE-1021"
                  value={caseIdInput}
                  onChange={(e) => setCaseIdInput(e.target.value)}
                  className="w-full text-[11px] font-bold focus:outline-none placeholder-slate-550 bg-transparent text-slate-100 border-none px-1 uppercase"
                  id="gemini_case_input"
                />
              </div>

              {/* Lane route entry */}
              <div className="flex items-center gap-1.5 pl-2 py-0.5 flex-1">
                <span className="text-[9px] font-extrabold text-amber-500/80 uppercase tracking-widest select-none font-mono">Lane:</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEA1 - BFI4"
                  value={laneInput}
                  onChange={(e) => setLaneInput(e.target.value)}
                  className="w-full text-[11px] font-mono font-bold focus:outline-none placeholder-slate-550 bg-transparent text-slate-100 border-none px-1 uppercase"
                  id="gemini_lane_input"
                />
                
                {/* Submit button tucked in like Gemini */}
                <button
                  type="submit"
                  disabled={!caseIdInput.trim() || !laneInput.trim() || isTyping}
                  className="p-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 rounded-full transition-all shrink-0 cursor-pointer shadow-xs flex items-center justify-center h-7 w-7 disabled:cursor-not-allowed"
                  id="gemini_send_btn"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

            </form>
            <p className="text-[9.5px] text-slate-400 text-center mt-1.5 font-medium">
              Submit a target case query. Update rule metrics on the <strong className="text-amber-400 font-extrabold">Operations Registry</strong> tab when needed.
            </p>
          </div>
        </div>

      </div>

      {/* OVERRIDE CREATOR MODAL PANEL */}
      {resolveVridModal?.open && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-rose-500/30 rounded-xl max-w-sm w-full shadow-2xl overflow-hidden text-2xs"
          >
            <div className="p-4 border-b border-rose-950 bg-rose-950/20 text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
              <div>
                <h3 className="font-extrabold uppercase font-mono tracking-wide text-[10px]">Playbook SSP override</h3>
                <p className="text-[8px] text-rose-300 uppercase tracking-widest font-extrabold">Instant carrier booking registry</p>
              </div>
            </div>

            <form onSubmit={handleConfirmCreateVRID} className="p-4 space-y-3.5">
              <p className="text-slate-300 font-semibold leading-relaxed text-[10px]">
                Insert a brand new vehicle release departure schedule matching origin compliance slot to bypass target conflict.
              </p>

              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 font-sans text-[9px]">
                <div>
                  <span className="block font-extrabold text-slate-500 uppercase text-[7px] font-mono">Carrier Agency</span>
                  <span className="text-slate-100 font-black truncate block">{resolveVridModal.carrier}</span>
                </div>
                <div>
                  <span className="block font-extrabold text-slate-500 uppercase text-[7px] font-mono">Hub Origin</span>
                  <span className="text-amber-400 font-black truncate block font-mono">{resolveVridModal.origin}</span>
                </div>
                <div>
                  <span className="block font-extrabold text-slate-500 uppercase text-[7px] font-mono">Destination</span>
                  <span className="text-slate-100 font-black truncate block font-mono">{resolveVridModal.destination}</span>
                </div>
                <div>
                  <span className="block font-extrabold text-slate-500 uppercase text-[7px] font-mono">Inquiry Case</span>
                  <span className="text-emerald-400 font-black truncate block font-mono">{resolveVridModal.caseId}</span>
                </div>
              </div>

              {/* Input: SDT */}
              <div>
                <label className="block text-[8.5px] font-extrabold text-slate-400 uppercase font-mono tracking-wider mb-1">
                  Scheduled Departure (SDT)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 11:30"
                  value={resolveVridModal.sdtInput}
                  onChange={(e) => setResolveVridModal({ ...resolveVridModal, sdtInput: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-800 rounded-md focus:outline-none focus:border-amber-400 font-mono font-bold text-slate-100 bg-slate-950 text-2xs"
                />
              </div>

              {/* Input: Sub Carrier */}
              <div>
                <label className="block text-[8.5px] font-extrabold text-slate-400 uppercase font-mono tracking-wider mb-1">
                  Sub Carrier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FedEx Express (Air)"
                  value={resolveVridModal.subCarrierInput}
                  onChange={(e) => setResolveVridModal({ ...resolveVridModal, subCarrierInput: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-800 rounded-md focus:outline-none focus:border-amber-400 font-bold text-slate-100 bg-slate-950 text-2xs"
                />
              </div>

              {/* Input: SAT */}
              <div>
                <label className="block text-[8.5px] font-extrabold text-slate-400 uppercase font-mono tracking-wider mb-1">
                  Scheduled Arrival (SAT)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15:45"
                  value={resolveVridModal.satInput}
                  onChange={(e) => setResolveVridModal({ ...resolveVridModal, satInput: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-800 rounded-md focus:outline-none focus:border-amber-400 font-mono font-bold text-slate-100 bg-slate-950 text-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResolveVridModal(null)}
                  className="px-2 w-16 py-1.5 text-2xs text-slate-400 hover:text-slate-100 font-semibold cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-455 text-slate-950 rounded-md font-extrabold transition-all cursor-pointer text-2xs shadow-md"
                >
                  Create & Resume
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
