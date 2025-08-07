import React, { useState } from 'react';
import { X, User, Calendar, Package, TrendingUp, TrendingDown, BarChart, Truck, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DataPersistenceManager from '../utils/dataPersistence';

interface MonthlyForecastData {
  month: string;
  budgetUnits: number;
  actualUnits: number;
  forecastUnits: number;
  budgetValue: number;
  actualValue: number;
  forecastValue: number;
  rate: number;
  variance: number;
  variancePercentage: number;
}

interface CustomerForecastData {
  customer: string;
  totalBudgetUnits: number;
  totalActualUnits: number;
  totalForecastUnits: number;
  totalBudgetValue: number;
  totalActualValue: number;
  totalForecastValue: number;
  monthlyData: MonthlyForecastData[];
  items: Array<{
    item: string;
    category: string;
    brand: string;
    budgetUnits: number;
    actualUnits: number;
    forecastUnits: number;
    budgetValue: number;
    actualValue: number;
    forecastValue: number;
    rate: number;
  }>;
  salesmanName: string;
  lastUpdated: string;
}

interface CustomerForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerData: CustomerForecastData | null;
  viewType: 'sales_budget' | 'rolling_forecast';
}

const CustomerForecastModal: React.FC<CustomerForecastModalProps> = ({
  isOpen,
  onClose,
  customerData,
  viewType
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly' | 'items' | 'git'>('overview');

  if (!isOpen || !customerData) return null;

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="w-4 h-4" />;
    if (variance < 0) return <TrendingDown className="w-4 h-4" />;
    return <BarChart className="w-4 h-4" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateTotalVariance = () => {
    const budgetTotal = viewType === 'sales_budget' ? customerData.totalBudgetValue : customerData.totalBudgetUnits;
    const forecastTotal = viewType === 'sales_budget' ? customerData.totalForecastValue : customerData.totalForecastUnits;
    return budgetTotal > 0 ? ((forecastTotal - budgetTotal) / budgetTotal) * 100 : 0;
  };

  const totalVariance = calculateTotalVariance();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {viewType === 'sales_budget' ? 'Sales Budget' : 'Rolling Forecast'} - Customer Analysis
                </h2>
                <p className="text-sm text-gray-600">{customerData.customer}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'monthly'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly Breakdown
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'items'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Items Details
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Total Budget</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {viewType === 'sales_budget' 
                          ? formatCurrency(customerData.totalBudgetValue)
                          : `${customerData.totalBudgetUnits.toLocaleString()} units`
                        }
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Total Actual</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {viewType === 'sales_budget' 
                          ? formatCurrency(customerData.totalActualValue)
                          : `${customerData.totalActualUnits.toLocaleString()} units`
                        }
                      </p>
                    </div>
                    <BarChart className="w-8 h-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Total Forecast</p>
                      <p className="text-2xl font-bold text-green-900">
                        {viewType === 'sales_budget' 
                          ? formatCurrency(customerData.totalForecastValue)
                          : `${customerData.totalForecastUnits.toLocaleString()} units`
                        }
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Performance Analysis */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Forecast vs Budget Variance</h4>
                    <div className={`flex items-center gap-2 ${getVarianceColor(totalVariance)}`}>
                      {getVarianceIcon(totalVariance)}
                      <span className="text-2xl font-bold">
                        {totalVariance > 0 ? '+' : ''}{totalVariance.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {totalVariance > 0 
                        ? 'Forecast exceeds budget target' 
                        : totalVariance < 0 
                          ? 'Forecast below budget target'
                          : 'Forecast matches budget target'
                      }
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Data Source</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Created by:</span>
                        <span className="text-sm font-medium">{customerData.salesmanName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last updated:</span>
                        <span className="text-sm font-medium">{customerData.lastUpdated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total items:</span>
                        <span className="text-sm font-medium">{customerData.items.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manager Access Notice */}
              {user?.role === 'manager' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-amber-600 text-sm">👑</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-800">Manager View</p>
                      <p className="text-xs text-amber-700">
                        This detailed breakdown is available only to managers. Salesman users see aggregate data without customer-specific breakdowns.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'monthly' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Budget</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actual</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Forecast</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customerData.monthlyData.map((month, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{month.month}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          {viewType === 'sales_budget' 
                            ? formatCurrency(month.budgetValue)
                            : `${month.budgetUnits.toLocaleString()} units`
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {viewType === 'sales_budget' 
                            ? formatCurrency(month.actualValue)
                            : `${month.actualUnits.toLocaleString()} units`
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {viewType === 'sales_budget' 
                            ? formatCurrency(month.forecastValue)
                            : `${month.forecastUnits.toLocaleString()} units`
                          }
                        </td>
                        <td className={`px-4 py-3 text-sm text-center font-medium ${getVarianceColor(month.variancePercentage)}`}>
                          {month.variancePercentage > 0 ? '+' : ''}{month.variancePercentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Items Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Budget</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actual</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Forecast</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customerData.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={item.item}>
                          {item.item}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.brand}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          {viewType === 'sales_budget' 
                            ? formatCurrency(item.budgetValue)
                            : `${item.budgetUnits.toLocaleString()} units`
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {viewType === 'sales_budget' 
                            ? formatCurrency(item.actualValue)
                            : `${item.actualUnits.toLocaleString()} units`
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {viewType === 'sales_budget' 
                            ? formatCurrency(item.forecastValue)
                            : `${item.forecastUnits.toLocaleString()} units`
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-center">${item.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Note:</span> This detailed view shows data saved by {customerData.salesmanName} 
              and is visible to managers for analysis and decision making.
            </div>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerForecastModal;
