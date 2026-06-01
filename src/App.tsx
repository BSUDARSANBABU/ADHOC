/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import DatabaseEditor from './components/DatabaseEditor';
import { 
  INITIAL_ESCAPE_ROUTES, 
  INITIAL_CARRIER_LANES, 
  INITIAL_SSP_COMPLIANCE, 
  INITIAL_VRIDS 
} from './mockData';
import { ChatMessage, EscapeRoute, CarrierLane, SSPCompliance, VRID } from './types';
import { 
  Sparkles, 
  Database, 
  RefreshCw, 
  Layers, 
  MessageSquare, 
  Plus,
  X
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'databases'>('chat');

  // Roster collections logged inside the sandbox state
  const [escapeRoutes, setEscapeRoutes] = useState<EscapeRoute[]>(INITIAL_ESCAPE_ROUTES);
  const [carrierLanes, setCarrierLanes] = useState<CarrierLane[]>(INITIAL_CARRIER_LANES);
  const [sspCompliances, setSspCompliances] = useState<SSPCompliance[]>(INITIAL_SSP_COMPLIANCE);
  const [vrids, setVrids] = useState<VRID[]>(INITIAL_VRIDS);

  // Buffer state definitions for Chat Slots (defaults to displaying only Chat 1 initially, up to 10 unique slots)
  const [activeTabId, setActiveTabId] = useState<number>(1);
  const [openTabIds, setOpenTabIds] = useState<number[]>([1]);

  const [chatSessions, setChatSessions] = useState<Record<number, ChatMessage[]>>(() => {
    const initial: Record<number, ChatMessage[]> = {};
    for (let i = 1; i <= 10; i++) {
      initial[i] = [];
    }
    return initial;
  });

  const [sessionMeta, setSessionMeta] = useState<Record<number, { title: string; activeCase?: string; activeLane?: string }>>(() => {
    const initial: Record<number, { title: string; activeCase?: string; activeLane?: string }> = {};
    for (let i = 1; i <= 10; i++) {
      initial[i] = { title: `Chat ${i}` };
    }
    return initial;
  });

  const handleResetMocks = () => {
    setEscapeRoutes(INITIAL_ESCAPE_ROUTES);
    setCarrierLanes(INITIAL_CARRIER_LANES);
    setSspCompliances(INITIAL_SSP_COMPLIANCE);
    setVrids(INITIAL_VRIDS);
    
    // Add real-time log confirmation to current selected slot
    const resetMsg: ChatMessage = {
      id: `system-reset-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: "🔄 **Logistics Databases Repopulated.** Original playbook configurations (Escape Routes, Carrier Assignments, and SSP compliance brackets) are now fully recovered."
    };
    setChatSessions(prev => ({
      ...prev,
      [activeTabId]: [...(prev[activeTabId] || []), resetMsg]
    }));
  };

  const handleCloseTab = (tabNum: number, event: React.MouseEvent) => {
    event.stopPropagation(); // prevent triggering tab select
    
    // Filter out the closed tab
    const nextOpenTabs = openTabIds.filter(id => id !== tabNum);
    
    if (nextOpenTabs.length === 0) {
      // If no chats are left, display chat 1 as requested ("when ever no chat is there then display chat 1")
      setOpenTabIds([1]);
      setActiveTabId(1);
    } else {
      setOpenTabIds(nextOpenTabs);
      // Reposition activeTabId if the closed tab was currently active
      if (activeTabId === tabNum) {
        // Find closest remaining slot
        const closedIndex = openTabIds.indexOf(tabNum);
        const nextActiveIndex = Math.max(0, closedIndex - 1);
        if (nextOpenTabs[nextActiveIndex] !== undefined) {
          setActiveTabId(nextOpenTabs[nextActiveIndex]);
        } else {
          setActiveTabId(nextOpenTabs[0]);
        }
      }
    }
  };

  const handleAddSlot = () => {
    // Find first available slot ID between 1 and 10 that is not currently in openTabIds
    let nextId = -1;
    for (let i = 1; i <= 10; i++) {
      if (!openTabIds.includes(i)) {
        nextId = i;
        break;
      }
    }
    if (nextId !== -1) {
      setOpenTabIds(prev => [...prev, nextId].sort((a, b) => a - b));
      setActiveTabId(nextId);
      setActiveTab('chat');
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden" id="app_root">
      {/* 3D Animated Glowing Orbs for immersive glass depth */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-amber-500/8 blur-[120px] pointer-events-none animate-glow-orb-1" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/8 blur-[140px] pointer-events-none animate-glow-orb-2" />
      <div className="absolute top-10 right-10 w-[250px] h-[250px] rounded-full bg-emerald-500/6 blur-[90px] pointer-events-none animate-slow-pulse" />
      
      {/* Cybernetic Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(245,158,11,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="flex-1 flex flex-col z-10 relative">
        {/* High-Tech Top Ticker Banner */}
        <div className="bg-amber-950/40 backdrop-blur-md border-b border-amber-500/20 py-1.5 px-4 text-center text-[10px] text-amber-400 font-mono tracking-widest flex items-center justify-center gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_8px_rgba(0,0,0,0.4)]" id="adhoc_ticker_banner">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span className="font-bold">ADHOC TRANS CO-PILOT SYSTEM</span>
          <span className="text-amber-500/40">&bull;</span>
          <span className="text-amber-300">NO LICENSE REQUIRED</span>
          <span className="text-amber-500/40">&bull;</span>
          <span className="font-medium">BUILT FOR OPERATIONS ASSURANCE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
        </div>

        {/* PERSISTENT MULTI-TAB CONTROLLER LANE (With clean right-aligned icons) */}
        <div className="max-w-7xl w-full mx-auto px-4 pt-3.5 pb-0.5 z-20" id="global_tabs_dashboard">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-3 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Header info */}
            <div className="flex items-center gap-2 text-[10.5px] font-extrabold text-slate-200 uppercase tracking-wider shrink-0 select-none">
              <Layers className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Operational Audits</span>
              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-normal uppercase">
                {openTabIds.length} / 10 active
              </span>
            </div>

            {/* Horizontal Scrollable Tabs Selection Lane */}
            <div className="flex-1 flex items-center gap-2.5 overflow-hidden">
              <div className="flex items-stretch gap-2 overflow-x-auto scrollbar-none py-1 max-w-full flex-1">
                {openTabIds.map((tabNum) => {
                  const isActive = activeTab === 'chat' && activeTabId === tabNum;
                  const meta = sessionMeta[tabNum] || { title: `Chat ${tabNum}` };
                  const hasMessages = chatSessions[tabNum] && chatSessions[tabNum].length > 0;
                  
                  return (
                    <div
                      key={tabNum}
                      onClick={() => {
                        setActiveTabId(tabNum);
                        setActiveTab('chat');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 shrink-0 flex items-center gap-2 border select-none cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] ${
                        isActive 
                          ? 'bg-linear-to-br from-amber-400 to-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]' 
                          : 'bg-slate-950/70 border-slate-850 text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                      }`}
                      id={`global_tab_trigger_${tabNum}`}
                    >
                      <MessageSquare className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950 font-black' : 'text-slate-500'}`} />
                      <div className="text-left leading-tight">
                        <div className="flex items-center gap-1">
                          <span className={isActive ? 'font-black' : 'font-bold'}>Chat {tabNum}</span>
                          {hasMessages ? (
                            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-slate-950' : 'bg-emerald-400 animate-pulse'}`} />
                          ) : (
                            <span className="h-1.5 w-1.5 bg-slate-800 rounded-full" />
                          )}
                        </div>
                        {meta.activeCase && (
                          <span className={`block text-[8px] font-mono tracking-tighter truncate max-w-[65px] font-black uppercase ${isActive ? 'text-slate-950/85 font-black' : 'text-amber-400'}`}>
                            {meta.activeCase}
                          </span>
                        )}
                      </div>

                      {/* Close button at the end of the tab (always show, so user can close down to 0/1) */}
                      <button
                        onClick={(e) => handleCloseTab(tabNum, e)}
                        className={`p-0.5 rounded-md transition-all hover:bg-black/10 focus:outline-none cursor-pointer relative z-10 -mr-1 ml-1 ${
                          isActive ? 'text-slate-950 hover:bg-slate-950/10' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title={`Close Slot ${tabNum}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {/* '+' Button to incrementally add next tab up to 10 max */}
                {openTabIds.length < 10 && (
                  <button
                    onClick={handleAddSlot}
                    className="px-3 py-1.5 rounded-lg text-[10px] bg-slate-950/50 border border-slate-850 hover:border-amber-500/40 text-amber-400 hover:text-slate-100 transition-all font-black shrink-0 flex items-center gap-1 cursor-pointer h-full border-dashed"
                    title="Unlock next active operational audit slot"
                    id="add_new_slot_btn"
                  >
                    <Plus className="w-3.5 h-3.5 animate-pulse text-amber-450" />
                    <span>ADD SLOT</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right block: Action icons row */}
            <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-3 shrink-0 justify-end">
              {/* Chat Co-Pilot Icon */}
              <button
                onClick={() => setActiveTab('chat')}
                className={`p-2 rounded-xl border transition-all duration-250 cursor-pointer flex items-center justify-center relative group ${
                  activeTab === 'chat'
                    ? 'bg-linear-to-br from-amber-400 to-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-100 hover:border-slate-700'
                }`}
                title="Chat Co-Pilot"
                id="tab_chat_icon_only"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              {/* Operations Registry Icon */}
              <button
                onClick={() => setActiveTab('databases')}
                className={`p-2 rounded-xl border transition-all duration-250 cursor-pointer flex items-center justify-center relative group ${
                  activeTab === 'databases'
                    ? 'bg-linear-to-br from-amber-400 to-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-100 hover:border-slate-700'
                }`}
                title="Operations Registry"
                id="tab_db_icon_only"
              >
                <Database className="w-4 h-4" />
              </button>

              {/* Divider */}
              <span className="w-px h-5 bg-slate-850" />

              {/* Reset Systems Icon */}
              <button
                onClick={handleResetMocks}
                className="p-2 rounded-xl border border-slate-850 bg-slate-950 text-slate-400 hover:text-slate-100 hover:border-slate-700 active:translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center justify-center"
                title="Reset systems / Repopulate default databases"
                id="reset_mocks_icon_only"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Global workspace content area */}
        <main className="max-w-7xl w-full mx-auto p-4 flex-1 flex flex-col justify-start">
          {activeTab === 'chat' ? (
            <ChatInterface
              escapeRoutes={escapeRoutes}
              carrierLanes={carrierLanes}
              sspCompliances={sspCompliances}
              vrids={vrids}
              setVrids={setVrids}
              activeTabId={activeTabId}
              setActiveTabId={setActiveTabId}
              chatSessions={chatSessions}
              setChatSessions={setChatSessions}
              sessionMeta={sessionMeta}
              setSessionMeta={setSessionMeta}
              openTabIds={openTabIds}
              setOpenTabIds={setOpenTabIds}
            />
          ) : (
            <DatabaseEditor
              escapeRoutes={escapeRoutes}
              setEscapeRoutes={setEscapeRoutes}
              carrierLanes={carrierLanes}
              setCarrierLanes={setCarrierLanes}
              sspCompliances={sspCompliances}
              setSspCompliances={setSspCompliances}
              vrids={vrids}
              setVrids={setVrids}
            />
          )}
        </main>
      </div>
    </div>
  );
}
