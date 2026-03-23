import { useState, useEffect } from 'react';
import { Search, Loader2, TrendingUp, TrendingDown, Info, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TweakwiseResponse, Product, Facet } from './types';

export default function App() {
  const [inputUrl, setInputUrl] = useState('https://demo.tweakwise.com/en/f0a5d376/87534829905_74727293265_en/navigation');
  const [apiUrl, setApiUrl] = useState('');
  const [data, setData] = useState<TweakwiseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const transformed = transformUrl(inputUrl);
      setApiUrl(transformed);
      const response = await fetch(transformed);
      if (!response.ok) throw new Error('Failed to fetch data from Tweakwise API');
      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inputUrl) {
      fetchData();
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
                onClick={fetchData}
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
          {/* Sidebar - Facets */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-4">Facets</h2>
              <div className="space-y-6">
                {loading || !data ? (
                  // Facet Skeletons
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="border-b border-neutral-200 pb-4 last:border-0 animate-pulse">
                      <div className="h-4 bg-neutral-200 rounded w-1/2 mb-3" />
                      <div className="space-y-2">
                        <div className="h-3 bg-neutral-100 rounded w-3/4" />
                        <div className="h-3 bg-neutral-100 rounded w-2/3" />
                        <div className="h-3 bg-neutral-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))
                ) : (
                  data?.facets?.map((facet) => (
                    <div key={facet.facetsettings.facetid} className="border-b border-neutral-200 pb-4 last:border-0">
                      <h3 className="font-semibold text-sm mb-3">{facet.facetsettings.title}</h3>
                      <ul className="space-y-2">
                        {facet.attributes?.map((option) => (
                          <li key={option.attributeid} className="flex items-center justify-between text-sm group cursor-pointer">
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded border ${option.isselected ? 'bg-emerald-600 border-emerald-600' : 'border-neutral-300 group-hover:border-emerald-500'} transition-colors`} />
                              <span className={option.isselected ? 'font-medium text-emerald-700' : 'text-neutral-600'}>
                                {option.title}
                              </span>
                            </div>
                            <span className="text-xs text-neutral-400 font-mono">({option.nrofresults})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
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
