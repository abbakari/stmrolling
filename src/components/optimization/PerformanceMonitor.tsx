import React, { useState, useEffect, useRef } from 'react';
import { Activity, Database, Cpu, HardDrive, Clock } from 'lucide-react';
import { getServiceMetrics } from '../../services/supabaseService';
import { connectionMonitor } from '../../lib/supabase';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  dbQueries: number;
  connectionLatency: number;
  bundleSize: number;
}

interface PerformanceMonitorProps {
  showDetails?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showDetails = false,
  position = 'bottom-right',
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    dbQueries: 0,
    connectionLatency: 0,
    bundleSize: 0
  });

  const [isConnected, setIsConnected] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const queryCountRef = useRef(0);
  const cacheHitsRef = useRef(0);
  const renderStartRef = useRef(0);

  // Monitor connection status
  useEffect(() => {
    const unsubscribe = connectionMonitor.onStatusChange((connected) => {
      setIsConnected(connected);
    });

    return unsubscribe;
  }, []);

  // Performance metrics collection
  useEffect(() => {
    const collectMetrics = () => {
      const serviceMetrics = getServiceMetrics();
      
      // Memory usage (if available)
      const memory = (performance as any).memory;
      const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0;

      // Cache hit rate calculation
      const cacheHitRate = serviceMetrics.cacheSize > 0 
        ? (cacheHitsRef.current / queryCountRef.current) * 100 
        : 0;

      // Connection latency test
      const startTime = performance.now();
      fetch('/api/health').then(() => {
        const latency = performance.now() - startTime;
        setMetrics(prev => ({ ...prev, connectionLatency: latency }));
      }).catch(() => {
        setMetrics(prev => ({ ...prev, connectionLatency: -1 }));
      });

      const newMetrics: PerformanceMetrics = {
        renderTime: performance.now() - renderStartRef.current,
        memoryUsage,
        cacheHitRate: isNaN(cacheHitRate) ? 0 : cacheHitRate,
        dbQueries: queryCountRef.current,
        connectionLatency: metrics.connectionLatency,
        bundleSize: 0 // Would need to be calculated during build
      };

      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);
    };

    // Update metrics every 5 seconds
    const interval = setInterval(collectMetrics, 5000);
    collectMetrics(); // Initial collection

    return () => clearInterval(interval);
  }, [onMetricsUpdate]);

  // Track render time
  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!showDetails && !isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed ${positionClasses[position]} z-50 bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-all`}
        title="Show performance metrics"
      >
        <Activity className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Performance Monitor
        </h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        {/* Render Performance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3 text-blue-600" />
            <span>Render Time</span>
          </div>
          <span className={getStatusColor(metrics.renderTime, { good: 16, warning: 32 })}>
            {metrics.renderTime.toFixed(1)}ms
          </span>
        </div>

        {/* Memory Usage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-3 h-3 text-purple-600" />
            <span>Memory</span>
          </div>
          <span className={getStatusColor(metrics.memoryUsage, { good: 50, warning: 100 })}>
            {metrics.memoryUsage.toFixed(1)}MB
          </span>
        </div>

        {/* Database Performance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3 text-green-600" />
            <span>DB Queries</span>
          </div>
          <span className="text-gray-700">{metrics.dbQueries}</span>
        </div>

        {/* Cache Hit Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3 text-orange-600" />
            <span>Cache Hit</span>
          </div>
          <span className={getStatusColor(100 - metrics.cacheHitRate, { good: 20, warning: 50 })}>
            {metrics.cacheHitRate.toFixed(1)}%
          </span>
        </div>

        {/* Connection Latency */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-indigo-600" />
            <span>Latency</span>
          </div>
          <span className={metrics.connectionLatency < 0 
            ? 'text-red-600' 
            : getStatusColor(metrics.connectionLatency, { good: 100, warning: 300 })
          }>
            {metrics.connectionLatency < 0 ? 'Error' : `${metrics.connectionLatency.toFixed(0)}ms`}
          </span>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="text-gray-600">Database</span>
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Performance Tips */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Tips</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {metrics.renderTime > 32 && (
              <li>• Consider reducing component complexity</li>
            )}
            {metrics.memoryUsage > 100 && (
              <li>• High memory usage detected</li>
            )}
            {metrics.cacheHitRate < 50 && (
              <li>• Low cache hit rate - check query patterns</li>
            )}
            {metrics.connectionLatency > 300 && (
              <li>• High latency - check network connection</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// Performance metrics provider
export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showMonitor, setShowMonitor] = useState(process.env.NODE_ENV === 'development');

  // Listen for keyboard shortcut to toggle monitor
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        setShowMonitor(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      {children}
      {showMonitor && (
        <PerformanceMonitor 
          showDetails={false}
          position="bottom-right"
        />
      )}
    </>
  );
};

export default PerformanceMonitor;

// Hook for tracking component-specific performance
export const useComponentPerformance = (componentName: string) => {
  const renderStartRef = useRef<number>(0);
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
    renderCountRef.current++;
  });

  useEffect(() => {
    return () => {
      const renderTime = performance.now() - renderStartRef.current;
      console.log(`${componentName} render #${renderCountRef.current}: ${renderTime.toFixed(2)}ms`);
    };
  });

  return {
    renderCount: renderCountRef.current,
    startTime: renderStartRef.current
  };
};
