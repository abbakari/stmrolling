import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, PieChart, RotateCcw, Percent, Calendar } from 'lucide-react';

interface MonthlyBudget {
  month: string;
  budgetValue: number;
  actualValue: number;
  rate: number;
  stock: number;
  git: number;
  discount: number;
}

interface SalesBudgetItem {
  id: number;
  selected: boolean;
  customer: string;
  item: string;
  category: string;
  brand: string;
  budget2026: number;
  monthlyData: MonthlyBudget[];
}

interface SetDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SalesBudgetItem[];
  selectedCustomer: string;
  selectedCategory: string;
  selectedBrand: string;
  selectedItem: string;
  onApplyDistribution: (distributionData: { [itemId: number]: MonthlyBudget[] }) => void;
}

const SetDistributionModal: React.FC<SetDistributionModalProps> = ({
  isOpen,
  onClose,
  items,
  selectedCustomer,
  selectedCategory,
  selectedBrand,
  selectedItem,
  onApplyDistribution
}) => {
  const [distributionType, setDistributionType] = useState<'equal' | 'percentage' | 'custom'>('equal');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [monthlyPercentages, setMonthlyPercentages] = useState<{ [month: string]: number }>({});
  const [previewData, setPreviewData] = useState<{ [itemId: number]: MonthlyBudget[] }>({});

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // Filter items based on active filters
  const filteredItems = items.filter(item => {
    return (!selectedCustomer || item.customer.includes(selectedCustomer)) &&
           (!selectedCategory || item.category.includes(selectedCategory)) &&
           (!selectedBrand || item.brand.includes(selectedBrand)) &&
           (!selectedItem || item.item.includes(selectedItem));
  });

  useEffect(() => {
    if (isOpen) {
      // Initialize with all months selected for equal distribution
      setSelectedMonths([...months]);
      // Initialize equal percentages
      const equalPercentage = Math.round(100 / months.length * 10) / 10;
      const initialPercentages = months.reduce((acc, month) => {
        acc[month] = equalPercentage;
        return acc;
      }, {} as { [month: string]: number });
      setMonthlyPercentages(initialPercentages);
      generatePreview();
    }
  }, [isOpen]);

  useEffect(() => {
    generatePreview();
  }, [distributionType, selectedMonths, monthlyPercentages, filteredItems]);

  const generatePreview = () => {
    const preview: { [itemId: number]: MonthlyBudget[] } = {};

    filteredItems.forEach(item => {
      const newMonthlyData = [...item.monthlyData];

      if (distributionType === 'equal') {
        // Equal distribution across selected months
        const monthsToDistribute = selectedMonths.length > 0 ? selectedMonths : months;
        const equalValue = item.budget2026 / monthsToDistribute.length;

        newMonthlyData.forEach(monthData => {
          if (monthsToDistribute.includes(monthData.month)) {
            monthData.budgetValue = Math.round(equalValue);
          } else {
            monthData.budgetValue = 0;
          }
        });
      } else if (distributionType === 'percentage') {
        // Percentage-based distribution
        newMonthlyData.forEach(monthData => {
          const percentage = monthlyPercentages[monthData.month] || 0;
          monthData.budgetValue = Math.round((item.budget2026 * percentage) / 100);
        });
      }

      preview[item.id] = newMonthlyData;
    });

    setPreviewData(preview);
  };

  const handleMonthToggle = (month: string) => {
    const newSelectedMonths = selectedMonths.includes(month)
      ? selectedMonths.filter(m => m !== month)
      : [...selectedMonths, month];
    
    setSelectedMonths(newSelectedMonths);

    // Auto-adjust equal percentages when months are selected/deselected
    if (distributionType === 'equal' && newSelectedMonths.length > 0) {
      const equalPercentage = Math.round(100 / newSelectedMonths.length * 10) / 10;
      const newPercentages = months.reduce((acc, m) => {
        acc[m] = newSelectedMonths.includes(m) ? equalPercentage : 0;
        return acc;
      }, {} as { [month: string]: number });
      setMonthlyPercentages(newPercentages);
    }
  };

  const handlePercentageChange = (month: string, value: number) => {
    setMonthlyPercentages(prev => ({
      ...prev,
      [month]: Math.max(0, Math.min(100, value))
    }));
  };

  const resetToEqual = () => {
    setDistributionType('equal');
    setSelectedMonths([...months]);
    const equalPercentage = Math.round(100 / months.length * 10) / 10;
    const equalPercentages = months.reduce((acc, month) => {
      acc[month] = equalPercentage;
      return acc;
    }, {} as { [month: string]: number });
    setMonthlyPercentages(equalPercentages);
  };

  const getTotalPercentage = () => {
    return Object.values(monthlyPercentages).reduce((sum, val) => sum + val, 0);
  };

  const handleApply = () => {
    onApplyDistribution(previewData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PieChart className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Set Monthly Distribution</h2>
                <p className="text-sm text-gray-600">Configure automatic distribution for {filteredItems.length} items</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Configuration Panel */}
          <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Distribution Type */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Distribution Type</h3>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="distributionType"
                      value="equal"
                      checked={distributionType === 'equal'}
                      onChange={(e) => setDistributionType(e.target.value as any)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Equal Distribution</div>
                      <div className="text-sm text-gray-600">Distribute equally across selected months</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="distributionType"
                      value="percentage"
                      checked={distributionType === 'percentage'}
                      onChange={(e) => setDistributionType(e.target.value as any)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Percentage-based</div>
                      <div className="text-sm text-gray-600">Custom percentage for each month</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Month Selection */}
              {distributionType === 'equal' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Select Months</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {months.map(month => (
                      <label key={month} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedMonths.includes(month)}
                          onChange={() => handleMonthToggle(month)}
                          className="mr-2"
                        />
                        <span className="text-sm">{month}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Percentage Configuration */}
              {distributionType === 'percentage' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">Monthly Percentages</h3>
                    <div className="text-sm">
                      Total: <span className={`font-medium ${getTotalPercentage() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {getTotalPercentage().toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {months.map(month => (
                      <div key={month} className="flex items-center gap-2">
                        <span className="w-10 text-sm font-medium">{month}</span>
                        <input
                          type="number"
                          value={monthlyPercentages[month] || 0}
                          onChange={(e) => handlePercentageChange(month, parseFloat(e.target.value) || 0)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        <Percent className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset Button */}
              <button
                onClick={resetToEqual}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Equal
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preview ({filteredItems.length} items)</h3>
            
            {/* Applied Filters Summary */}
            {(selectedCustomer || selectedCategory || selectedBrand || selectedItem) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="text-sm font-medium text-blue-800 mb-1">Applied Filters:</div>
                <div className="text-sm text-blue-700">
                  {selectedCustomer && <span className="mr-3">Customer: {selectedCustomer}</span>}
                  {selectedCategory && <span className="mr-3">Category: {selectedCategory}</span>}
                  {selectedBrand && <span className="mr-3">Brand: {selectedBrand}</span>}
                  {selectedItem && <span className="mr-3">Item: {selectedItem}</span>}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {filteredItems.slice(0, 10).map(item => {
                const itemPreview = previewData[item.id] || item.monthlyData;
                const totalDistributed = itemPreview.reduce((sum, month) => sum + month.budgetValue, 0);
                
                return (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium text-gray-900">{item.customer}</div>
                        <div className="text-sm text-gray-600 truncate max-w-md">{item.item}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Budget 2026</div>
                        <div className="font-medium">{item.budget2026.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">Distributed: {totalDistributed.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-6 gap-2">
                      {itemPreview.map(monthData => (
                        <div key={monthData.month} className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xs font-medium text-gray-600">{monthData.month}</div>
                          <div className="text-sm font-medium">{monthData.budgetValue.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {filteredItems.length > 10 && (
                <div className="text-center text-gray-500 text-sm">
                  ... and {filteredItems.length - 10} more items
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {distributionType === 'percentage' && getTotalPercentage() !== 100 && (
                <span className="text-red-600">⚠️ Total percentage must equal 100%</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={distributionType === 'percentage' && getTotalPercentage() !== 100}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Apply Distribution
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetDistributionModal;
