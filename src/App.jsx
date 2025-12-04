import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, RefreshCw, Activity, DollarSign, 
  BarChart3, Bitcoin, ChevronDown, Play, Globe, Newspaper 
} from 'lucide-react';

// Configuration
const SHEET_ID = import.meta.env.VITE_SHEET_ID || '1OuEvGdiiG8qQSEbAIVaMyitUsr2bBc6WaxnyjjvC1Uc';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Automation Triggers Configuration
// Label: What shows in the menu
// URL: The variable from your .env file
// Icon: The icon to display
const automationTriggers = [
  { label: 'Update Indices', url: import.meta.env.VITE_N8N_INDICES, icon: Activity },
  { label: 'Update Currencies', url: import.meta.env.VITE_N8N_CURRENCIES, icon: DollarSign },
  { label: 'Update Futures', url: import.meta.env.VITE_N8N_FUTURES, icon: BarChart3 },
  { label: 'Update Crypto', url: import.meta.env.VITE_N8N_CRYPTO, icon: Bitcoin },
  { label: 'Update World News (BBC)', url: import.meta.env.VITE_N8N_NEWS_BBC, icon: Globe },
  { label: 'Update World News (CNN)', url: import.meta.env.VITE_N8N_NEWS_CNN, icon: Globe },
  { label: 'Update TR News', url: import.meta.env.VITE_N8N_NEWS_TURKEY, icon: Newspaper },
];

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
  const [showToast, setShowToast] = useState({ visible: false, message: '' });
  
  // Data States
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from Google Sheets
  const fetchSheetData = async () => {
    try {
      setRefreshing(true);

      // Fetch Core markets tab
      const marketResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Core%20markets!A:E?key=${API_KEY}`
      );

      if (!marketResponse.ok) {
        throw new Error('Failed to fetch market data');
      }

      const marketResult = await marketResponse.json();
      const marketRows = marketResult.values;

      // Fetch BBC news
      const bbcResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/BBC!A:C?key=${API_KEY}`
      );
      const bbcResult = await bbcResponse.json();
      const bbcRows = bbcResult.values || [];

      // Fetch CNN news
      const cnnResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/CNN!A:C?key=${API_KEY}`
      );
      const cnnResult = await cnnResponse.json();
      const cnnRows = cnnResult.values || [];

      // Fetch BBC TR news
      const bbcTrResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/BBC%20TR!A:C?key=${API_KEY}`
      );
      const bbcTrResult = await bbcTrResponse.json();
      const bbcTrRows = bbcTrResult.values || [];

      // Parse the sheet data
      const parsedData = parseSheetData(marketRows);

      // Parse news data
      parsedData.NEWS.worldNews = [
        ...parseNewsRows(bbcRows, 'BBC'),
        ...parseNewsRows(cnnRows, 'CNN')
      ];

      parsedData.NEWS.turkeyNews = parseNewsRows(bbcTrRows, 'BBC Turkey');

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

  // Helper function to parse news rows
  const parseNewsRows = (rows, source) => {
    const news = [];
    for (let i = 1; i < rows.length; i++) { // Skip header row
      const row = rows[i];
      if (!row || row.length < 1) continue;

      const title = row[0]; // Column A
      const url = row[2]; // Column C
      if (!title) continue;

      news.push({
        source: source,
        time: 'Recent',
        title: title,
        url: url,
      });
    }
    return news;
  };

  // Parse sheet rows into structured data
  const parseSheetData = (rows) => {
    const result = {
      INDEX: { 'US Markets': [], 'European Markets': [], 'Asian Markets': [], 'Latin America': [] },
      CURRENCIES: [],
      FUTURES: { 'US Markets': [], 'Commodity Futures': [] },
      CRYPTO: [],
      NEWS: { worldNews: [], turkeyNews: [] },
      lastUpdated: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/New_York'
      }) + ' EST'
    };

    // Skip header row (row 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 5) continue;

      const [classification, geography, name, price, change_percent] = row;

      // Create data item
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
      } else if (classification === 'CURRENCIES') {
        result.CURRENCIES.push(item);
      } else if (classification === 'FUTURES') {
        if (geography === 'US') result.FUTURES['US Markets'].push(item);
        else if (geography === 'COMMODITIES') result.FUTURES['Commodity Futures'].push(item);
      } else if (classification === 'CRYPTO' || classification === 'COINS') {
        result.CRYPTO.push(item);
      }
    }

    return result;
  };

  // GENERIC N8N TRIGGER LOGIC
  const triggerN8nUpdate = async (trigger) => {
    if (!trigger.url) {
      console.warn(`No webhook URL found for ${trigger.label}`);
      alert(`Configuration Missing: No webhook URL found for ${trigger.label}. Please check your .env file.`);
      return;
    }

    setIsDropdownOpen(false);
    
    // Show custom toast
    setShowToast({ 
      visible: true, 
      message: `${trigger.label} initiated...` 
    });
    
    setTimeout(() => setShowToast({ visible: false, message: '' }), 10000);

    try {
      await fetch(trigger.url, { method: 'GET', mode: 'no-cors' });
      console.log(`${trigger.label} signal sent`);
    } catch (err) {
      console.error('Failed to trigger n8n:', err);
    }
  };

  useEffect(() => {
    fetchSheetData();
  }, []);

  // Widget component
  const MarketWidget = ({ data, variant = 'green' }) => {
    const colorSchemes = {
      green: { bg: 'from-emerald-900/40 to-emerald-950/60', border: 'border-emerald-800/30', label: 'text-emerald-400/80', value: 'text-emerald-50' },
      blue: { bg: 'from-blue-900/40 to-blue-950/60', border: 'border-blue-800/30', label: 'text-blue-400/80', value: 'text-blue-50' },
      purple: { bg: 'from-purple-900/40 to-purple-950/60', border: 'border-purple-800/30', label: 'text-purple-400/80', value: 'text-purple-50' },
      orange: { bg: 'from-orange-900/40 to-orange-950/60', border: 'border-orange-800/30', label: 'text-orange-400/80', value: 'text-orange-50' }
    };

    const colors = colorSchemes[variant];

    return (
      <div className={`bg-gradient-to-br ${colors.bg} rounded-lg shadow-lg p-3 border ${colors.border} backdrop-blur-sm`}>
        <div className={`text-xs font-semibold ${colors.label} uppercase mb-1 truncate`}>{data.name}</div>
        <div className="flex items-baseline justify-between">
          <div className={`text-xl font-bold ${colors.value} truncate`}>
            {typeof data.price === 'number' && data.price < 100 ? data.price.toFixed(4) : data.price.toLocaleString()}
          </div>
          <div className={`flex items-center gap-1 text-sm font-semibold ${data.change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {data.change_percent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(data.change_percent).toFixed(2)}%</span>
          </div>
        </div>
      </div>
    );
  };

  // News section component
  const NewsSection = ({ title, news, titleColor = 'text-emerald-400' }) => (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 rounded-lg shadow-lg p-4 border border-slate-700/50 backdrop-blur-sm">
      <h3 className={`text-lg font-bold ${titleColor} mb-3 pb-2 border-b border-emerald-900/50`}>{title}</h3>
      <div className="space-y-3">
        {news.map((item, idx) => (
          <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="block group cursor-pointer hover:bg-slate-700/40 p-2 rounded transition-colors border border-transparent hover:border-emerald-900/30">
            <div className="flex items-start gap-2 mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium flex-shrink-0 ${item.source === 'BBC' || item.source === 'BBC Turkey' ? 'bg-rose-900/40 text-rose-300 border border-rose-800/30' : 'bg-blue-900/40 text-blue-300 border border-blue-800/30'}`}>
                {item.source}
              </span>
            </div>
            <p className="text-sm text-slate-300 group-hover:text-emerald-100 leading-snug transition-colors">{item.title}</p>
          </a>
        ))}
      </div>
    </div>
  );

  const mainTabs = [
    { id: 'INDEX', name: 'Indices', icon: Activity, color: 'emerald', variant: 'green', subTabs: ['US Markets', 'European Markets', 'Asian Markets', 'Latin America'] },
    { id: 'CURRENCIES', name: 'FX', icon: DollarSign, color: 'purple', variant: 'purple', subTabs: null },
    { id: 'FUTURES', name: 'Futures', icon: BarChart3, color: 'blue', variant: 'blue', subTabs: ['US Markets', 'Commodity Futures'] },
    { id: 'CRYPTO', name: 'Crypto', icon: Bitcoin, color: 'orange', variant: 'orange', subTabs: null },
  ];

  const activeMainTabData = mainTabs.find(tab => tab.id === activeMainTab);
  const currentSubTab = activeSubTab[activeMainTab];

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">Loading...</div>;
  if (error) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-rose-400">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 p-3 md:p-6 relative">
      
      {/* TOAST NOTIFICATION */}
      {showToast.visible && (
        <div className="fixed top-4 right-4 z-50 animate-bounce-in transition-all duration-500">
          <div className="bg-slate-800 border-l-4 border-amber-500 text-slate-200 p-4 rounded shadow-2xl flex items-start gap-3 max-w-sm">
            <Activity className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-500">Processing Request</p>
              <p className="text-sm text-slate-400 mt-1">{showToast.message}</p>
              <p className="text-xs text-slate-500 mt-2">Takes 2-3 minutes. Please wait.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-400">Market Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Last fetched: {data?.lastUpdated}</p>
        </div>
        
        {/* DROPDOWN MENU */}
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
            <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden">
              <div className="p-2 border-b border-slate-700">
                <span className="text-xs font-semibold text-slate-500 px-2 uppercase">Dashboard</span>
                <button
                  onClick={() => { fetchSheetData(); setIsDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 rounded-lg flex items-center gap-2 mt-1"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  Refresh View (Fetch Sheet)
                </button>
              </div>

              <div className="p-2">
                <span className="text-xs font-semibold text-slate-500 px-2 uppercase">Run Automations (n8n)</span>
                <div className="max-h-60 overflow-y-auto scrollbar-thin mt-1 space-y-1">
                  {automationTriggers.map((trigger, idx) => {
                    const Icon = trigger.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => triggerN8nUpdate(trigger)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 rounded-lg flex items-center gap-2 group transition-colors"
                      >
                        <Play className="w-3 h-3 text-amber-500/70 group-hover:text-amber-400 group-hover:fill-amber-400 transition-all" />
                        <div className="flex items-center gap-2">
                           <Icon className="w-3 h-3 text-slate-400" />
                           <span>{trigger.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="mb-4">
        <div className="grid grid-cols-4 gap-2">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMainTab === tab.id;
            const colorClasses = {
              emerald: { active: 'bg-emerald-900/60 border-emerald-700/50 text-emerald-300 shadow-emerald-900/50', inactive: 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300' },
              blue: { active: 'bg-blue-900/60 border-blue-700/50 text-blue-300 shadow-blue-900/50', inactive: 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300' },
              purple: { active: 'bg-purple-900/60 border-purple-700/50 text-purple-300 shadow-purple-900/50', inactive: 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300' },
              orange: { active: 'bg-orange-900/60 border-orange-700/50 text-orange-300 shadow-orange-900/50', inactive: 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300' },
            };
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border backdrop-blur-sm transition-all font-semibold shadow-lg ${isActive ? colorClasses[tab.color].active : colorClasses[tab.color].inactive}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      {activeMainTabData.subTabs && (
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {activeMainTabData.subTabs.map((subTab) => {
              const isActive = currentSubTab === subTab;
              return (
                <button
                  key={subTab}
                  onClick={() => setActiveSubTab({ ...activeSubTab, [activeMainTab]: subTab })}
                  className={`px-4 py-2 rounded-lg border backdrop-blur-sm transition-all text-sm font-medium whitespace-nowrap ${isActive ? 'bg-slate-700/60 border-slate-600/50 text-slate-200' : 'bg-slate-800/30 border-slate-700/40 text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'}`}
                >
                  {subTab}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="space-y-6">
        <div className="animate-fadeIn">
          {(() => {
            if (!data) return null;
            let dataToDisplay;
            if (data[activeMainTab]) {
              if (Array.isArray(data[activeMainTab])) {
                dataToDisplay = data[activeMainTab];
              } else if (currentSubTab && data[activeMainTab][currentSubTab]) {
                dataToDisplay = data[activeMainTab][currentSubTab];
              }
            }
            if (!dataToDisplay || dataToDisplay.length === 0) return <div className="text-slate-400 text-center py-8">No data available</div>;

            const itemCount = dataToDisplay.length;
            let gridClass;
            if (itemCount <= 2) gridClass = `grid grid-cols-${itemCount} gap-2 md:gap-3`;
            else if (itemCount <= 4) gridClass = 'grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3';
            else if (itemCount === 5) {
              return (
                <div className="space-y-2 md:space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                    {dataToDisplay.slice(0, 3).map((item, idx) => <MarketWidget key={idx} data={item} variant={activeMainTabData.variant} />)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    {dataToDisplay.slice(3, 5).map((item, idx) => <MarketWidget key={idx + 3} data={item} variant={activeMainTabData.variant} />)}
                  </div>
                </div>
              );
            } else gridClass = 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3';

            return <div className={gridClass}>{dataToDisplay.map((item, idx) => <MarketWidget key={idx} data={item} variant={activeMainTabData.variant} />)}</div>;
          })()}
        </div>

        {data?.NEWS && (
          <div className="space-y-6 pt-6">
            {data.NEWS.worldNews && data.NEWS.worldNews.length > 0 && <NewsSection title="World News" news={data.NEWS.worldNews} />}
            {data.NEWS.turkeyNews && data.NEWS.turkeyNews.length > 0 && <NewsSection title="Turkey News" news={data.NEWS.turkeyNews} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default TabbedDashboard;