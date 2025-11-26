/**
 * AI CLEANUP & UPDATE SCRIPT
 * 
 * Αυτό το script τρέχει όταν το AI ολοκληρώνει την εργασία.
 * Ενημερώνει το project_info.json με τις αλλαγές που έγιναν.
 */

const fs = require('fs');
const path = require('path');

class AIProjectUpdater {
  constructor() {
    this.projectInfoPath = path.join(__dirname, '..', 'project_info.json');
    this.projectInfo = null;
  }

  /**
   * Φορτώνει το τρέχον project_info.json
   */
  loadProjectInfo() {
    try {
      const fileContent = fs.readFileSync(this.projectInfoPath, 'utf8');
      this.projectInfo = JSON.parse(fileContent);
      return true;
    } catch (error) {
      console.error('❌ Error loading project_info.json:', error.message);
      return false;
    }
  }

  /**
   * Αποθηκεύει το ενημερωμένο project_info.json
   */
  saveProjectInfo() {
    try {
      // Update timestamp
      this.projectInfo.project_metadata.last_updated = new Date().toISOString().split('T')[0];
      
      // Format JSON with proper indentation
      const jsonString = JSON.stringify(this.projectInfo, null, 2);
      
      // Write to file
      fs.writeFileSync(this.projectInfoPath, jsonString, 'utf8');
      
      console.log('✅ Project Info Updated Successfully');
      console.log(`📅 Updated: ${this.projectInfo.project_metadata.last_updated}`);
      
      return true;
    } catch (error) {
      console.error('❌ Error saving project_info.json:', error.message);
      return false;
    }
  }

  /**
   * Προσθέτει change note
   */
  addChangeNote(note) {
    if (!this.projectInfo) {
      if (!this.loadProjectInfo()) return false;
    }

    if (!this.projectInfo.important_notes.latest_changes) {
      this.projectInfo.important_notes.latest_changes = [];
    }

    const timestamp = new Date().toISOString();
    this.projectInfo.important_notes.latest_changes.unshift({
      timestamp: timestamp,
      note: note
    });

    // Keep only last 10 changes
    if (this.projectInfo.important_notes.latest_changes.length > 10) {
      this.projectInfo.important_notes.latest_changes = 
        this.projectInfo.important_notes.latest_changes.slice(0, 10);
    }

    return true;
  }

  /**
   * Ενημερώνει feature σε module
   */
  updateModuleFeature(moduleId, system, action, featureName) {
    if (!this.projectInfo) {
      if (!this.loadProjectInfo()) return false;
    }

    const modules = system === 'school_platform' 
      ? this.projectInfo.school_platform_modules
      : this.projectInfo.anaplirosis_modules;

    const module = modules.find(m => m.id === moduleId);
    if (!module) {
      console.warn(`⚠️ Module ${moduleId} not found in ${system}`);
      return false;
    }

    if (!module.features) {
      module.features = [];
    }

    if (action === 'add') {
      if (!module.features.includes(featureName)) {
        module.features.push(featureName);
        this.addChangeNote(`Added feature "${featureName}" to ${module.name} (${system})`);
      }
    } else if (action === 'remove') {
      module.features = module.features.filter(f => f !== featureName);
      this.addChangeNote(`Removed feature "${featureName}" from ${module.name} (${system})`);
    }

    return true;
  }

  /**
   * Ενημερώνει statistics
   */
  updateStatistics() {
    if (!this.projectInfo) {
      if (!this.loadProjectInfo()) return false;
    }

    // Count features
    const spFeatures = this.projectInfo.school_platform_modules.reduce(
      (sum, m) => sum + (m.features?.length || 0), 0
    );
    const anFeatures = this.projectInfo.anaplirosis_modules.reduce(
      (sum, m) => sum + (m.features?.length || 0), 0
    );

    this.projectInfo.statistics.school_platform.individual_features = spFeatures;
    this.projectInfo.statistics.anaplirosis.individual_features = anFeatures;
    this.projectInfo.statistics.total.individual_features = spFeatures + anFeatures;

    return true;
  }

  /**
   * Main update function - καλείται στο τέλος της εργασίας
   */
  finalizeChanges(changes = []) {
    if (!this.loadProjectInfo()) {
      return false;
    }

    // Add all change notes
    changes.forEach(change => {
      this.addChangeNote(change);
    });

    // Update statistics
    this.updateStatistics();

    // Save
    return this.saveProjectInfo();
  }
}

// Auto-execute example
if (require.main === module) {
  const updater = new AIProjectUpdater();
  
  // Example: Record changes
  updater.finalizeChanges([
    'Updated authentication service',
    'Added new feature to messaging system'
  ]);
}

module.exports = AIProjectUpdater;

