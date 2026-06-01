/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EscapeRoute, CarrierLane, VRID, SSPCompliance } from '../types';
import { 
  ShieldAlert, 
  Truck, 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  Search, 
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Database
} from 'lucide-react';

interface DatabaseEditorProps {
  escapeRoutes: EscapeRoute[];
  setEscapeRoutes: React.Dispatch<React.SetStateAction<EscapeRoute[]>>;
  carrierLanes: CarrierLane[];
  setCarrierLanes: React.Dispatch<React.SetStateAction<CarrierLane[]>>;
  sspCompliances: SSPCompliance[];
  setSspCompliances: React.Dispatch<React.SetStateAction<SSPCompliance[]>>;
  vrids: VRID[];
  setVrids: React.Dispatch<React.SetStateAction<VRID[]>>;
}

type SubTab = 'escape' | 'carriers' | 'ssp' | 'vrids';

export default function DatabaseEditor({
  escapeRoutes,
  setEscapeRoutes,
  carrierLanes,
  setCarrierLanes,
  sspCompliances,
  setSspCompliances,
  vrids,
  setVrids
}: DatabaseEditorProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('escape');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for creating new records
  const [newEscape, setNewEscape] = useState({ destination: '', blurb: '' });
  const [newCarrierLane, setNewCarrierLane] = useState({ origin: '', destination: '', activeCarrier: '' });
  const [newSSP, setNewSSP] = useState({ carrier: '', origin: '', loadingComplianceWindow: '08:00 - 15:00', startHour: 8, endHour: 15 });
  const [newVRID, setNewVRID] = useState({ id: '', carrier: '', origin: '', destination: '', sdt: '' });

  const [formError, setFormError] = useState('');

  const handleDeleteEscape = (id: string) => {
    setEscapeRoutes(prev => prev.filter(item => item.id !== id));
  };

  const handleDeleteCarrierLane = (id: string) => {
    setCarrierLanes(prev => prev.filter(item => item.id !== id));
  };

  const handleDeleteSSP = (id: string) => {
    setSspCompliances(prev => prev.filter(item => item.id !== id));
  };

  const handleDeleteVRID = (id: string) => {
    setVrids(prev => prev.filter(item => item.id !== id));
  };

  const handleAddEscape = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEscape.destination || !newEscape.blurb) {
      setFormError('Please fill out all fields.');
      return;
    }
    const destUpper = newEscape.destination.trim().toUpperCase();
    if (escapeRoutes.some(item => item.destination === destUpper)) {
      setFormError(`An escape route for ${destUpper} already exists.`);
      return;
    }
    setEscapeRoutes(prev => [
      ...prev,
      {
        id: `er-${Date.now()}`,
        destination: destUpper,
        blurb: newEscape.blurb
      }
    ]);
    setNewEscape({ destination: '', blurb: '' });
    setFormError('');
  };

  const handleAddCarrierLane = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCarrierLane.origin || !newCarrierLane.destination || !newCarrierLane.activeCarrier) {
      setFormError('Please fill out all fields.');
      return;
    }
    const o = newCarrierLane.origin.trim().toUpperCase();
    const d = newCarrierLane.destination.trim().toUpperCase();
    if (carrierLanes.some(item => item.origin === o && item.destination === d)) {
      setFormError(`A carrier assignment for lane ${o} - ${d} already exists.`);
      return;
    }
    setCarrierLanes(prev => [
      ...prev,
      {
        id: `cl-${Date.now()}`,
        origin: o,
        destination: d,
        activeCarrier: newCarrierLane.activeCarrier.trim()
      }
    ]);
    setNewCarrierLane({ origin: '', destination: '', activeCarrier: '' });
    setFormError('');
  };

  const handleAddSSP = (e: React.FormEvent) => {
    e.preventDefault();
    const { carrier, origin, loadingComplianceWindow } = newSSP;
    if (!carrier || !origin || !loadingComplianceWindow) {
      setFormError('Please fill out all fields.');
      return;
    }
    
    const regex = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/;
    const m = loadingComplianceWindow.match(regex);
    if (!m) {
      setFormError('Compliance Window must be format HH:MM - HH:MM (e.g. 08:00 - 15:00)');
      return;
    }

    const startH = Number(m[1]) + Number(m[2]) / 60;
    const endH = Number(m[3]) + Number(m[4]) / 60;

    const o = origin.trim().toUpperCase();
    const c = carrier.trim();

    if (sspCompliances.some(item => item.origin === o && item.carrier.toLowerCase() === c.toLowerCase())) {
      setFormError(`Compliance settings already exist for ${c} at ${o}.`);
      return;
    }

    setSspCompliances(prev => [
      ...prev,
      {
        id: `ssp-${Date.now()}`,
        carrier: c,
        origin: o,
        loadingComplianceWindow: loadingComplianceWindow.trim(),
        startHour: Math.floor(startH),
        endHour: Math.floor(endH)
      }
    ]);
    setNewSSP({ carrier: '', origin: '', loadingComplianceWindow: '08:00 - 15:00', startHour: 8, endHour: 15 });
    setFormError('');
  };

  const handleAddVRID = (e: React.FormEvent) => {
    e.preventDefault();
    const { id, carrier, origin, destination, sdt } = newVRID;
    if (!id || !carrier || !origin || !destination || !sdt) {
      setFormError('Please fill out all fields.');
      return;
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(sdt.trim())) {
      setFormError('Scheduled Departure Time (SDT) must be in 24h format HH:MM.');
      return;
    }

    const cleanId = id.trim().toUpperCase();
    if (vrids.some(v => v.id === cleanId)) {
      setFormError(`VRID ${cleanId} already exists in the database.`);
      return;
    }

    setVrids(prev => [
      ...prev,
      {
        id: cleanId,
        carrier: carrier.trim(),
        origin: origin.trim().toUpperCase(),
        destination: destination.trim().toUpperCase(),
        sdt: sdt.trim()
      }
    ]);
    setNewVRID({ id: '', carrier: '', origin: '', destination: '', sdt: '' });
    setFormError('');
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col h-[calc(100vh-160px)] min-h-[460px]" id="database_container">
      {/* DB Header section */}
      <div className="p-4 border-b border-slate-850 bg-slate-950/80 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            Operations Registry Database
          </h2>
          <p className="text-[10.5px] text-slate-400 mt-1 font-semibold">
            Modify the logistics registers dynamically to test different decision workflows.
          </p>
        </div>
        
        {/* Search input */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter database..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-slate-950/90 border border-slate-800 rounded-lg focus:outline-none focus:border-amber-450 text-slate-200 placeholder-slate-500 font-semibold"
            id="db_search_input"
          />
        </div>
      </div>

      {/* Sub tabs for different registries */}
      <div className="flex border-b border-slate-850 bg-slate-950/30 px-3 text-[10.5px] font-extrabold tracking-wider uppercase">
        <button
          onClick={() => { setActiveSubTab('escape'); setFormError(''); }}
          className={`px-4 py-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'escape' 
              ? 'border-amber-400 text-amber-400 bg-slate-900/40 font-black' 
              : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-900/10'
          }`}
          id="subtab_escape_btn"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-455" />
          Escape Routes ({escapeRoutes.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('carriers'); setFormError(''); }}
          className={`px-4 py-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'carriers' 
              ? 'border-amber-400 text-amber-400 bg-slate-900/40 font-black' 
              : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-900/10'
          }`}
          id="subtab_carriers_btn"
        >
          <Truck className="w-3.5 h-3.5 text-emerald-400" />
          Carriers ({carrierLanes.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('ssp'); setFormError(''); }}
          className={`px-4 py-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'ssp' 
              ? 'border-amber-400 text-amber-400 bg-slate-900/40 font-black' 
              : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-900/10'
          }`}
          id="subtab_ssp_btn"
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          SSP Windows ({sspCompliances.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('vrids'); setFormError(''); }}
          className={`px-4 py-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'vrids' 
              ? 'border-amber-400 text-amber-400 bg-slate-900/40 font-black' 
              : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-900/10'
          }`}
          id="subtab_vrids_btn"
        >
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          VRID Rules ({vrids.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table representation */}
        <div className="lg:col-span-2 overflow-y-auto border border-slate-800 bg-slate-950/40 rounded-xl max-h-[420px] scrollbar-none">
          {activeSubTab === 'escape' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-850 font-extrabold text-slate-400 uppercase tracking-widest text-[8.5px]">
                    <th className="p-3">Destination</th>
                    <th className="p-3">Escape Route Alert Blurb</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-200">
                  {escapeRoutes
                    .filter(r => r.destination.toLowerCase().includes(searchTerm.toLowerCase()) || r.blurb.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(item => (
                      <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-mono font-black text-amber-400 bg-amber-500/5 border-r border-slate-850/40">
                          {item.destination}
                        </td>
                        <td className="p-3 text-slate-300 font-semibold italic">
                          {item.blurb}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteEscape(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {escapeRoutes.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-500 font-semibold">
                        No escape routes configured. Add one below!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeSubTab === 'carriers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-850 font-extrabold text-slate-400 uppercase tracking-widest text-[8.5px]">
                    <th className="p-3">Origin</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">Active Carrier</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-200">
                  {carrierLanes
                    .filter(cl => cl.origin.toLowerCase().includes(searchTerm.toLowerCase()) || cl.destination.toLowerCase().includes(searchTerm.toLowerCase()) || cl.activeCarrier.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(item => (
                      <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-mono font-black text-slate-100">{item.origin}</td>
                        <td className="p-3 font-mono font-black text-slate-100">{item.destination}</td>
                        <td className="p-3">
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase">
                            {item.activeCarrier}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteCarrierLane(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {carrierLanes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 font-semibold">
                        No carrier assignments configured. Add one below!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeSubTab === 'ssp' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-850 font-extrabold text-slate-400 uppercase tracking-widest text-[8.5px]">
                    <th className="p-3">Carrier</th>
                    <th className="p-3">Origin Hub</th>
                    <th className="p-3">Compliance Window</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-200">
                  {sspCompliances
                    .filter(c => c.carrier.toLowerCase().includes(searchTerm.toLowerCase()) || c.origin.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(item => (
                      <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-extrabold text-slate-100">{item.carrier}</td>
                        <td className="p-3 font-mono font-black text-amber-400">{item.origin}</td>
                        <td className="p-3">
                          <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded text-[9.5px] font-bold font-mono inline-flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-indigo-400" />
                            {item.loadingComplianceWindow}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteSSP(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {sspCompliances.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 font-semibold">
                        No SSP compliance configurations. Add one below!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeSubTab === 'vrids' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-850 font-extrabold text-slate-400 uppercase tracking-widest text-[8.5px]">
                    <th className="p-3">VRID ID</th>
                    <th className="p-3">Carrier</th>
                    <th className="p-3">Lane Details</th>
                    <th className="p-3">SDT (Departure)</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-200">
                  {vrids
                    .filter(v => v.id.toLowerCase().includes(searchTerm.toLowerCase()) || v.carrier.toLowerCase().includes(searchTerm.toLowerCase()) || v.origin.toLowerCase().includes(searchTerm.toLowerCase()) || v.destination.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(item => (
                      <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-mono font-black text-amber-400 bg-slate-900/40">{item.id}</td>
                        <td className="p-3 text-slate-300 font-semibold">{item.carrier}</td>
                        <td className="p-3 font-mono text-slate-400">
                          {item.origin} &rarr; {item.destination}
                        </td>
                        <td className="p-3 font-black text-emerald-400 font-mono">{item.sdt}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteVRID(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {vrids.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-semibold">
                        No scheduled VRID records found. Add one manually!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add new record panel */}
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-extrabold text-slate-200 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1">
              Add New Record
            </h3>
            
            {formError && (
              <div className="p-2.5 mb-3 text-rose-300 bg-rose-950/40 border border-rose-500/25 rounded-lg text-[10px] leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Escape Routes Input */}
            {activeSubTab === 'escape' && (
              <form onSubmit={handleAddEscape} className="space-y-3">
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Destination Node (e.g. BFI4)</label>
                  <input
                    type="text"
                    required
                    placeholder="BFI4"
                    value={newEscape.destination}
                    onChange={(e) => setNewEscape({ ...newEscape, destination: e.target.value })}
                    className="w-full px-3 py-1.5 text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:border-amber-400 bg-slate-950 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Alert Blurb Description</label>
                  <textarea
                    required
                    placeholder="Provide critical guidance blurb..."
                    rows={2}
                    value={newEscape.blurb}
                    onChange={(e) => setNewEscape({ ...newEscape, blurb: e.target.value })}
                    className="w-full px-3 py-1.5 text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:border-amber-400 bg-slate-950 text-slate-100 resize-none font-sans"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-[10.5px] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Escape Route
                </button>
              </form>
            )}

            {/* Carriers Lane Input */}
            {activeSubTab === 'carriers' && (
              <form onSubmit={handleAddCarrierLane} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Origin Node</label>
                    <input
                      type="text"
                      required
                      placeholder="SEA1"
                      value={newCarrierLane.origin}
                      onChange={(e) => setNewCarrierLane({ ...newCarrierLane, origin: e.target.value })}
                      className="w-full px-3 py-1.5 text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:border-amber-400 bg-slate-950 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Destination Node</label>
                    <input
                      type="text"
                      required
                      placeholder="BFI4"
                      value={newCarrierLane.destination}
                      onChange={(e) => setNewCarrierLane({ ...newCarrierLane, destination: e.target.value })}
                      className="w-full px-3 py-1.5 text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:border-amber-400 bg-slate-950 text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Assigned Carrier Name</label>
                  <input
                    type="text"
                    required
                    placeholder="FedEx Logistics"
                    value={newCarrierLane.activeCarrier}
                    onChange={(e) => setNewCarrierLane({ ...newCarrierLane, activeCarrier: e.target.value })}
                    className="w-full px-3 py-1.5 text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:border-amber-400 bg-slate-950 text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-[10.5px] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Assign Active Carrier
                </button>
              </form>
            )}

            {/* SSP Comp Input */}
            {activeSubTab === 'ssp' && (
              <form onSubmit={handleAddSSP} className="space-y-3">
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Carrier Name</label>
                  <input
                    type="text"
                    required
                    placeholder="FedEx Logistics"
                    value={newSSP.carrier}
                    onChange={(e) => setNewSSP({ ...newSSP, carrier: e.target.value })}
                    className="w-full px-3 py-1.5 text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:border-amber-400 bg-slate-950 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Origin Node of Carrier</label>
                  <input
                    type="text"
                    required
                    placeholder="SEA1"
                    value={newSSP.origin}
                    onChange={(e) => setNewSSP({ ...newSSP, origin: e.target.value })}
                    className="w-full px-3 py-1.5 text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:border-amber-400 bg-slate-950 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Compliance Departure Window</label>
                  <input
                    type="text"
                    required
                    placeholder="08:00 - 15:00"
                    value={newSSP.loadingComplianceWindow}
                    onChange={(e) => setNewSSP({ ...newSSP, loadingComplianceWindow: e.target.value })}
                    className="w-full px-3 py-1.5 text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:border-amber-400 bg-slate-950 text-slate-100 font-mono text-amber-400"
                  />
                  <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Must match 'HH:MM - HH:MM' shape.</p>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-[10.5px] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Setup Compliance Rule
                </button>
              </form>
            )}

            {/* VRIDs Input */}
            {activeSubTab === 'vrids' && (
              <form onSubmit={handleAddVRID} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">VRID ID (Unique)</label>
                    <input
                      type="text"
                      required
                      placeholder="VRID-40221"
                      value={newVRID.id}
                      onChange={(e) => setNewVRID({ ...newVRID, id: e.target.value })}
                      className="w-full px-3 py-1.5 text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:border-amber-400 bg-slate-950 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">SDT Time (24h)</label>
                    <input
                      type="text"
                      required
                      placeholder="13:30"
                      value={newVRID.sdt}
                      onChange={(e) => setNewVRID({ ...newVRID, sdt: e.target.value })}
                      className="w-full px-3 py-1.5 text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:border-amber-400 bg-slate-950 text-slate-100 font-mono text-emerald-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Carrier Agency</label>
                  <input
                    type="text"
                    required
                    placeholder="FedEx Logistics"
                    value={newVRID.carrier}
                    onChange={(e) => setNewVRID({ ...newVRID, carrier: e.target.value })}
                    className="w-full px-3 py-1.5 text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:border-amber-400 bg-slate-950 text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Origin</label>
                    <input
                      type="text"
                      required
                      placeholder="SEA1"
                      value={newVRID.origin}
                      onChange={(e) => setNewVRID({ ...newVRID, origin: e.target.value })}
                      className="w-full px-3 py-1.5 text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:border-amber-400 bg-slate-950 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Destination</label>
                    <input
                      type="text"
                      required
                      placeholder="BFI4"
                      value={newVRID.destination}
                      onChange={(e) => setNewVRID({ ...newVRID, destination: e.target.value })}
                      className="w-full px-3 py-1.5 text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:border-amber-400 bg-slate-950 text-slate-100"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-[10.5px] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Register VRID
                </button>
              </form>
            )}
          </div>

          <div className="border-t border-slate-800 mt-4 pt-3 text-[8.5px] text-slate-400 leading-relaxed">
            <h4 className="font-extrabold text-slate-300 uppercase tracking-widest mb-1">Playground Tips</h4>
            <ul className="list-disc pl-3.5 space-y-1">
              <li>Add a destination to the <strong className="text-amber-400 font-extrabold font-mono">Escape Routes</strong> to see its alert blurb in step 2.</li>
              <li>Verify the assigned carrier matches on the origin/destination lane during step 3.</li>
              <li>Add a <strong className="text-amber-400 font-extrabold font-mono">Scheduled VRID</strong> with an SDT inside the compliant window to pass loading compliance automatically!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
