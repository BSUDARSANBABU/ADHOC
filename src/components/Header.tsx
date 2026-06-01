/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Truck, ShieldAlert, Sparkles, Database } from 'lucide-react';

interface HeaderProps {}

export default function Header({}: HeaderProps) {
  return (
    <header className="border-b border-slate-850 bg-slate-950/75 backdrop-blur-xl sticky top-0 z-40 px-4 py-3 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.7)]" id="app_header">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="bg-linear-to-br from-amber-400 to-amber-600 text-slate-950 p-2 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-amber-400 rounded-xl blur-xs opacity-40 group-hover:opacity-100 transition-opacity" />
            <Truck className="w-5 h-5 relative z-10 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-extrabold text-sm tracking-wider text-slate-100 uppercase bg-linear-to-r from-slate-100 via-slate-200 to-amber-400 bg-clip-text text-transparent">
                Adhoc's Logistics Copilot
              </h1>
              <span className="bg-amber-500/10 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.1)]">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" /> ACTIVE AGENT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
              Autonomous Verification for Escape Routes, Carrier Lane Dashboard & SSP Compliance
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
