import React, { useState, useMemo } from 'react';
import { X, PieChart, Search, Calculator, Percent } from 'lucide-react';

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
  const [distributionType, setDistributionType] = useState<'equal' | 'percentage'>('equal');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [itemQuantity, setItemQuantity] = useState<number>(0);
  const [percentageValue, setPercentageValue] = useState<number>(0);

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // Get unique customers for search
  const customers = useMemo(() => {
    const uniqueCustomers = Array.from(new Set(items.map(item => item.customer)));
    return uniqueCustomers.filter(customer =>
      customer.toLowerCase().includes(searchCustomer.toLowerCase())
    );
  }, [items, searchCustomer]);

  // Filter items based on search customer only - ignore other filters for distribution
  const filteredItems = useMemo(() => {
    if (!searchCustomer) return [];

    return items.filter(item => {
      return item.customer.toLowerCase().includes(searchCustomer.toLowerCase());
    });
  }, [items, searchCustomer]);

  // Smart distribution logic
  const distributeQuantityEqually = (quantity: number): number[] => {
    const baseAmount = Math.floor(quantity / 12);
    const remainder = quantity % 12;

    // Start with base amount for all months
    const distribution = new Array(12).fill(baseAmount);

    // Distribute remainder starting from December (index 11) backwards
    for (let i = 0; i < remainder; i++) {
      const monthIndex = 11 - i; // Start from December (11) and go backwards
      distribution[monthIndex] += 1;
    }

    return distribution;
  };

  const distributeByPercentage = (totalBudget: number, percentage: number): number[] => {
    const amountToDistribute = Math.round((totalBudget * percentage) / 100);
    return distributeQuantityEqually(amountToDistribute);
  };

  const handleApplyDistribution = () => {
    if (!searchCustomer) {
      alert('Please search and select a customer first');
      return;
    }

    if (!itemQuantity && !percentageValue) {
      alert('Please enter a quantity or percentage value');
      return;
    }

    if (filteredItems.length === 0) {
      alert('No items found for the selected customer');
      return;
    }

    const distributionData: { [itemId: number]: MonthlyBudget[] } = {};

    filteredItems.forEach(item => {
      const newMonthlyData = [...item.monthlyData];
      let distribution: number[];

      if (distributionType === 'equal') {
        distribution = distributeQuantityEqually(itemQuantity);
      } else {
        distribution = distributeByPercentage(item.budget2026, percentageValue);
      }

      // Apply distribution to monthly data
      newMonthlyData.forEach((monthData, index) => {
        monthData.budgetValue = distribution[index];
      });

      distributionData[item.id] = newMonthlyData;
    });

    onApplyDistribution(distributionData);
    onClose();

    // Reset form
    setItemQuantity(0);
    setPercentageValue(0);
    setSearchCustomer('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PieChart className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Set Distribution</h2>
                <p className="text-sm text-gray-600">
                  {searchCustomer ? `${filteredItems.length} items for: ${searchCustomer}` : 'Search customer to begin'}
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
          {/* Customer Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Customer
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Type customer name..."
              />
            </div>
            {customers.length > 0 && searchCustomer && (
              <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                {customers.slice(0, 5).map(customer => (
                  <div
                    key={customer}
                    onClick={() => setSearchCustomer(customer)}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    {customer}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Distribution Type */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Distribution Type</h3>
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
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium">Equal Distribution</div>
                    <div className="text-sm text-gray-600">Enter quantity to distribute equally</div>
                  </div>
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
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="font-medium">Percentage Distribution</div>
                    <div className="text-sm text-gray-600">Enter percentage of BUD 2026</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Input Fields */}
          {distributionType === 'equal' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Quantity
              </label>
              <input
                type="number"
                value={itemQuantity || ''}
                onChange={(e) => setItemQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter quantity (e.g. 13)"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                System will distribute equally, excess goes to Dec→Nov→Jan...
              </p>
            </div>
          )}

          {distributionType === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Percentage of BUD 2026
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={percentageValue || ''}
                  onChange={(e) => setPercentageValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter percentage (e.g. 25)"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                System will calculate amount and distribute equally
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm">
              <div className="font-medium text-blue-800 mb-1">
                Will apply to: {filteredItems.length} items {searchCustomer ? `for customer "${searchCustomer}"` : ''}
              </div>
              {distributionType === 'equal' && itemQuantity > 0 && (
                <div className="text-blue-700">
                  {itemQuantity} items distributed across 12 months
                  {itemQuantity > 12 && (
                    <span className="block text-xs">
                      Base: {Math.floor(itemQuantity / 12)} per month,
                      Extra: {itemQuantity % 12} items (Dec→Nov→Jan...)
                    </span>
                  )}
                </div>
              )}
              {distributionType === 'percentage' && percentageValue > 0 && (
                <div className="text-blue-700">
                  {percentageValue}% of each item's BUD 2026 distributed equally
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyDistribution}
              disabled={(!itemQuantity && !percentageValue) || !searchCustomer || filteredItems.length === 0}
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Apply Distribution
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetDistributionModal;
