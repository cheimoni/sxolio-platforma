/**
 * AI STARTUP SCRIPT
 * 
 * Αυτό το script τρέχει αυτόματα όταν ένα AI assistant ξεκινάει να δουλεύει με το project.
 * Φορτώνει το project_info.json και παρέχει context στο AI.
 */

const fs = require('fs');
const path = require('path');

class AIProjectLoader {
  constructor() {
    this.projectInfoPath = path.join(__dirname, '..', 'project_info.json');
    this.projectInfo = null;
    this.loadTimestamp = new Date().toISOString();
  }

  /**
   * Φορτώνει το project_info.json
   */
  loadProjectInfo() {
    try {
      const fileContent = fs.readFileSync(this.projectInfoPath, 'utf8');
      this.projectInfo = JSON.parse(fileContent);
      
      console.log('✅ Project Info Loaded Successfully');
      console.log(`📅 Last Updated: ${this.projectInfo.project_metadata.last_updated}`);
      console.log(`📦 Project: ${this.projectInfo.project_metadata.name}`);
      console.log(`🔢 Total Modules: ${this.projectInfo.statistics.total.major_modules}`);
      console.log(`✨ Total Features: ${this.projectInfo.statistics.total.individual_features}`);
      
      return this.projectInfo;
    } catch (error) {
      console.error('❌ Error loading project_info.json:', error.message);
      return null;
    }
  }

  /**
   * Επιστρέφει summary για το AI
   */
  getProjectSummary() {
    if (!this.projectInfo) {
      this.loadProjectInfo();
    }

    if (!this.projectInfo) {
      return {
        error: 'Could not load project information'
      };
    }

    return {
      project_name: this.projectInfo.project_metadata.name,
      version: this.projectInfo.project_metadata.version,
      last_updated: this.projectInfo.project_metadata.last_updated,
      systems: this.projectInfo.project_structure.main_systems.map(s => ({
        name: s.name,
        path: s.path,
        type: s.type
      })),
      total_modules: this.projectInfo.statistics.total.major_modules,
      total_features: this.projectInfo.statistics.total.individual_features,
      user_roles: Object.keys(this.projectInfo.user_roles).length,
      database_collections: this.projectInfo.database_collections.length,
      load_timestamp: this.loadTimestamp
    };
  }

  /**
   * Επιστρέφει module-specific info
   */
  getModuleInfo(moduleId) {
    if (!this.projectInfo) {
      this.loadProjectInfo();
    }

    if (!this.projectInfo) return null;

    // Search in School Platform modules
    const spModule = this.projectInfo.school_platform_modules.find(m => m.id === moduleId);
    if (spModule) return spModule;

    // Search in Anaplirosis modules
    const anModule = this.projectInfo.anaplirosis_modules.find(m => m.id === moduleId);
    if (anModule) return anModule;

    return null;
  }

  /**
   * Επιστρέφει permissions για role
   */
  getRolePermissions(role) {
    if (!this.projectInfo) {
      this.loadProjectInfo();
    }

    if (!this.projectInfo) return null;

    return this.projectInfo.user_roles[role]?.permissions || null;
  }
}

// Auto-execute if run directly
if (require.main === module) {
  const loader = new AIProjectLoader();
  const info = loader.loadProjectInfo();
  
  if (info) {
    console.log('\n📋 PROJECT SUMMARY:');
    console.log(JSON.stringify(loader.getProjectSummary(), null, 2));
  }
}

module.exports = AIProjectLoader;

