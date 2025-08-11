// Utility for permanent storage and retrieval of manual BUD 2026 entries
// Ensures manually entered values are preserved across sessions and operations

interface ManualBudgetEntry {
  id: number;
  customer: string;
  item: string;
  category: string;
  brand: string;
  budget2026: number;
  isManualEntry: boolean;
  lastModified: string;
  modifiedBy: string;
}

const MANUAL_BUDGET_STORAGE_KEY = 'manual_budget_2026_entries';

export class ManualBudgetPersistence {
  // Save a manual budget entry
  static saveManualEntry(
    id: number,
    customer: string,
    item: string,
    category: string,
    brand: string,
    budget2026: number,
    modifiedBy: string
  ): void {
    try {
      const existingEntries = this.getAllManualEntries();
      const entryIndex = existingEntries.findIndex(entry => 
        entry.id === id && 
        entry.customer === customer && 
        entry.item === item
      );

      const newEntry: ManualBudgetEntry = {
        id,
        customer,
        item,
        category,
        brand,
        budget2026,
        isManualEntry: true,
        lastModified: new Date().toISOString(),
        modifiedBy
      };

      if (entryIndex >= 0) {
        // Update existing entry
        existingEntries[entryIndex] = newEntry;
      } else {
        // Add new entry
        existingEntries.push(newEntry);
      }

      localStorage.setItem(MANUAL_BUDGET_STORAGE_KEY, JSON.stringify(existingEntries));
      console.log(`Manual budget entry saved: ${customer} - ${item} = ${budget2026}`);
    } catch (error) {
      console.error('Error saving manual budget entry:', error);
    }
  }

  // Get all manual budget entries
  static getAllManualEntries(): ManualBudgetEntry[] {
    try {
      const stored = localStorage.getItem(MANUAL_BUDGET_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error retrieving manual budget entries:', error);
      return [];
    }
  }

  // Get manual entry for specific item
  static getManualEntry(id: number, customer: string, item: string): ManualBudgetEntry | null {
    try {
      const entries = this.getAllManualEntries();
      return entries.find(entry => 
        entry.id === id && 
        entry.customer === customer && 
        entry.item === item
      ) || null;
    } catch (error) {
      console.error('Error retrieving manual budget entry:', error);
      return null;
    }
  }

  // Check if an entry is manually set
  static isManualEntry(id: number, customer: string, item: string): boolean {
    const entry = this.getManualEntry(id, customer, item);
    return entry !== null && entry.isManualEntry;
  }

  // Get manual budget value if exists
  static getManualBudgetValue(id: number, customer: string, item: string): number | null {
    const entry = this.getManualEntry(id, customer, item);
    return entry ? entry.budget2026 : null;
  }

  // Remove manual entry (if user wants to reset to automatic)
  static removeManualEntry(id: number, customer: string, item: string): void {
    try {
      const entries = this.getAllManualEntries();
      const filteredEntries = entries.filter(entry => 
        !(entry.id === id && entry.customer === customer && entry.item === item)
      );
      localStorage.setItem(MANUAL_BUDGET_STORAGE_KEY, JSON.stringify(filteredEntries));
      console.log(`Manual budget entry removed: ${customer} - ${item}`);
    } catch (error) {
      console.error('Error removing manual budget entry:', error);
    }
  }

  // Get manual entries by user
  static getManualEntriesByUser(username: string): ManualBudgetEntry[] {
    try {
      const entries = this.getAllManualEntries();
      return entries.filter(entry => entry.modifiedBy === username);
    } catch (error) {
      console.error('Error retrieving manual budget entries by user:', error);
      return [];
    }
  }

  // Clear all manual entries (admin function)
  static clearAllManualEntries(): void {
    try {
      localStorage.removeItem(MANUAL_BUDGET_STORAGE_KEY);
      console.log('All manual budget entries cleared');
    } catch (error) {
      console.error('Error clearing manual budget entries:', error);
    }
  }

  // Export manual entries for backup
  static exportManualEntries(): string {
    try {
      const entries = this.getAllManualEntries();
      return JSON.stringify(entries, null, 2);
    } catch (error) {
      console.error('Error exporting manual budget entries:', error);
      return '[]';
    }
  }

  // Import manual entries from backup
  static importManualEntries(jsonData: string): boolean {
    try {
      const entries = JSON.parse(jsonData);
      if (Array.isArray(entries)) {
        localStorage.setItem(MANUAL_BUDGET_STORAGE_KEY, jsonData);
        console.log(`Imported ${entries.length} manual budget entries`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing manual budget entries:', error);
      return false;
    }
  }

  // Get summary statistics
  static getSummaryStats(): {
    totalEntries: number;
    totalBudgetValue: number;
    userEntries: { [username: string]: number };
    lastModified: string;
  } {
    try {
      const entries = this.getAllManualEntries();
      const totalBudgetValue = entries.reduce((sum, entry) => sum + entry.budget2026, 0);
      
      const userEntries: { [username: string]: number } = {};
      entries.forEach(entry => {
        userEntries[entry.modifiedBy] = (userEntries[entry.modifiedBy] || 0) + 1;
      });

      const lastModified = entries.length > 0 
        ? Math.max(...entries.map(entry => new Date(entry.lastModified).getTime()))
        : 0;

      return {
        totalEntries: entries.length,
        totalBudgetValue,
        userEntries,
        lastModified: lastModified > 0 ? new Date(lastModified).toISOString() : ''
      };
    } catch (error) {
      console.error('Error getting summary stats:', error);
      return {
        totalEntries: 0,
        totalBudgetValue: 0,
        userEntries: {},
        lastModified: ''
      };
    }
  }
}

export default ManualBudgetPersistence;
