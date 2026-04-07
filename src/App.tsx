import { useState, useEffect } from 'react';
import { Search, Loader2, TrendingUp, TrendingDown, Info, ExternalLink, Sliders, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TweakwiseResponse, Product, Facet } from './types';

export default function App() {
  const [inputUrl, setInputUrl] = useState('https://demo.tweakwise.com/en/f0a5d376/87534829905_74727293265_en/navigation');
  const [apiUrl, setApiUrl] = useState('');
  const [data, setData] = useState<TweakwiseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configOverride, setConfigOverride] = useState(JSON.stringify({
    "boostbury": [
      { "id": 2, "active": true, "weight": -10 },
      { "id": 3, "active": true, "weight": 10 }
    ]
  }, null, 2));

  const transformUrl = (url: string) => {
    try {
      // Expected format: https://demo.tweakwise.com/en/f0a5d376/87534829905_74727293265_en/navigation
      const parts = url.split('/');
      // instanceKey is usually at index 4 or 5 depending on the URL structure
      // Let's try to find it more robustly
      const navigationIndex = parts.indexOf('navigation');
      if (navigationIndex === -1) throw new Error('Invalid URL: "navigation" segment not found');
      
      const cid = parts[navigationIndex - 1];
      const instanceKey = parts[navigationIndex - 2];

      if (!instanceKey || !cid) throw new Error('Could not extract instanceKey or cid');

      return `https://gateway.tweakwisenavigator.net/navigation/${instanceKey}?tn_cid=${cid}&tn_debug=true&format=json`;
    } catch (err) {
      throw new Error('Please enter a valid Tweakwise demo URL');
    }
  };

  const WEIGHT_LEVELS = [
    { label: 'Gentle nudge', value: 10, description: 'A light touch. Subtle preference.' },
    { label: 'Noticeable', value: 26, description: 'A clear signal. Reliably lifts/demotes.' },
    { label: 'Strong', value: 51, description: 'A decisive move. Meaningful jump.' },
    { label: 'Aggressive', value: 101, description: 'Major intervention. High-stakes.' }
  ];

  const updateConfigWeight = (id: number, weight: number) => {
    try {
      const currentConfig = JSON.parse(configOverride);
      if (currentConfig.boostbury) {
        currentConfig.boostbury = currentConfig.boostbury.map((c: any) => 
          c.id === id ? { ...c, weight } : c
        );
        setConfigOverride(JSON.stringify(currentConfig, null, 2));
        
        // Also update local data to reflect in UI immediately
        if (data) {
          setData({
            ...data,
            config: currentConfig
          });
        }
      }
    } catch (e) {
      console.error('Invalid JSON in override textarea', e);
    }
  };

  const fetchData = async (override?: string) => {
    setLoading(true);
    setError(null);
    try {
      const transformed = transformUrl(inputUrl);
      setApiUrl(transformed);
      
      const proxyUrl = new URL('/api/proxy', window.location.origin);
      proxyUrl.searchParams.set('url', transformed);

      const headers: HeadersInit = {};
      if (typeof override === 'string' && override.trim()) {
        const charsToEncode = /[\u007f-\uffff]/g;
        // Strip spaces and hidden characters, then encode non-ASCII characters
        const safeHeader = override.replace(/\s/g, '').replace(charsToEncode, (c) => {
          return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4);
        });
        console.log('Sending safe header', safeHeader);
        headers['TWN-Config-Override'] = safeHeader;
      }

      const response = await fetch(proxyUrl.toString(), { headers });
      if (!response.ok) throw new Error('Failed to fetch data from Tweakwise API');
      const json = await response.json();
      setData(json);
      
      if (json.config && !override) {
        setConfigOverride(JSON.stringify(json.config, null, 2));
      }
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inputUrl) {
      fetchData(configOverride);
    }
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Search className="text-white w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Tweakwise Explorer</h1>
            </div>
            
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Enter demoshop URL..."
                className="flex-1 bg-neutral-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
              />
              <button
                onClick={() => fetchData()}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Explore'}
              </button>
            </div>
          </div>
          
          {apiUrl && (
            <div className="mt-2 text-[10px] font-mono text-neutral-400 truncate">
              API Endpoint: {apiUrl}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-8 flex items-center gap-2">
            <Info className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Configuration */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Settings2 className="w-4 h-4 text-neutral-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Configuration</h2>
              </div>
              
              <div className="space-y-4">
                {loading || !data ? (
                  // Config Skeletons
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-3 bg-neutral-200 rounded w-2/3" />
                      <div className="h-1.5 bg-neutral-100 rounded w-full" />
                    </div>
                  ))
                ) : (
                  <div className="space-y-3">
                    {data?.config?.boostbury?.map((config) => {
                      const isBury = config.weight < 0;
                      const absWeight = Math.abs(config.weight);
                      
                      return (
                        <div key={config.id} className={`space-y-3 p-3 rounded-xl border transition-all ${config.active ? 'bg-white border-neutral-200 shadow-sm' : 'bg-neutral-50 border-transparent opacity-60'}`}>
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-[11px] text-neutral-800 truncate pr-2">
                              <span className="text-neutral-400 font-mono mr-1">#{config.id}</span>
                              {config.name}
                            </h3>
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.active ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                          </div>
                          
                          <div className="space-y-3">
                            {/* Rule Type */}
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => updateConfigWeight(config.id, absWeight)}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${!isBury ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-neutral-200 hover:border-neutral-300 bg-white'}`}
                              >
                                <div className={`p-1 rounded ${!isBury ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                  <TrendingUp className="w-3 h-3" />
                                </div>
                                <span className={`text-[9px] font-bold ${!isBury ? 'text-emerald-700' : 'text-neutral-500'}`}>Boost</span>
                              </button>
                              <button
                                onClick={() => updateConfigWeight(config.id, -absWeight)}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${isBury ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-neutral-200 hover:border-neutral-300 bg-white'}`}
                              >
                                <div className={`p-1 rounded ${isBury ? 'bg-orange-100 text-orange-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                  <TrendingDown className="w-3 h-3" />
                                </div>
                                <span className={`text-[9px] font-bold ${isBury ? 'text-orange-700' : 'text-neutral-500'}`}>Bury</span>
                              </button>
                            </div>

                            {/* Weight Levels */}
                            <div className="grid grid-cols-2 gap-1.5">
                              {WEIGHT_LEVELS.map((level) => {
                                const isActive = absWeight === level.value;
                                return (
                                  <button
                                    key={level.value}
                                    onClick={() => updateConfigWeight(config.id, isBury ? -level.value : level.value)}
                                    className={`text-left p-1.5 rounded-lg border transition-all ${isActive ? 'border-neutral-800 bg-neutral-900 text-white' : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-600'}`}
                                  >
                                    <div className="font-bold text-[8px] leading-tight mb-0.5">{level.label}</div>
                                    <div className={`text-[7px] leading-tight opacity-70 line-clamp-2 ${isActive ? 'text-neutral-300' : 'text-neutral-400'}`}>
                                      {level.description}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            
                            <div className="flex justify-between items-center text-[8px] font-mono text-neutral-400 pt-1 border-t border-neutral-100">
                              <span>Current Weight</span>
                              <span className={`font-bold ${isBury ? 'text-orange-600' : 'text-emerald-600'}`}>{config.weight}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {!data?.config?.boostbury?.length && (
                      <div className="text-neutral-400 text-sm italic py-8 text-center border-2 border-dashed border-neutral-100 rounded-2xl">
                        No boostbury configuration found
                      </div>
                    )}

                    <div className="pt-8 border-t border-neutral-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Config Override</h3>
                        <button 
                          onClick={() => setConfigOverride(JSON.stringify(data?.config, null, 2))}
                          className="text-[10px] text-emerald-600 hover:underline font-medium"
                        >
                          Reset
                        </button>
                      </div>
                      
                      <textarea
                        value={configOverride}
                        onChange={(e) => setConfigOverride(e.target.value)}
                        placeholder="Paste config JSON here..."
                        className="w-full h-48 bg-neutral-900 text-emerald-400 font-mono text-[10px] p-3 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                      />
                      
                      <button
                        onClick={() => fetchData(configOverride)}
                        disabled={loading || !configOverride}
                        className="w-full bg-neutral-900 hover:bg-black text-white py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Sliders className="w-3 h-3" />
                        Re-execute with Override
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">
                {data?.items?.length || 0} Products
              </h2>
            </div>

            <AnimatePresence mode="wait">
              {loading || !data ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-neutral-100 animate-pulse">
                      <div className="aspect-square bg-neutral-100 rounded-xl mb-4" />
                      <div className="h-4 bg-neutral-100 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-neutral-100 rounded w-1/2" />
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {data?.items?.map((product) => (
                    <ProductCard key={product.itemno} product={product} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProductCard({ product }: { product: Product; key?: string | number }) {
  const boostBury = product.debug?.boostBury;

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-neutral-100 overflow-hidden group hover:shadow-xl hover:shadow-neutral-200/50 transition-all duration-300 flex flex-col relative"
    >
      {/* Debug Badge */}
      {boostBury && boostBury.rankdelta !== 0 && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
          <div className={`${!(boostBury.boosted || boostBury.buried) ? 'bg-neutral-400' : (boostBury.rankdelta > 0 ? 'bg-orange-500' : 'bg-emerald-500')} text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-black/10`}>
            {boostBury.rankdelta > 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {Math.abs(boostBury.rankdelta)}
          </div>
        </div>
      )}

      {/* Image Container */}
      <div className="aspect-square relative overflow-hidden bg-neutral-50">
        <img
          src={product.image}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
        
        <a 
          href={product.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 bg-white/90 backdrop-blur p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
        >
          <ExternalLink className="w-4 h-4 text-neutral-600" />
        </a>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
          {product.brand}
        </div>
        <h3 className="text-sm font-semibold text-neutral-800 line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors">
          {product.title}
        </h3>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="text-lg font-bold text-neutral-900">
            €{product.price.toFixed(2)}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            #{product.itemno.split('_').pop()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
