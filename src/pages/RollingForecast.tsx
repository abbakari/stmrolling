import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useBudget } from '../contexts/BudgetContext';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Plus,
  Download as DownloadIcon,
  Eye,
  Package,
  Users,
  Calendar,
  BarChart3,
  Loader,
  AlertCircle,
  X,
  Edit,
  Save,
  RefreshCw
} from 'lucide-react';
import ExportModal, { ExportConfig } from '../components/ExportModal';
import { RollingForecast as RollingForecastType, Customer, Item } from '../services/api';

interface ForecastDisplayItem {
  id: number;
  customer: string;
  customerData: Customer;
  item: string;
  itemData: Item;
  category: string;
  brand: string;
  budget_amount: number;
  forecast_amount: number;
  variance_amount: number;
  variance_percentage: number;
  confidence_level: number;
  forecast_type: string;
  status: string;
  month: number;
  year: number;
  apiData: RollingForecastType;
}

const RollingForecast: React.FC = () => {
  const { user } = useAuth();
  const { 
    forecastData,
    currentYear,
    setCurrentYear,
    customers,
    items,
    categories,
    brands,
    viewMode,
    setViewMode,
    isLoading,
    error,
    refreshForecastData,
    createForecastEntry,
    updateForecastEntry,
    deleteForecastEntry,
    bulkCreateForecast,
    getForecastSummary,
    getVarianceAnalysis
  } = useBudget();

  // Filters
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [forecastType, setForecastType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNewForecastModalOpen, setIsNewForecastModalOpen] = useState(false);
  
  // Edit state
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<RollingForecastType>>({});
  
  // Summary data
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [varianceAnalysis, setVarianceAnalysis] = useState<any>(null);
  
  // Notification state
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Load summary data
  useEffect(() => {
    if (forecastData.length > 0) {
      loadSummaryData();
    }
  }, [forecastData, currentYear]);

  const loadSummaryData = async () => {
    try {
      const [summary, variance] = await Promise.all([
        getForecastSummary(),
        getVarianceAnalysis()
      ]);
      setSummaryStats(summary);
      setVarianceAnalysis(variance);
    } catch (error) {
      console.error('Failed to load summary data:', error);
    }
  };

  // Show notification helper
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  // Transform forecast data for table display
  const transformedData: ForecastDisplayItem[] = React.useMemo(() => {
    return forecastData.map(forecast => ({
      id: forecast.id,
      customer: forecast.customer_info.name,
      customerData: forecast.customer_info,
      item: forecast.item_info.name,
      itemData: forecast.item_info,
      category: forecast.item_info.category_name,
      brand: forecast.item_info.brand_name,
      budget_amount: forecast.budget_amount,
      forecast_amount: forecast.forecasted_amount,
      variance_amount: forecast.amount_variance,
      variance_percentage: forecast.amount_variance_percentage,
      confidence_level: forecast.confidence_level,
      forecast_type: forecast.forecast_type,
      status: forecast.status,
      month: forecast.month,
      year: forecast.year,
      apiData: forecast
    }));
  }, [forecastData]);

  // Apply filters
  const filteredData = React.useMemo(() => {
    return transformedData.filter(item => {
      if (selectedCustomer && !item.customer.toLowerCase().includes(selectedCustomer.toLowerCase())) {
        return false;
      }
      if (selectedCategory && !item.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
        return false;
      }
      if (selectedBrand && !item.brand.toLowerCase().includes(selectedBrand.toLowerCase())) {
        return false;
      }
      if (selectedItem && !item.item.toLowerCase().includes(selectedItem.toLowerCase())) {
        return false;
      }
      if (forecastType && item.forecast_type !== forecastType) {
        return false;
      }
      if (statusFilter && item.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [transformedData, selectedCustomer, selectedCategory, selectedBrand, selectedItem, forecastType, statusFilter]);

  // Calculate totals
  const totals = React.useMemo(() => {
    return filteredData.reduce((acc, item) => ({
      budget_amount: acc.budget_amount + item.budget_amount,
      forecast_amount: acc.forecast_amount + item.forecast_amount,
      variance_amount: acc.variance_amount + item.variance_amount,
      avg_confidence: acc.avg_confidence + item.confidence_level
    }), { 
      budget_amount: 0, 
      forecast_amount: 0, 
      variance_amount: 0, 
      avg_confidence: 0 
    });
  }, [filteredData]);

  // Handle export
  const handleExport = (config: ExportConfig) => {
    try {
      const headers = ['Customer', 'Item', 'Category', 'Brand', 'Budget Amount', 'Forecast Amount', 'Variance', 'Variance %', 'Confidence', 'Type', 'Status'];
      const csvData = filteredData.map(item => [
        item.customer,
        item.item,
        item.category,
        item.brand,
        item.budget_amount,
        item.forecast_amount,
        item.variance_amount,
        item.variance_percentage,
        item.confidence_level,
        item.forecast_type,
        item.status
      ]);
      
      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rolling-forecast-${config.dateRange}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showNotification('Forecast data exported successfully');
    } catch (error) {
      showNotification('Export failed', 'error');
    }
  };

  // Handle inline editing
  const startEdit = (item: ForecastDisplayItem) => {
    setEditingRowId(item.id);
    setEditingData({
      forecasted_amount: item.forecast_amount,
      confidence_level: item.confidence_level,
      forecast_type: item.forecast_type,
      notes: item.apiData.notes
    });
  };

  const saveEdit = async () => {
    if (!editingRowId) return;
    
    try {
      await updateForecastEntry(editingRowId, editingData);
      showNotification('Forecast updated successfully');
      setEditingRowId(null);
      setEditingData({});
    } catch (error) {
      showNotification('Failed to update forecast', 'error');
    }
  };

  const cancelEdit = () => {
    setEditingRowId(null);
    setEditingData({});
  };

  // Get variance indicator
  const getVarianceIndicator = (variancePercentage: number) => {
    const absVariance = Math.abs(variancePercentage);
    if (absVariance <= 5) {
      return { color: 'text-green-600 bg-green-50', icon: CheckCircle, label: 'Good' };
    } else if (absVariance <= 15) {
      return { color: 'text-yellow-600 bg-yellow-50', icon: AlertTriangle, label: 'Fair' };
    } else {
      return { color: 'text-red-600 bg-red-50', icon: AlertCircle, label: 'Poor' };
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading rolling forecast data...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rolling Forecast</h1>
            <p className="text-gray-600">Track and analyze forecast performance against budget</p>
          </div>
          
          {/* View Mode Switcher */}
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('customer-item')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'customer-item'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="h-4 w-4 inline mr-1" />
                Customer-Item
              </button>
              <button
                onClick={() => setViewMode('item-wise')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'item-wise'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package className="h-4 w-4 inline mr-1" />
                Item-wise
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">{notification.message}</span>
              <button 
                onClick={() => setNotification(null)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Year Selector */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search customer..."
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              
              <select
                value={forecastType}
                onChange={(e) => setForecastType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Forecast Types</option>
                <option value="optimistic">Optimistic</option>
                <option value="realistic">Realistic</option>
                <option value="pessimistic">Pessimistic</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshForecastData}
                className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <DownloadIcon className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Forecast</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${totals.forecast_amount.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Variance</p>
                <p className={`text-2xl font-bold ${
                  totals.variance_amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${Math.abs(totals.variance_amount).toLocaleString()}
                </p>
              </div>
              {totals.variance_amount >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Forecast Entries</p>
                <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Confidence</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredData.length > 0 
                    ? Math.round(totals.avg_confidence / filteredData.length)
                    : 0}%
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  {viewMode === 'customer-item' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Forecast
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={viewMode === 'customer-item' ? 9 : 8} 
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <BarChart3 className="h-12 w-12 text-gray-300" />
                        <p>No forecast entries found</p>
                        <p className="text-sm">Create your first forecast to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => {
                    const varianceIndicator = getVarianceIndicator(item.variance_percentage);
                    const VarianceIcon = varianceIndicator.icon;
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.customer}
                        </td>
                        {viewMode === 'customer-item' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.item}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${item.budget_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingRowId === item.id ? (
                            <input
                              type="number"
                              value={editingData.forecasted_amount || 0}
                              onChange={(e) => setEditingData({
                                ...editingData,
                                forecasted_amount: parseFloat(e.target.value) || 0
                              })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            `$${item.forecast_amount.toLocaleString()}`
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${varianceIndicator.color}`}>
                              <VarianceIcon className="h-3 w-3 mr-1" />
                              {item.variance_percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingRowId === item.id ? (
                            <input
                              type="number"
                              value={editingData.confidence_level || 0}
                              onChange={(e) => setEditingData({
                                ...editingData,
                                confidence_level: parseInt(e.target.value) || 0
                              })}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                              min="0"
                              max="100"
                            />
                          ) : (
                            `${item.confidence_level}%`
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="capitalize">{item.forecast_type}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            item.status === 'approved' ? 'bg-green-100 text-green-800' :
                            item.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {editingRowId === item.id ? (
                              <>
                                <button
                                  onClick={saveEdit}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(item)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
        />
      </div>
    </Layout>
  );
};

export default RollingForecast;
