import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, RefreshCw, Activity, DollarSign, 
  BarChart3, Bitcoin, ChevronDown, Play, AlertCircle 
} from 'lucide-react';

// Configuration
const SHEET_ID = import.meta.env.VITE_SHEET_ID || '1OuEvGdiiG8qQSEbAIVaMyitUsr2bBc6WaxnyjjvC1Uc';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
// The webhook URL for your test node
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_CURRENCY_YZ_WEBHOOK; 

const TabbedDashboard = () => {
  const [activeMainTab, setActiveMainTab] = useState('INDEX');
  const [activeSubTab, setActiveSubTab] = useState({
    INDEX: 'US Markets',
    CURRENCIES: 'Major FX',
    FUTURES: 'US Markets',
    CRYPTO: 'Digital Assets',
  });
  
  // UI States
  const [refreshing, setRefreshing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Data States
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- EXISTING DATA FETCHING LOGIC ---
  const fetchSheetData = async () => {
    try {
      setRefreshing(true);
      // Fetch Core markets tab
      const marketResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Core%20markets!A:E?key=${API_KEY}`
      );
      if (!marketResponse.ok) throw new Error('Failed to fetch market data');
      const marketResult = await marketResponse.json();
      
      // Fetch News (Simplified for brevity, keep your existing news logic here if needed)
      // For this step, I'm focusing on the Trigger logic
      // ... (Keep your existing fetch logic for News here) ...

      const parsedData = parseSheetData(marketResult.values);
      // Mock news for now to prevent crash if you copy-paste strict
      parsedData.NEWS = { worldNews: [], turkeyNews: [] }; 

      setData(parsedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // --- NEW: N8N TRIGGER LOGIC ---
  const triggerN8nUpdate = async () => {
    // Close dropdown immediately
    setIsDropdownOpen(false);
    
    // Show the warning toast
    setShowToast(true);
    
    // Hide toast after 10 seconds (standard UI feedback)
    setTimeout(() => setShowToast(false), 10000);

    try {
      // "no-cors" is often needed for webhooks to prevent browser errors
      // We don't need the response, we just want to fire the trigger.
      await fetch(N8N_WEBHOOK_URL, { 
        method: 'GET',
        mode: 'no-cors' 
      });
      console.log('Update signal sent to n8n');
    } catch (err) {
      console.error('Failed to trigger n8n:', err);
    }
  };

  // Keep your existing parseSheetData function exactly as is
  const parseSheetData = (rows) => {
    // ... Copy your existing parseSheetData function here ...
    // ... Or let me know if you need me to paste the full block again ...
    // For safety, I'll include the critical part:
    const result = {
      INDEX: { 'US Markets': [], 'European Markets': [], 'Asian Markets': [], 'Latin America': [] },
      CURRENCIES: [],
      FUTURES: { 'US Markets': [], 'Commodity Futures': [] },
      CRYPTO: [],
      NEWS: { worldNews: [], turkeyNews: [] },
      lastUpdated: new Date().toLocaleString()
    };
    
    // Simple parser (simplified from your original for brevity)
    if (!rows) return result;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 5) continue;
        const [classification, geography, name, price, change_percent] = row;
        const item = {
            name: name,
            price: parseFloat(price?.replace(/,/g, '') || 0),
            change_percent: parseFloat(change_percent?.replace('%', '') || 0)
        };
        
        if (classification === 'INDEX') {
            if (geography === 'US') result.INDEX['US Markets'].push(item);
            else if (geography === 'EUROPE') result.INDEX['European Markets'].push(item);
            else if (geography === 'ASIA') result.INDEX['Asian Markets'].push(item);
            else if (geography === 'LATAM') result.INDEX['Latin America'].push(item);
        } else if (classification === 'CURRENCIES') result.CURRENCIES.push(item);
        else if (classification === 'FUTURES') {
            if (geography === 'US') result.FUTURES['US Markets'].push(item);
            else if (geography === 'COMMODITIES') result.FUTURES['Commodity Futures'].push(item);
        } else if (classification === 'CRYPTO') result.CRYPTO.push(item);
    }
    return result;
  };

  useEffect(() => {
    fetchSheetData();
  }, []);

  // --- COMPONENT RENDER ---
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 p-3 md:p-6 relative">
      
      {/* TOAST NOTIFICATION */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-bounce-in">
          <div className="bg-slate-800 border-l-4 border-amber-500 text-slate-200 p-4 rounded shadow-2xl flex items-start gap-3 max-w-sm">
            <Activity className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-500">Update Initiated</p>
              <p className="text-sm text-slate-400 mt-1">
                The automation is running in the background. This process takes <strong>2-3 minutes</strong>. Please wait before refreshing the dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER WITH DROPDOWN */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-400">Market Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Last fetched: {data?.lastUpdated}</p>
        </div>

        {/* NEW DROPDOWN MENU */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-emerald-700 to-emerald-800 text-emerald-50 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-900/50 border border-emerald-600/30"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Update Data</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Content */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden">
              <div className="p-2 border-b border-slate-700">
                <span className="text-xs font-semibold text-slate-500 px-2 uppercase">Dashboard</span>
                <button
                  onClick={() => {
                    fetchSheetData();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 rounded-lg flex items-center gap-2 mt-1"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  Refresh View (Fetch Sheet)
                </button>
              </div>

              <div className="p-2">
                <span className="text-xs font-semibold text-slate-500 px-2 uppercase">Source Data (n8n)</span>
                
                {/* THIS IS YOUR NEW TEST BUTTON */}
                <button
                  onClick={triggerN8nUpdate}
                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 rounded-lg flex items-center gap-2 mt-1 group"
                >
                  <Play className="w-4 h-4 text-amber-400 group-hover:fill-amber-400" />
                  <div>
                    <span className="block">Update Currencies</span>
                    <span className="text-[10px] text-slate-500 block">Triggers n8n (~3 mins)</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- REST OF YOUR DASHBOARD (TABS, WIDGETS) REMAINS THE SAME --- */}
      {/* ... keeping the tab navigation and widgets as they were ... */}
      
      {/* Main Tab Navigation */}
      <div className="mb-4">
        {/* ... (Paste your existing tab navigation code here) ... */}
        <div className="grid grid-cols-4 gap-2">
             {/* This part of your code was standard, no changes needed for the logic, 
                 just ensuring the layout closes properly */}
        </div>
      </div>
      
      {/* Only rendering a placeholder for the widgets to keep code short. 
          In your real file, keep the <MarketWidget> logic! */}
       <div className="text-center text-slate-500 mt-10">
          (Your widgets will render here exactly as before)
       </div>

    </div>
  );
};

export default TabbedDashboard;