import React, { useState, useEffect } from 'react';
import { X, MessageSquare, CheckCircle, Clock, AlertTriangle, Users, Package, Truck, Send, Eye, Filter, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface WorkflowItem {
  id: string;
  type: 'stock_request' | 'budget_approval' | 'forecast_review' | 'supply_chain_issue' | 'follow_back';
  fromUser: string;
  fromRole: 'salesman' | 'manager' | 'supply_chain';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated';
  createdAt: string;
  updatedAt: string;
  responses: WorkflowResponse[];
  metadata?: any;
}

interface WorkflowResponse {
  id: string;
  message: string;
  fromUser: string;
  fromRole: string;
  timestamp: string;
  isAdminResponse: boolean;
}

interface AdminWorkflowCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminWorkflowCenter: React.FC<AdminWorkflowCenterProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [workflowItems, setWorkflowItems] = useState<WorkflowItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WorkflowItem | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const WORKFLOW_STORAGE_KEY = 'admin_workflow_center';

  useEffect(() => {
    if (isOpen) {
      loadWorkflowItems();
      // Set up periodic refresh
      const interval = setInterval(loadWorkflowItems, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadWorkflowItems = () => {
    try {
      // Load from various sources
      const savedWorkflow = localStorage.getItem(WORKFLOW_STORAGE_KEY);
      let items: WorkflowItem[] = savedWorkflow ? JSON.parse(savedWorkflow) : [];
      
      // Add sample workflow items for demonstration
      if (items.length === 0) {
        items = generateSampleWorkflowItems();
        localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(items));
      }
      
      setWorkflowItems(items);
    } catch (error) {
      console.error('Error loading workflow items:', error);
    }
  };

  const generateSampleWorkflowItems = (): WorkflowItem[] => {
    return [
      {
        id: 'wf_001',
        type: 'stock_request',
        fromUser: 'John Salesman',
        fromRole: 'salesman',
        title: 'Stock Request: BF GOODRICH TYRE',
        description: 'Requesting 50 units of BF GOODRICH TYRE 235/85R16 for Action Aid International customer. Current stock is low.',
        priority: 'high',
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        responses: [
          {
            id: 'resp_001',
            message: 'Customer Action Aid has urgent requirement. Please prioritize this request.',
            fromUser: 'John Salesman',
            fromRole: 'salesman',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            isAdminResponse: false
          }
        ],
        metadata: {
          itemName: 'BF GOODRICH TYRE 235/85R16',
          customer: 'Action Aid International (Tz)',
          requestedQuantity: 50,
          currentStock: 7
        }
      },
      {
        id: 'wf_002',
        type: 'budget_approval',
        fromUser: 'Sarah Manager',
        fromRole: 'manager',
        title: 'Budget Approval Request',
        description: 'Manager requesting approval for budget allocation of $250,000 for Q1 2026.',
        priority: 'medium',
        status: 'in_progress',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
        responses: [
          {
            id: 'resp_002',
            message: 'Budget request includes increased allocation for MICHELIN products based on market demand.',
            fromUser: 'Sarah Manager',
            fromRole: 'manager',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            isAdminResponse: false
          },
          {
            id: 'resp_003',
            message: 'Request approved for review. Please provide detailed breakdown by category.',
            fromUser: 'System Administrator',
            fromRole: 'admin',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            isAdminResponse: true
          }
        ],
        metadata: {
          budgetAmount: 250000,
          period: 'Q1 2026',
          categories: ['TYRE SERVICE']
        }
      },
      {
        id: 'wf_003',
        type: 'supply_chain_issue',
        fromUser: 'Supply Chain Team',
        fromRole: 'supply_chain',
        title: 'Delivery Delay: MICHELIN Shipment',
        description: 'MICHELIN shipment delayed by 2 weeks due to supplier issues. Affecting multiple customer orders.',
        priority: 'urgent',
        status: 'escalated',
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        updatedAt: new Date(Date.now() - 900000).toISOString(),
        responses: [
          {
            id: 'resp_004',
            message: 'Original ETA was 2025-02-15. New ETA is 2025-03-01. Customers Action Aid and ADVENT affected.',
            fromUser: 'Supply Chain Team',
            fromRole: 'supply_chain',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            isAdminResponse: false
          }
        ],
        metadata: {
          shipmentId: 'SH_2025_001',
          affectedCustomers: ['Action Aid International (Tz)', 'ADVENT CONSTRUCTION LTD.'],
          originalETA: '2025-02-15',
          newETA: '2025-03-01'
        }
      },
      {
        id: 'wf_004',
        type: 'follow_back',
        fromUser: 'Mike Salesman',
        fromRole: 'salesman',
        title: 'Follow-back: Customer Feedback',
        description: 'Customer requesting price adjustment and expedited delivery for BF GOODRICH tyres.',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date(Date.now() - 5400000).toISOString(),
        updatedAt: new Date(Date.now() - 5400000).toISOString(),
        responses: [
          {
            id: 'resp_005',
            message: 'Customer mentions competitor pricing is 10% lower. They are a key account.',
            fromUser: 'Mike Salesman',
            fromRole: 'salesman',
            timestamp: new Date(Date.now() - 5400000).toISOString(),
            isAdminResponse: false
          }
        ],
        metadata: {
          customer: 'Action Aid International (Tz)',
          requestType: 'price_adjustment',
          competitorDiscount: 10
        }
      }
    ];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stock_request': return <Package className="w-5 h-5" />;
      case 'budget_approval': return <CheckCircle className="w-5 h-5" />;
      case 'forecast_review': return <Eye className="w-5 h-5" />;
      case 'supply_chain_issue': return <Truck className="w-5 h-5" />;
      case 'follow_back': return <MessageSquare className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-800 bg-yellow-100';
      case 'in_progress': return 'text-blue-800 bg-blue-100';
      case 'resolved': return 'text-green-800 bg-green-100';
      case 'escalated': return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const handleSendResponse = () => {
    if (!selectedItem || !responseMessage.trim()) return;

    const newResponse: WorkflowResponse = {
      id: `resp_${Date.now()}`,
      message: responseMessage,
      fromUser: user?.name || 'System Administrator',
      fromRole: 'admin',
      timestamp: new Date().toISOString(),
      isAdminResponse: true
    };

    const updatedItems = workflowItems.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          responses: [...item.responses, newResponse],
          status: 'in_progress' as const,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    setWorkflowItems(updatedItems);
    localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(updatedItems));
    setResponseMessage('');
    
    // Update selected item
    const updatedItem = updatedItems.find(item => item.id === selectedItem.id);
    if (updatedItem) setSelectedItem(updatedItem);
  };

  const updateItemStatus = (itemId: string, newStatus: WorkflowItem['status']) => {
    const updatedItems = workflowItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    setWorkflowItems(updatedItems);
    localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(updatedItems));
    
    if (selectedItem?.id === itemId) {
      const updatedItem = updatedItems.find(item => item.id === itemId);
      if (updatedItem) setSelectedItem(updatedItem);
    }
  };

  const filteredItems = workflowItems.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fromUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStats = () => {
    const total = workflowItems.length;
    const pending = workflowItems.filter(item => item.status === 'pending').length;
    const inProgress = workflowItems.filter(item => item.status === 'in_progress').length;
    const urgent = workflowItems.filter(item => item.priority === 'urgent').length;
    
    return { total, pending, inProgress, urgent };
  };

  const stats = getStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Admin Workflow Center</h2>
                <p className="text-sm text-gray-600">Coordinate with salesmen, managers, and supply chain</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Stats Dashboard */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-sm text-blue-700">Total Items</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
              <div className="text-sm text-yellow-700">Pending</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-900">{stats.inProgress}</div>
              <div className="text-sm text-green-700">In Progress</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-900">{stats.urgent}</div>
              <div className="text-sm text-red-700">Urgent</div>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(95vh-200px)]">
          {/* Left Panel - Workflow Items */}
          <div className="w-1/2 border-r border-gray-200 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex gap-3 mb-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search workflow items..."
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="stock_request">Stock Requests</option>
                  <option value="budget_approval">Budget Approvals</option>
                  <option value="supply_chain_issue">Supply Chain</option>
                  <option value="follow_back">Follow-backs</option>
                </select>
              </div>
            </div>

            {/* Workflow Items List */}
            <div className="overflow-y-auto h-full">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedItem?.id === item.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getPriorityColor(item.priority)}`}>
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>From: {item.fromUser}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.5 rounded ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredItems.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No workflow items found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Selected Item Details */}
          <div className="w-1/2 flex flex-col">
            {selectedItem ? (
              <>
                {/* Item Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-lg ${getPriorityColor(selectedItem.priority)}`}>
                      {getTypeIcon(selectedItem.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{selectedItem.title}</h3>
                      <p className="text-gray-600 mt-1">{selectedItem.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-500">
                          From: <span className="font-medium">{selectedItem.fromUser}</span> ({selectedItem.fromRole})
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedItem.status)}`}>
                          {selectedItem.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedItem.priority)}`}>
                          {selectedItem.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => updateItemStatus(selectedItem.id, 'in_progress')}
                      disabled={selectedItem.status === 'in_progress'}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Mark In Progress
                    </button>
                    <button
                      onClick={() => updateItemStatus(selectedItem.id, 'resolved')}
                      disabled={selectedItem.status === 'resolved'}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => updateItemStatus(selectedItem.id, 'escalated')}
                      disabled={selectedItem.status === 'escalated'}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Escalate
                    </button>
                  </div>
                </div>

                {/* Conversation */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Conversation</h4>
                  <div className="space-y-3">
                    {selectedItem.responses.map((response) => (
                      <div
                        key={response.id}
                        className={`p-3 rounded-lg ${
                          response.isAdminResponse
                            ? 'bg-blue-50 border border-blue-200 ml-4'
                            : 'bg-gray-50 border border-gray-200 mr-4'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{response.fromUser}</span>
                          <span className="text-xs text-gray-500">({response.fromRole})</span>
                          <span className="text-xs text-gray-500">
                            {new Date(response.timestamp).toLocaleString()}
                          </span>
                          {response.isAdminResponse && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Admin</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{response.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Response Form */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex gap-3">
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Type your response..."
                      rows={3}
                    />
                    <button
                      onClick={handleSendResponse}
                      disabled={!responseMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select a workflow item</p>
                  <p className="text-sm">Choose an item from the left to view details and respond</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWorkflowCenter;
