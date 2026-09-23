import React, { useState } from 'react';
import {
  NEXTJS_SETUP_GUIDE,
  SUPABASE_CLIENT_JS_CODE,
  SUPABASE_CLIENT_TS_CODE,
  SUPABASE_SQL_SCHEMA,
} from '../lib/constants';
import {
  fetchMatchesFromSupabase,
  fetchTeamsFromSupabase,
  getStoredCredentials,
  pushDataToSupabase,
  saveStoredCredentials,
  testSupabaseConnection,
} from '../lib/supabaseClient';
import { Match, Team } from '../types/tournament';
import { useTournament } from '../context/TournamentContext';
import {
  Check,
  CheckCircle,
  Copy,
  Database,
  ExternalLink,
  Key,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

interface SupabaseSettingsViewProps {
  teams: Team[];
  matches: Match[];
  isSupabaseConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
  onDataLoaded?: (teams: Team[], matches: Match[]) => void;
}

export const SupabaseSettingsView: React.FC<SupabaseSettingsViewProps> = ({
  teams,
  matches,
  isSupabaseConnected,
  onConnectionChange,
  onDataLoaded,
}) => {
  const { activeTournamentId } = useTournament();
  const initialCreds = getStoredCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(initialCreds.url);
  const [anonKey, setAnonKey] = useState(initialCreds.anonKey);
  const [activeGuideTab, setActiveGuideTab] = useState<'sql' | 'client' | 'nextjs'>('sql');

  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  const [syncStatus, setSyncStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  const [fetchStatus, setFetchStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl || !anonKey) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Please provide both your Supabase URL and Anon Public Key.',
      });
      return;
    }

    setTestStatus({ loading: true });
    saveStoredCredentials(supabaseUrl, anonKey);

    const result = await testSupabaseConnection(supabaseUrl, anonKey);
    setTestStatus({
      loading: false,
      success: result.success,
      message: result.message,
    });
    onConnectionChange(result.success);
  };

  const handleSyncToSupabase = async () => {
    setSyncStatus({ loading: true });
    const result = await pushDataToSupabase(teams, matches, activeTournamentId);
    setSyncStatus({
      loading: false,
      success: result.success,
      message: result.message,
    });
  };

  const handleFetchFromSupabase = async () => {
    setFetchStatus({ loading: true });
    const [teamsRes, matchesRes] = await Promise.all([
      fetchTeamsFromSupabase(activeTournamentId),
      fetchMatchesFromSupabase(activeTournamentId),
    ]);

    if (teamsRes.success && teamsRes.data && teamsRes.data.length > 0) {
      const fetchedMatches = matchesRes.success && matchesRes.data ? matchesRes.data : matches;
      if (onDataLoaded) {
        onDataLoaded(teamsRes.data, fetchedMatches);
      }
      setFetchStatus({
        loading: false,
        success: true,
        message: `Successfully pulled ${teamsRes.data.length} teams and ${
          matchesRes.data ? matchesRes.data.length : 0
        } matches from Supabase!`,
      });
    } else {
      setFetchStatus({
        loading: false,
        success: false,
        message: teamsRes.message || 'No teams found in Supabase database yet. Run the SQL schema or click "Sync Teams & Matches" to populate initial data.',
      });
    }
  };

  const handleResetToUserProject = () => {
    const defaultUrl = 'https://yxzdukkwztpcrmwpznry.supabase.co';
    const defaultAnon =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emR1a2t3enRwY3Jtd3B6bnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNTczNDYsImV4cCI6MjEwNTczMzM0Nn0.mOinLYgFzGb9tdZ9aoCMDjIL-cuURYxWQdE19-2S4yU';
    setSupabaseUrl(defaultUrl);
    setAnonKey(defaultAnon);
    saveStoredCredentials(defaultUrl, defaultAnon);
    setTestStatus({
      loading: false,
      success: true,
      message: 'Restored project configuration to yxzdukkwztpcrmwpznry.supabase.co',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Backend & Database</span>
              <span aria-hidden="true">·</span>
              <span>PostgreSQL & RLS</span>
              <span aria-hidden="true">·</span>
              <span>Supabase REST API</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Database className="w-6 h-6 text-emerald-600" />
              Supabase Connection & Database Setup
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Connect your live Supabase project to safely store teams, matches, and standings online. Run the SQL schema script in your Supabase SQL editor to initialize tables and row-level security.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <span>Open Supabase Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>
        </div>
      </div>

      {/* Live Credentials & Connection Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Live Supabase Project Connection
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
            ></span>
            <span className="text-xs font-semibold text-slate-700">
              {isSupabaseConnected ? 'Connected to Supabase' : 'Offline / Local Demo Mode'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://xyzproject.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supabase Anon Public API Key
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
              />
              <Key className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Buttons & Status */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={testStatus.loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${testStatus.loading ? 'animate-spin' : ''}`}
              />
              <span>Test Connection</span>
            </button>

            {isSupabaseConnected && (
              <>
                <button
                  onClick={handleSyncToSupabase}
                  disabled={syncStatus.loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
                  title="Push local teams and fixtures to Supabase database"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sync Local Data to Supabase</span>
                </button>

                <button
                  onClick={handleFetchFromSupabase}
                  disabled={fetchStatus.loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
                  title="Pull latest teams and matches from Supabase database"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${fetchStatus.loading ? 'animate-spin' : ''}`}
                  />
                  <span>Fetch from Supabase</span>
                </button>
              </>
            )}

            <button
              onClick={handleResetToUserProject}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
              title="Reset URL and Anon Key to default (yxzdukkwztpcrmwpznry)"
            >
              <span>Reset to yxzdukkwztpcrmwpznry</span>
            </button>
          </div>

          {testStatus.message && (
            <div
              className={`text-xs font-medium px-3 py-1.5 rounded-md ${
                testStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testStatus.message}
            </div>
          )}

          {syncStatus.message && (
            <div
              className={`text-xs font-medium px-3 py-1.5 rounded-md ${
                syncStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {syncStatus.message}
            </div>
          )}

          {fetchStatus.message && (
            <div
              className={`text-xs font-medium px-3 py-1.5 rounded-md ${
                fetchStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}
            >
              {fetchStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* Code & Setup Instructions Tabs (Direct Answer to Prompt 1) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/70 px-4 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveGuideTab('sql')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg border-b-2 transition-all ${
              activeGuideTab === 'sql'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>1. Supabase SQL Schema</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('client')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg border-b-2 transition-all ${
              activeGuideTab === 'client'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>2. supabaseClient.js Utility</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('nextjs')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg border-b-2 transition-all ${
              activeGuideTab === 'nextjs'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>3. Next.js + Tailwind Setup Instructions</span>
          </button>
        </div>

        {/* Tab 1: SQL Schema */}
        {activeGuideTab === 'sql' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Supabase SQL Editor Commands (`teams` & `matches`)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Creates the `teams` table with UUID primary key, `matches` table with referential integrity foreign keys, performance indexes, and RLS policies.
                </p>
              </div>
              <button
                onClick={() => handleCopy(SUPABASE_SQL_SCHEMA, 'sql')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shrink-0 shadow-xs"
              >
                {copiedSection === 'sql' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied SQL!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL Commands</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative rounded-lg bg-slate-900 text-slate-200 p-4 font-mono text-xs overflow-x-auto max-h-[450px]">
              <pre>{SUPABASE_SQL_SCHEMA}</pre>
            </div>
          </div>
        )}

        {/* Tab 2: supabaseClient.js */}
        {activeGuideTab === 'client' && (
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    JavaScript Client: `lib/supabaseClient.js`
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standard ES module export for vanilla Next.js or React projects.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(SUPABASE_CLIENT_JS_CODE, 'client_js')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-xs"
                >
                  {copiedSection === 'client_js' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied JS!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy supabaseClient.js</span>
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-lg bg-slate-900 text-slate-200 p-4 font-mono text-xs overflow-x-auto">
                <pre>{SUPABASE_CLIENT_JS_CODE}</pre>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    TypeScript Client: `lib/supabaseClient.ts`
                  </h3>
                  <p className="text-xs text-slate-500">
                    Typed version for TypeScript Next.js setups.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(SUPABASE_CLIENT_TS_CODE, 'client_ts')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-xs"
                >
                  {copiedSection === 'client_ts' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied TS!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy supabaseClient.ts</span>
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-lg bg-slate-900 text-slate-200 p-4 font-mono text-xs overflow-x-auto">
                <pre>{SUPABASE_CLIENT_TS_CODE}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Next.js + Tailwind Instructions */}
        {activeGuideTab === 'nextjs' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Next.js + Tailwind CSS Project Initialization
                </h3>
                <p className="text-xs text-slate-500">
                  Step-by-step terminal commands to spin up a new Next.js 14/15 app directory project.
                </p>
              </div>
              <button
                onClick={() => handleCopy(NEXTJS_SETUP_GUIDE, 'nextjs_commands')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-xs shrink-0"
              >
                {copiedSection === 'nextjs_commands' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Commands!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Shell Script</span>
                  </>
                )}
              </button>
            </div>

            <div className="rounded-lg bg-slate-900 text-emerald-400 p-4 font-mono text-xs overflow-x-auto">
              <pre>{NEXTJS_SETUP_GUIDE}</pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-1">
                  1. App Directory
                </span>
                <p className="text-xs text-slate-600">
                  Uses modern App Router (`app/page.tsx` and `app/layout.tsx`) with zero complex backend routes needed.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-1">
                  2. Tailwind CSS Styling
                </span>
                <p className="text-xs text-slate-600">
                  Clean, modern, light-themed graphics, crisp typography, and responsive tabular figures.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-1">
                  3. Dynamic Standings
                </span>
                <p className="text-xs text-slate-600">
                  Matches are stored in Supabase, and standings/brackets are computed purely on the client side without manual DB mutations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
