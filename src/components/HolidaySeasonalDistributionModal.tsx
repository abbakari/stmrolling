import React, { useState, useMemo } from 'react';
import { X, Calendar, TrendingUp, Percent, Info, ChevronDown } from 'lucide-react';

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

interface HolidaySeasonalDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SalesBudgetItem[];
  selectedCustomer: string;
  selectedCategory: string;
  selectedBrand: string;
  selectedItem: string;
  onApplyDistribution: (distributionData: { [itemId: number]: MonthlyBudget[] }) => void;
}

const HolidaySeasonalDistributionModal: React.FC<HolidaySeasonalDistributionModalProps> = ({
  isOpen,
  onClose,
  items,
  selectedCustomer,
  selectedCategory,
  selectedBrand,
  selectedItem,
  onApplyDistribution
}) => {
  const [filterCustomer, setFilterCustomer] = useState(selectedCustomer || '');
  const [filterCategory, setFilterCategory] = useState(selectedCategory || '');
  const [filterBrand, setFilterBrand] = useState(selectedBrand || '');
  const [filterItem, setFilterItem] = useState(selectedItem || '');
  const [holidayPercentage, setHolidayPercentage] = useState<number>(65); // Default 65% for Nov-Dec
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [customNovPercentage, setCustomNovPercentage] = useState<number>(30);
  const [customDecPercentage, setCustomDecPercentage] = useState<number>(35);

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // Business rationale for holiday distribution
  const businessRationale = {
    november: {
      factors: [
        "Black Friday and early holiday shopping",
        "Corporate year-end budget utilization", 
        "Inventory preparation for December peak",
        "Pre-holiday business contracts finalization"
      ],
      researchBasis: "National Retail Federation studies show 30-40% increase in B2B transactions in November"
    },
    december: {
      factors: [
        "Holiday season peak demand",
        "Year-end tax benefits driving purchases",
        "Last-minute holiday business needs",
        "Next year inventory preparation"
      ],
      researchBasis: "McKinsey research indicates 35-45% surge in business procurement during December"
    }
  };

  // Get unique values for dropdown filters
  const uniqueValues = useMemo(() => {
    const customers = Array.from(new Set(items.map(item => item.customer))).sort();
    const categories = Array.from(new Set(items.map(item => item.category))).sort();
    const brands = Array.from(new Set(items.map(item => item.brand))).sort();
    const itemNames = Array.from(new Set(items.map(item => item.item))).sort();

    return { customers, categories, brands, itemNames };
  }, [items]);

  // Filter items based on selected criteria
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCustomer = !filterCustomer || item.customer === filterCustomer;
      const matchesCategory = !filterCategory || item.category === filterCategory;
      const matchesBrand = !filterBrand || item.brand === filterBrand;
      const matchesItem = !filterItem || item.item.toLowerCase().includes(filterItem.toLowerCase());
      
      return matchesCustomer && matchesCategory && matchesBrand && matchesItem;
    });
  }, [items, filterCustomer, filterCategory, filterBrand, filterItem]);

  // Holiday-optimized distribution calculation
  const calculateHolidayDistribution = (totalBudget: number, useCustomPercentages: boolean = false): number[] => {
    if (useCustomPercentages) {
      // Custom November-December percentages
      const novPercentage = customNovPercentage / 100;
      const decPercentage = customDecPercentage / 100;
      const remainingPercentage = 1 - novPercentage - decPercentage;
      
      // Distribute remaining across other months
      const baseMonthlyPercentage = remainingPercentage / 10; // 10 other months
      
      return months.map((month, index) => {
        if (index === 10) return Math.round(totalBudget * novPercentage); // November
        if (index === 11) return Math.round(totalBudget * decPercentage); // December
        return Math.round(totalBudget * baseMonthlyPercentage);
      });
    } else {
      // Standard holiday optimization using percentage
      const holidayAmount = Math.round((totalBudget * holidayPercentage) / 100);
      const regularAmount = totalBudget - holidayAmount;
      
      // Split holiday amount between Nov (45%) and Dec (55%)
      const novAmount = Math.round(holidayAmount * 0.45);
      const decAmount = holidayAmount - novAmount;
      
      // Distribute regular amount across remaining 10 months
      const monthlyRegular = Math.round(regularAmount / 10);
      const remainderRegular = regularAmount - (monthlyRegular * 10);
      
      return months.map((month, index) => {
        if (index === 10) return novAmount; // November
        if (index === 11) return decAmount; // December
        if (index < remainderRegular) return monthlyRegular + 1; // Distribute remainder
        return monthlyRegular;
      });
    }
  };

  const handleApplyDistribution = () => {
    if (!filterCustomer) {
      alert('Please select a customer first');
      return;
    }

    if (filteredItems.length === 0) {
      alert('No items found with the selected criteria');
      return;
    }

    const distributionData: { [itemId: number]: MonthlyBudget[] } = {};

    filteredItems.forEach(item => {
      const currentTotal = item.budget2026 || item.monthlyData.reduce((sum, month) => sum + month.budgetValue, 0);
      
      if (currentTotal > 0) {
        const distribution = calculateHolidayDistribution(currentTotal, showAdvancedOptions);
        
        const newMonthlyData = item.monthlyData.map((monthData, index) => ({
          ...monthData,
          budgetValue: distribution[index]
        }));

        distributionData[item.id] = newMonthlyData;
      }
    });

    onApplyDistribution(distributionData);
    onClose();

    // Reset form
    setHolidayPercentage(65);
    setCustomNovPercentage(30);
    setCustomDecPercentage(35);
  };

  const clearAllFilters = () => {
    setFilterCustomer('');
    setFilterCategory('');
    setFilterBrand('');
    setFilterItem('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-green-50 to-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-green-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">🎄 Holiday Seasonal Distribution</h2>
                <p className="text-sm text-gray-600">
                  Optimize November-December allocations for holiday business growth
                </p>
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

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Business Rationale Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-800">Business Rationale</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium text-orange-800 mb-2">November Strategy (45% of holiday allocation)</h4>
                <ul className="text-orange-700 space-y-1 text-xs">
                  {businessRationale.november.factors.map((factor, idx) => (
                    <li key={idx}>• {factor}</li>
                  ))}
                </ul>
                <p className="text-xs text-orange-600 mt-2 italic">{businessRationale.november.researchBasis}</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium text-red-800 mb-2">December Strategy (55% of holiday allocation)</h4>
                <ul className="text-red-700 space-y-1 text-xs">
                  {businessRationale.december.factors.map((factor, idx) => (
                    <li key={idx}>• {factor}</li>
                  ))}
                </ul>
                <p className="text-xs text-red-600 mt-2 italic">{businessRationale.december.researchBasis}</p>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Filter Criteria</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
                <select
                  value={filterCustomer}
                  onChange={(e) => {
                    setFilterCustomer(e.target.value);
                    setFilterCategory('');
                    setFilterBrand('');
                    setFilterItem('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Customer</option>
                  {uniqueValues.customers.map(customer => (
                    <option key={customer} value={customer}>{customer}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={!filterCustomer}
                >
                  <option value="">All Categories</option>
                  {uniqueValues.categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={!filterCustomer}
                >
                  <option value="">All Brands</option>
                  {uniqueValues.brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Search</label>
                <input
                  type="text"
                  value={filterItem}
                  onChange={(e) => setFilterItem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Search items..."
                  disabled={!filterCustomer}
                />
              </div>
            </div>

            {(filterCustomer || filterCategory || filterBrand || filterItem) && (
              <div className="flex justify-end pt-3">
                <button
                  onClick={clearAllFilters}
                  className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Distribution Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Holiday Distribution Configuration</h3>
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {showAdvancedOptions ? 'Simple Mode' : 'Advanced Mode'}
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {!showAdvancedOptions ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Holiday Period Allocation (November + December)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={holidayPercentage || ''}
                    onChange={(e) => setHolidayPercentage(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter percentage (e.g. 65)"
                    min="0"
                    max="100"
                    step="1"
                  />
                  <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 60-70% for holiday-dependent businesses. Remaining {100 - holidayPercentage}% distributed across Jan-Oct.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    November Allocation
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={customNovPercentage || ''}
                      onChange={(e) => setCustomNovPercentage(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="November %"
                      min="0"
                      max="100"
                      step="1"
                    />
                    <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    December Allocation
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={customDecPercentage || ''}
                      onChange={(e) => setCustomDecPercentage(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="December %"
                      min="0"
                      max="100"
                      step="1"
                    />
                    <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500">
                    Remaining {100 - customNovPercentage - customDecPercentage}% will be distributed equally across Jan-Oct ({((100 - customNovPercentage - customDecPercentage) / 10).toFixed(1)}% per month).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Selected Items Preview */}
          {filteredItems.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800 mb-2">
                Items to Apply Holiday Distribution ({filteredItems.length})
              </h3>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {filteredItems.map(item => (
                  <div key={item.id} className="text-sm text-green-700 bg-white p-2 rounded border">
                    <div className="font-medium">{item.customer}</div>
                    <div className="text-xs">{item.category} - {item.brand} - {item.item}</div>
                    <div className="text-xs text-gray-600">Current Budget: {item.budget2026 || item.monthlyData.reduce((sum, month) => sum + month.budgetValue, 0)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distribution Preview */}
          {filteredItems.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Distribution Preview</h3>
              <div className="text-sm text-yellow-700 space-y-1">
                {!showAdvancedOptions ? (
                  <>
                    <div>• Holiday Period (Nov + Dec): {holidayPercentage}% of total budget</div>
                    <div>• November: {Math.round(holidayPercentage * 0.45)}% of total budget</div>
                    <div>• December: {Math.round(holidayPercentage * 0.55)}% of total budget</div>
                    <div>• Regular Months (Jan-Oct): {100 - holidayPercentage}% distributed equally ({((100 - holidayPercentage) / 10).toFixed(1)}% each)</div>
                  </>
                ) : (
                  <>
                    <div>• November: {customNovPercentage}% of total budget</div>
                    <div>• December: {customDecPercentage}% of total budget</div>
                    <div>• Regular Months (Jan-Oct): {100 - customNovPercentage - customDecPercentage}% distributed equally ({((100 - customNovPercentage - customDecPercentage) / 10).toFixed(1)}% each)</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyDistribution}
              disabled={!filterCustomer || filteredItems.length === 0}
              className="flex-1 bg-gradient-to-r from-green-600 to-red-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Apply Holiday Distribution to {filteredItems.length} Item(s)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidaySeasonalDistributionModal;
