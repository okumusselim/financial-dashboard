import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Activity, DollarSign, BarChart3, Newspaper, Bitcoin } from 'lucide-react';

// Configuration
const SHEET_ID = import.meta.env.VITE_SHEET_ID || '1OuEvGdiiG8qQSEbAIVaMyitUsr2bBc6WaxnyjjvC1Uc';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
console.log('API Key loaded:', API_KEY ? 'YES' : 'NO');
console.log('Sheet ID:', SHEET_ID);
const TabbedDashboard = () => {
  const [activeMainTab, setActiveMainTab] = useState('INDEX');
  const [activeSubTab, setActiveSubTab] = useState({
    INDEX: 'US Markets',
    CURRENCIES: 'Major FX',
    FUTURES: 'US Markets',
    CRYPTO: 'Digital Assets',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpdateMenu, setShowUpdateMenu] = useState(false);

  // Fetch data from Google Sheets
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
        time: 'Recent', // We don't have timestamp data, so use "Recent"
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
        price: parseFloat(price),
        change_percent: parseFloat(change_percent.replace('%', ''))
      };

      // Route to correct category based on Classification column
      if (classification === 'INDEX') {
        // Map geography to our sub-categories
        if (geography === 'US') {
          result.INDEX['US Markets'].push(item);
        } else if (geography === 'EUROPE') {
          result.INDEX['European Markets'].push(item);
        } else if (geography === 'ASIA') {
          result.INDEX['Asian Markets'].push(item);
        } else if (geography === 'LATAM') {
          result.INDEX['Latin America'].push(item);
        }
      } else if (classification === 'CURRENCIES') {
        result.CURRENCIES.push(item);
      } else if (classification === 'FUTURES') {
        if (geography === 'US') {
          result.FUTURES['US Markets'].push(item);
        } else if (geography === 'COMMODITIES') {
          result.FUTURES['Commodity Futures'].push(item);
        }
      } else if (classification === 'CRYPTO' || classification === 'COINS') {
        result.CRYPTO.push(item);
      }
    }

    return result;
  };

  // Fetch data on mount
  useEffect(() => {
    fetchSheetData();
  }, []);

  const handleRefresh = () => {
    fetchSheetData();
  };

  // Widget component
  const MarketWidget = ({ data, variant = 'green' }) => {
    const colorSchemes = {
      green: {
        bg: 'from-emerald-900/40 to-emerald-950/60',
        border: 'border-emerald-800/30 hover:border-emerald-700/50',
        shadow: 'hover:shadow-emerald-900/50',
        label: 'text-emerald-400/80',
        value: 'text-emerald-50'
      },
      blue: {
        bg: 'from-blue-900/40 to-blue-950/60',
        border: 'border-blue-800/30 hover:border-blue-700/50',
        shadow: 'hover:shadow-blue-900/50',
        label: 'text-blue-400/80',
        value: 'text-blue-50'
      },
      purple: {
        bg: 'from-purple-900/40 to-purple-950/60',
        border: 'border-purple-800/30 hover:border-purple-700/50',
        shadow: 'hover:shadow-purple-900/50',
        label: 'text-purple-400/80',
        value: 'text-purple-50'
      },
      orange: {
        bg: 'from-orange-900/40 to-orange-950/60',
        border: 'border-orange-800/30 hover:border-orange-700/50',
        shadow: 'hover:shadow-orange-900/50',
        label: 'text-orange-400/80',
        value: 'text-orange-50'
      }
    };

    const colors = colorSchemes[variant];

    return (
      <div className={`bg-gradient-to-br ${colors.bg} rounded-lg shadow-lg ${colors.shadow} transition-all p-3 border ${colors.border} backdrop-blur-sm`}>
        <div className={`text-xs font-semibold ${colors.label} uppercase mb-1 truncate`}>
          {data.name}
        </div>
        <div className="flex items-baseline justify-between">
          <div className={`text-xl font-bold ${colors.value} truncate`}>
            {typeof data.price === 'number' && data.price < 100
              ? data.price.toFixed(4)
              : data.price.toLocaleString()}
          </div>
          <div className={`flex items-center gap-1 text-sm font-semibold ${data.change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
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
      <h3 className={`text-lg font-bold ${titleColor} mb-3 pb-2 border-b border-emerald-900/50`}>
        {title}
      </h3>
      <div className="space-y-3">
        {news.map((item, idx) => (
          <a
            key={idx}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group cursor-pointer hover:bg-slate-700/40 p-2 rounded transition-colors border border-transparent hover:border-emerald-900/30"
          >
            <div className="flex items-start gap-2 mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium flex-shrink-0 ${item.source === 'BBC' || item.source === 'BBC Turkey' ? 'bg-rose-900/40 text-rose-300 border border-rose-800/30' :
                'bg-blue-900/40 text-blue-300 border border-blue-800/30'
                }`}>
                {item.source}
              </span>
            </div>
            <p className="text-sm text-slate-300 group-hover:text-emerald-100 leading-snug transition-colors">
              {item.title}
            </p>
          </a>
        ))}
      </div>
    </div>
  );

  const mainTabs = [
    {
      id: 'INDEX',
      name: 'Indices',
      icon: Activity,
      color: 'emerald',
      variant: 'green',
      subTabs: ['US Markets', 'European Markets', 'Asian Markets', 'Latin America']
    },
    {
      id: 'CURRENCIES',
      name: 'FX',
      icon: DollarSign,
      color: 'purple',
      variant: 'purple',
      subTabs: null
    },
    {
      id: 'FUTURES',
      name: 'Futures',
      icon: BarChart3,
      color: 'blue',
      variant: 'blue',
      subTabs: ['US Markets', 'Commodity Futures']
    },
    {
      id: 'CRYPTO',
      name: 'Crypto',
      icon: Bitcoin,
      color: 'orange',
      variant: 'orange',
      subTabs: null
    },
  ];

  const activeMainTabData = mainTabs.find(tab => tab.id === activeMainTab);
  const currentSubTab = activeSubTab[activeMainTab];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 flex items-center justify-center">
        <div className="text-emerald-400 text-xl">Loading dashboard...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 flex items-center justify-center">
        <div className="text-rose-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 p-3 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-400">Market Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">{data?.lastUpdated}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowUpdateMenu(!showUpdateMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-emerald-700 to-emerald-800 text-emerald-50 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-900/50 border border-emerald-600/30"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Update</span>
          </button>

          {showUpdateMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
              <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-t-lg">
                Update All
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                Update World News
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                Update Turkey News
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                Update Indices
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                Update Futures
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                Update Currencies
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-b-lg">
                Update Crypto
              </button>
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
              emerald: {
                active: 'bg-emerald-900/60 border-emerald-700/50 text-emerald-300 shadow-emerald-900/50',
                inactive: 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
              },
              blue: {
                active: 'bg-blue-900/60 border-blue-700/50 text-blue-300 shadow-blue-900/50',
                inactive: 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
              },
              purple: {
                active: 'bg-purple-900/60 border-purple-700/50 text-purple-300 shadow-purple-900/50',
                inactive: 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
              },
              orange: {
                active: 'bg-orange-900/60 border-orange-700/50 text-orange-300 shadow-orange-900/50',
                inactive: 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
              },
            };

            return (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border backdrop-blur-sm transition-all font-semibold shadow-lg ${isActive ? colorClasses[tab.color].active : colorClasses[tab.color].inactive
                  }`}
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
                  className={`px-4 py-2 rounded-lg border backdrop-blur-sm transition-all text-sm font-medium whitespace-nowrap ${isActive
                    ? 'bg-slate-700/60 border-slate-600/50 text-slate-200'
                    : 'bg-slate-800/30 border-slate-700/40 text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                    }`}
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
        {/* Market Data Section */}
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

            if (!dataToDisplay || dataToDisplay.length === 0) {
              return (
                <div className="text-slate-400 text-center py-8">
                  No data available
                </div>
              );
            }

            const itemCount = dataToDisplay.length;

            let gridClass;
            if (itemCount <= 2) {
              gridClass = `grid grid-cols-${itemCount} gap-2 md:gap-3`;
            } else if (itemCount <= 4) {
              gridClass = 'grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3';
            } else if (itemCount === 5) {
              return (
                <div className="space-y-2 md:space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                    {dataToDisplay.slice(0, 3).map((item, idx) => (
                      <MarketWidget
                        key={idx}
                        data={item}
                        variant={activeMainTabData.variant}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    {dataToDisplay.slice(3, 5).map((item, idx) => (
                      <MarketWidget
                        key={idx + 3}
                        data={item}
                        variant={activeMainTabData.variant}
                      />
                    ))}
                  </div>
                </div>
              );
            } else {
              gridClass = 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3';
            }

            return (
              <div className={gridClass}>
                {dataToDisplay.map((item, idx) => (
                  <MarketWidget
                    key={idx}
                    data={item}
                    variant={activeMainTabData.variant}
                  />
                ))}
              </div>
            );
          })()}
        </div>

        {/* News Section - Always Visible Below */}
        {data?.NEWS && (
          <div className="space-y-6 pt-6">
            {data.NEWS.worldNews && data.NEWS.worldNews.length > 0 && (
              <NewsSection title="World News" news={data.NEWS.worldNews} />
            )}
            {data.NEWS.turkeyNews && data.NEWS.turkeyNews.length > 0 && (
              <NewsSection title="Turkey News" news={data.NEWS.turkeyNews} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TabbedDashboard;
// Force rebuild
// Force rebuild 
