import React, { useState, useEffect } from 'react';
import { X, Plus, Save, TrendingUp, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { Customer, Item, ForecastFormData, MonthlyForecast } from '../types/forecast';

interface CustomerForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  items: Item[];
  onSaveForecast: (forecast: ForecastFormData) => void;
  existingForecast?: ForecastFormData | null;
}

const CustomerForecastModal: React.FC<CustomerForecastModalProps> = ({
  isOpen,
  onClose,
  customer,
  items,
  onSaveForecast,
  existingForecast
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState<string>('');
  const [monthlyData, setMonthlyData] = useState<{ [month: string]: { quantity: number; unitPrice: number; notes?: string } }>({});

  // Get remaining months of the current year
  const getCurrentYearRemainingMonths = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return months.slice(currentMonth).map((month, index) => ({
      name: month,
      index: currentMonth + index,
      year: currentYear
    }));
  };

  const remainingMonths = getCurrentYearRemainingMonths();

  // Initialize monthly data for remaining months
  useEffect(() => {
    if (isOpen) {
      const initialData: { [month: string]: { quantity: number; unitPrice: number; notes?: string } } = {};
      remainingMonths.forEach(month => {
        initialData[month.name] = {
          quantity: 0,
          unitPrice: 0,
          notes: ''
        };
      });
      setMonthlyData(initialData);
    }
  }, [isOpen]);

  // Load existing forecast if provided
  useEffect(() => {
    if (existingForecast) {
      setSelectedItemId(existingForecast.itemId);
      setConfidence(existingForecast.confidence);
      setNotes(existingForecast.notes || '');
      setMonthlyData(existingForecast.forecasts);
    }
  }, [existingForecast]);

  const handleMonthlyDataChange = (month: string, field: 'quantity' | 'unitPrice' | 'notes', value: number | string) => {
    setMonthlyData(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [field]: field === 'notes' ? value : Number(value)
      }
    }));
  };

  const calculateMonthlyTotal = (month: string) => {
    const data = monthlyData[month];
    if (!data) return 0;
    return data.quantity * data.unitPrice;
  };

  const calculateYearlyTotal = () => {
    return Object.keys(monthlyData).reduce((total, month) => {
      return total + calculateMonthlyTotal(month);
    }, 0);
  };

  const getSelectedItem = () => {
    return items.find(item => item.id === selectedItemId);
  };

  const handleSave = () => {
    if (!customer || !selectedItemId) {
      alert('Please select a customer and item');
      return;
    }

    const forecastData: ForecastFormData = {
      customerId: customer.id,
      itemId: selectedItemId,
      forecasts: monthlyData,
      confidence,
      notes
    };

    onSaveForecast(forecastData);
    onClose();
  };

  const handleClose = () => {
    setSelectedItemId('');
    setConfidence('medium');
    setNotes('');
    setMonthlyData({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Create Forecast for {customer?.name}
            </h2>
            <p className="text-sm text-gray-600">
              Enter monthly forecast data for remaining months of {new Date().getFullYear()}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-blue-900">Customer</p>
                <p className="text-lg font-semibold text-blue-800">{customer?.name}</p>
                <p className="text-sm text-blue-600">{customer?.code}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Region</p>
                <p className="text-blue-800">{customer?.region}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Segment</p>
                <p className="text-blue-800">{customer?.segment}</p>
              </div>
            </div>
          </div>

          {/* Item Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Item to Forecast
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an item...</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.sku} - {item.name} ({item.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forecast Confidence
              </label>
              <select
                value={confidence}
                onChange={(e) => setConfidence(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Confidence</option>
                <option value="medium">Medium Confidence</option>
                <option value="high">High Confidence</option>
              </select>
            </div>
          </div>

          {/* Selected Item Details */}
          {selectedItemId && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Selected Item Details</h3>
              {(() => {
                const item = getSelectedItem();
                if (!item) return null;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-600">SKU</p>
                      <p className="text-gray-900">{item.sku}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Name</p>
                      <p className="text-gray-900">{item.name}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Unit Price</p>
                      <p className="text-gray-900">${item.unitPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Category</p>
                      <p className="text-gray-900">{item.category}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Monthly Forecast Input */}
          {selectedItemId && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Monthly Forecast Data
                </h3>
                <p className="text-sm text-gray-600 mt-1">Enter forecast quantities for each month using the simplified 2-row layout</p>
              </div>
              
              {/* Simplified 2-row horizontal layout - Month and Quantity only */}
              <div className="space-y-4">
                  {/* Quick Distribution Tools */}
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <h5 className="text-sm font-medium text-yellow-800 mb-2">Quick Forecast Distribution</h5>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const totalQuantity = Object.values(monthlyData).reduce((sum, data) => sum + data.quantity, 0);
                          const monthlyAverage = Math.round(totalQuantity / remainingMonths.length);
                          const selectedItem = getSelectedItem();
                          const defaultPrice = selectedItem?.unitPrice || 0;
                          setMonthlyData(prev => {
                            const newData = { ...prev };
                            remainingMonths.forEach(month => {
                              newData[month.name] = {
                                ...newData[month.name],
                                quantity: monthlyAverage,
                                unitPrice: defaultPrice
                              };
                            });
                            return newData;
                          });
                        }}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-xs hover:bg-blue-200 transition-colors"
                      >
                        📊 Equal Distribution
                      </button>
                      <button
                        onClick={() => {
                          const seasonalMultipliers = remainingMonths.map((_, index) => {
                            const monthIndex = new Date().getMonth() + index;
                            // Q4 gets higher multipliers
                            if (monthIndex >= 9) return 1.3; // Oct, Nov, Dec
                            if (monthIndex >= 6) return 1.1; // Jul, Aug, Sep
                            return 0.9; // Earlier months
                          });
                          const totalQuantity = Object.values(monthlyData).reduce((sum, data) => sum + data.quantity, 0);
                          const baseValue = totalQuantity / remainingMonths.length;
                          const selectedItem = getSelectedItem();
                          const defaultPrice = selectedItem?.unitPrice || 0;
                          setMonthlyData(prev => {
                            const newData = { ...prev };
                            remainingMonths.forEach((month, index) => {
                              newData[month.name] = {
                                ...newData[month.name],
                                quantity: Math.round(baseValue * seasonalMultipliers[index]),
                                unitPrice: defaultPrice
                              };
                            });
                            return newData;
                          });
                        }}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded text-xs hover:bg-green-200 transition-colors"
                      >
                        📈 Seasonal Growth
                      </button>
                      <button
                        onClick={() => {
                          setMonthlyData(prev => {
                            const newData = { ...prev };
                            remainingMonths.forEach(month => {
                              newData[month.name] = {
                                ...newData[month.name],
                                quantity: 0
                              };
                            });
                            return newData;
                          });
                        }}
                        className="bg-red-100 text-red-800 px-3 py-1 rounded text-xs hover:bg-red-200 transition-colors"
                      >
                        🗑️ Clear All
                      </button>
                    </div>
                  </div>

                  {/* 2-Row Horizontal Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] border border-gray-300 rounded-lg">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-300 min-w-[80px]">Month</th>
                          {remainingMonths.map((month) => (
                            <th key={month.name} className="p-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300 min-w-[80px]">
                              {month.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white">
                          <td className="p-3 font-medium text-gray-800 border-r border-gray-300 bg-gray-50">Forecast Quantity</td>
                          {remainingMonths.map((month) => (
                            <td key={month.name} className="p-2 border-r border-gray-300">
                              <input
                                type="number"
                                min="0"
                                className="w-full p-2 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={monthlyData[month.name]?.quantity || 0}
                                onChange={(e) => {
                                  const selectedItem = getSelectedItem();
                                  const defaultPrice = selectedItem?.unitPrice || 0;
                                  handleMonthlyDataChange(month.name, 'quantity', e.target.value);
                                  // Auto-set unit price in simplified mode
                                  if (defaultPrice > 0) {
                                    handleMonthlyDataChange(month.name, 'unitPrice', defaultPrice);
                                  }
                                }}
                                placeholder="0"
                              />
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Stats */}
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-sm text-blue-600 font-medium">Total Quantity</div>
                        <div className="text-lg font-bold text-blue-800">
                          {Object.values(monthlyData).reduce((sum, data) => sum + data.quantity, 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-green-600 font-medium">Total Value</div>
                        <div className="text-lg font-bold text-green-800">
                          ${calculateYearlyTotal().toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-purple-600 font-medium">Avg/Month</div>
                        <div className="text-lg font-bold text-purple-800">
                          {Math.round(Object.values(monthlyData).reduce((sum, data) => sum + data.quantity, 0) / remainingMonths.length).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-orange-600 font-medium">Forecast Growth</div>
                        <div className="text-lg font-bold text-orange-800">
                          {(() => {
                            const quantities = remainingMonths.map(month => monthlyData[month.name]?.quantity || 0);
                            if (quantities.length < 2) return '0%';
                            const firstHalf = quantities.slice(0, Math.floor(quantities.length / 2));
                            const secondHalf = quantities.slice(Math.floor(quantities.length / 2));
                            const firstAvg = firstHalf.reduce((sum, q) => sum + q, 0) / firstHalf.length;
                            const secondAvg = secondHalf.reduce((sum, q) => sum + q, 0) / secondHalf.length;
                            const growth = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg * 100) : 0;
                            return `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
                          })()
                        }
                        </div>
                      </div>
                    </div>
                  </div>
              </div>

              {/* Summary */}
              <div className="mt-4 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-900">Yearly Total Forecast</span>
                  </div>
                  <span className="text-xl font-bold text-green-800">
                    ${calculateYearlyTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* General Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              General Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any additional notes about this forecast..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center text-sm text-gray-600">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Forecast will be saved as draft and can be edited later</span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedItemId}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Forecast</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerForecastModal;
