import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, BarChart3, Bitcoin, LineChart } from 'lucide-react';

const SHEET_ID = '1OuEvGdiiG8qQSEbAIVaMyitUsr2bBc6WaxnyjjvC1Uc';
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

// Market Card Component
const MarketCard = ({ name, price, changePercent, colorClass }) => {
  const isPositive = parseFloat(changePercent) >= 0;
  
  return (
    <div className={`${colorClass} rounded-xl p-4 transition-all hover:scale-[1.02]`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1 truncate">
        {name}
      </div>
      <div className="text-xl sm:text-2xl font-bold mb-1">
        {price}
      </div>
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span>{isPositive ? '+' : ''}{changePercent}%</span>
      </div>
    </div>
  );
};

// News Item Component
const NewsItem = ({ source, title }) => {
  const sourceColors = {
    'BBC': 'bg-red-600',
    'CNN': 'bg-red-700',
    'BBC Turkey': 'bg-red-500',
  };
  
  return (
    <div className="py-3 border-b border-slate-700/50 last:border-0">
      <span className={`${sourceColors[source] || 'bg-slate-600'} text-xs px-2 py-1 rounded font-medium`}>
        {source}
      </span>
      <p className="mt-2 text-sm text-slate-200 leading-relaxed">{title}</p>
    </div>
  );
};

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('indices');
  const [activeSubTab, setActiveSubTab] = useState('us');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Core markets data
      const sheetsToFetch = ['Core markets', 'Core%20markets'];
      let marketData = null;
      
      for (const sheetName of sheetsToFetch) {
        try {
          const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`
          );
          if (response.ok) {
            marketData = await response.json();
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Fetch News data
      let newsData = null;
      const newsSheets = ['News', 'news'];
      for (const sheetName of newsSheets) {
        try {
          const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`
          );
          if (response.ok) {
            newsData = await response.json();
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Parse market data
      const parsed = {
        usIndices: [],
        europeanIndices: [],
        asianIndices: [],
        futures: [],
        currencies: [],
        crypto: [],
        worldNews: [],
        turkeyNews: []
      };

      if (marketData?.values) {
        const rows = marketData.values;
        const headers = rows[0];
        
        // Find column indices
        const classIdx = headers.findIndex(h => h?.toLowerCase().includes('class'));
        const geoIdx = headers.findIndex(h => h?.toLowerCase().includes('geo') || h?.toLowerCase().includes('segment'));
        const nameIdx = headers.findIndex(h => h?.toLowerCase() === 'name');
        const priceIdx = headers.findIndex(h => h?.toLowerCase().includes('price'));
        const changeIdx = headers.findIndex(h => h?.toLowerCase().includes('change'));

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 3) continue;
          
          const classification = row[classIdx]?.toLowerCase() || '';
          const geography = row[geoIdx]?.toLowerCase() || '';
          const name = row[nameIdx] || '';
          const price = row[priceIdx] || '';
          const changePercent = row[changeIdx]?.replace('%', '') || '0';

          const item = { name, price, changePercent };

          if (classification.includes('equity') || classification.includes('index')) {
            if (geography.includes('us') || geography.includes('america')) {
              parsed.usIndices.push(item);
            } else if (geography.includes('euro') || geography.includes('uk') || geography.includes('german') || geography.includes('french')) {
              parsed.europeanIndices.push(item);
            } else if (geography.includes('asia') || geography.includes('japan') || geography.includes('china') || geography.includes('hong')) {
              parsed.asianIndices.push(item);
            }
          } else if (classification.includes('future') || classification.includes('commodity')) {
            parsed.futures.push(item);
          } else if (classification.includes('currency') || classification.includes('fx')) {
            parsed.currencies.push(item);
          } else if (classification.includes('crypto')) {
            parsed.crypto.push(item);
          }
        }
      }

      // Parse news data
      if (newsData?.values) {
        const rows = newsData.values;
        const headers = rows[0];
        
        const sourceIdx = headers.findIndex(h => h?.toLowerCase().includes('source'));
        const titleIdx = headers.findIndex(h => h?.toLowerCase().includes('title') || h?.toLowerCase().includes('headline'));
        const categoryIdx = headers.findIndex(h => h?.toLowerCase().includes('category') || h?.toLowerCase().includes('type'));

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row) continue;
          
          const source = row[sourceIdx] || 'News';
          const title = row[titleIdx] || '';
          const category = row[categoryIdx]?.toLowerCase() || '';

          if (title) {
            const newsItem = { source, title };
            if (category.includes('turkey') || source.toLowerCase().includes('turkey')) {
              parsed.turkeyNews.push(newsItem);
            } else {
              parsed.worldNews.push(newsItem);
            }
          }
        }
      }

      setData(parsed);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const tabs = [
    { id: 'indices', label: 'Indices', icon: LineChart },
    { id: 'fx', label: 'FX', icon: DollarSign },
    { id: 'futures', label: 'Futures', icon: BarChart3 },
    { id: 'crypto', label: 'Crypto', icon: Bitcoin },
  ];

  const subTabs = [
    { id: 'us', label: 'US Markets' },
    { id: 'eu', label: 'European Markets' },
    { id: 'asia', label: 'Asian Markets' },
  ];

  const getColorClass = (type) => {
    switch (type) {
      case 'indices': return 'bg-emerald-900/60 border border-emerald-700/50';
      case 'fx': return 'bg-purple-900/60 border border-purple-700/50';
      case 'futures': return 'bg-blue-900/60 border border-blue-700/50';
      case 'crypto': return 'bg-orange-900/60 border border-orange-700/50';
      default: return 'bg-slate-800';
    }
  };

  const getCurrentMarketData = () => {
    if (!data) return [];
    
    switch (activeTab) {
      case 'indices':
        switch (activeSubTab) {
          case 'us': return data.usIndices;
          case 'eu': return data.europeanIndices;
          case 'asia': return data.asianIndices;
          default: return data.usIndices;
        }
      case 'fx': return data.currencies;
      case 'futures': return data.futures;
      case 'crypto': return data.crypto;
      default: return [];
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-emerald-400">Market Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            {lastUpdated ? lastUpdated.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short'
            }) : 'Loading...'}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 p-3 rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Tabs */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center gap-1 sm:gap-2 py-3 px-2 rounded-xl font-medium transition-all text-sm sm:text-base ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Sub Tabs for Indices */}
      {activeTab === 'indices' && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`whitespace-nowrap py-2 px-4 rounded-lg font-medium transition-all text-sm ${
                activeSubTab === tab.id
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Market Cards Grid - KEY FIX: grid-cols-2 for mobile portrait */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {getCurrentMarketData().map((item, idx) => (
          <MarketCard
            key={idx}
            name={item.name}
            price={item.price}
            changePercent={item.changePercent}
            colorClass={getColorClass(activeTab)}
          />
        ))}
      </div>

      {/* News Section */}
      <div className="space-y-6">
        {/* World News */}
        <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50">
          <h2 className="text-xl font-bold text-rose-400 mb-4">World News</h2>
          <div className="space-y-1">
            {data?.worldNews?.slice(0, 5).map((news, idx) => (
              <NewsItem key={idx} source={news.source} title={news.title} />
            ))}
            {(!data?.worldNews || data.worldNews.length === 0) && (
              <p className="text-slate-500 text-sm">No news available</p>
            )}
          </div>
        </div>

        {/* Turkey News */}
        {data?.turkeyNews?.length > 0 && (
          <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50">
            <h2 className="text-xl font-bold text-rose-400 mb-4">News on Turkey</h2>
            <div className="space-y-1">
              {data.turkeyNews.slice(0, 5).map((news, idx) => (
                <NewsItem key={idx} source={news.source} title={news.title} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-xl text-red-300">
          Error: {error}
        </div>
      )}
    </div>
  );
}

export default App;
