import { database } from './config';
import { ref, set, get, update } from 'firebase/database';

/**
 * Υπολογισμός εβδομάδας του έτους από ημερομηνία
 */
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

/**
 * Αποθήκευση αναπληρώσεων για συγκεκριμένη ημέρα
 * @param {Date} date - Η ημερομηνία
 * @param {Array} absenceData - Τα δεδομένα απουσιών με τις αναπληρώσεις
 */
export const saveReplacementsForDay = async (date, absenceData) => {
  try {
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const weekNumber = getWeekNumber(date);
    
    // Συλλογή αναπληρώσεων ανά καθηγητή
    const replacementsByTeacher = {};
    
    absenceData.forEach(teacher => {
      // Ensure teacher has absentTeacher field
      const absentTeacherName = teacher.absentTeacher || teacher.καθηγητής;
      if (!absentTeacherName) {
        console.warn('⚠️ Teacher missing absentTeacher field:', teacher);
        return; // Skip this teacher if no name
      }
      
      if (!teacher.periods || !Array.isArray(teacher.periods)) {
        console.warn('⚠️ Teacher missing periods array:', teacher);
        return; // Skip if no periods
      }
      
      teacher.periods.forEach(period => {
        if (!period) return; // Skip null/undefined periods
        
        if (period.replacement && 
            period.replacement !== 'ΑΝΑΠΛΗΡΩΤΗΣ' && 
            period.replacement !== '///////////////') {
          
          const replacementTeacher = period.replacement.trim();
          if (!replacementTeacher) return; // Skip empty replacements
          
          if (!replacementsByTeacher[replacementTeacher]) {
            replacementsByTeacher[replacementTeacher] = {
              count: 0,
              periods: []
            };
          }
          
          replacementsByTeacher[replacementTeacher].count++;
          replacementsByTeacher[replacementTeacher].periods.push({
            period: period.period || '',
            absentTeacher: absentTeacherName,
            subject: period.subject || '',
            class: period.class || '',
            date: formattedDate
          });
        }
      });
    });
    
    // Αποθήκευση ημερήσιων αναπληρώσεων
    const dailyPath = `replacements/daily/${formattedDate}`;
    await set(ref(database, dailyPath), {
      date: formattedDate,
      weekNumber: weekNumber,
      replacements: replacementsByTeacher,
      timestamp: Date.now()
    });
    
    // Ενημέρωση εβδομαδιαίων αναπληρώσεων
    await updateWeeklyReplacements(weekNumber, formattedDate, replacementsByTeacher);
    
    console.log('✅ Αναπληρώσεις αποθηκεύτηκαν:', formattedDate);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Σφάλμα αποθήκευσης αναπληρώσεων:', error);
    return { success: false, error };
  }
};

/**
 * Ενημέρωση εβδομαδιαίων αναπληρώσεων
 */
const updateWeeklyReplacements = async (weekNumber, date, dailyReplacements) => {
  try {
    const weeklyPath = `replacements/weekly/${weekNumber}`;
    const weeklyRef = ref(database, weeklyPath);
    
    // Ανάκτηση υπάρχοντων εβδομαδιαίων δεδομένων
    const snapshot = await get(weeklyRef);
    let weeklyData = snapshot.exists() ? snapshot.val() : {
      weekNumber: weekNumber,
      teachers: {},
      totalReplacements: 0
    };
    
    // Ensure teachers object exists
    if (!weeklyData.teachers || typeof weeklyData.teachers !== 'object') {
      weeklyData.teachers = {};
    }
    
    // Ensure weekNumber exists
    if (!weeklyData.weekNumber) {
      weeklyData.weekNumber = weekNumber;
    }
    
    // Ενημέρωση για κάθε καθηγητή
    Object.keys(dailyReplacements).forEach(teacher => {
      if (!teacher) return; // Skip empty keys
      
      if (!weeklyData.teachers[teacher]) {
        weeklyData.teachers[teacher] = {
          totalCount: 0,
          days: {}
        };
      }
      
      // Ensure days object exists
      if (!weeklyData.teachers[teacher].days || typeof weeklyData.teachers[teacher].days !== 'object') {
        weeklyData.teachers[teacher].days = {};
      }
      
      weeklyData.teachers[teacher].days[date] = dailyReplacements[teacher].count;
      
      // Υπολογισμός συνολικών εβδομαδιαίων αναπληρώσεων για τον καθηγητή
      weeklyData.teachers[teacher].totalCount = Object.values(
        weeklyData.teachers[teacher].days
      ).reduce((sum, count) => (sum || 0) + (count || 0), 0);
    });
    
    // Υπολογισμός συνολικών εβδομαδιαίων αναπληρώσεων
    weeklyData.totalReplacements = Object.values(weeklyData.teachers)
      .reduce((sum, teacher) => (sum || 0) + ((teacher && teacher.totalCount) || 0), 0);
    
    weeklyData.lastUpdated = Date.now();
    
    await set(weeklyRef, weeklyData);
    
    console.log('✅ Εβδομαδιαίες αναπληρώσεις ενημερώθηκαν:', weekNumber);
    
  } catch (error) {
    console.error('❌ Σφάλμα ενημέρωσης εβδομαδιαίων:', error);
  }
};

/**
 * Ανάκτηση αναπληρώσεων για συγκεκριμένη ημέρα
 */
export const getReplacementsForDay = async (date) => {
  try {
    const formattedDate = date.toISOString().split('T')[0];
    const dailyPath = `replacements/daily/${formattedDate}`;
    const snapshot = await get(ref(database, dailyPath));
    
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: true, data: null };
    
  } catch (error) {
    console.error('❌ Σφάλμα ανάκτησης ημερήσιων αναπληρώσεων:', error);
    return { success: false, error };
  }
};

/**
 * Ανάκτηση εβδομαδιαίων αναπληρώσεων
 */
export const getWeeklyReplacements = async (date) => {
  try {
    const weekNumber = getWeekNumber(date);
    const weeklyPath = `replacements/weekly/${weekNumber}`;
    const snapshot = await get(ref(database, weeklyPath));
    
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: true, data: null };
    
  } catch (error) {
    console.error('❌ Σφάλμα ανάκτησης εβδομαδιαίων αναπληρώσεων:', error);
    return { success: false, error };
  }
};

/**
 * Ανάκτηση καθηγητών με τις περισσότερες αναπληρώσεις της εβδομάδας
 */
export const getTopReplacersOfWeek = async (date) => {
  try {
    const result = await getWeeklyReplacements(date);
    
    if (result.success && result.data) {
      const teachers = result.data.teachers;
      
      // Μετατροπή σε array και ταξινόμηση
      const sortedTeachers = Object.entries(teachers)
        .map(([name, data]) => ({
          name,
          count: data.totalCount,
          days: data.days
        }))
        .sort((a, b) => b.count - a.count);
      
      return { success: true, data: sortedTeachers };
    }
    
    return { success: true, data: [] };
    
  } catch (error) {
    console.error('❌ Σφάλμα ανάκτησης top replacers:', error);
    return { success: false, error };
  }
};

/**
 * Ανάκτηση συνολικών αναπληρώσεων ανά καθηγητή για όλο το σχολικό έτος
 */
export const getTotalReplacementsByTeacher = async () => {
  try {
    const weeklyPath = 'replacements/weekly';
    const snapshot = await get(ref(database, weeklyPath));
    
    if (!snapshot.exists()) {
      return { success: true, data: {} };
    }
    
    const allWeeks = snapshot.val();
    const totalsByTeacher = {};
    
    // Συγκέντρωση από όλες τις εβδομάδες
    Object.values(allWeeks).forEach(week => {
      Object.entries(week.teachers || {}).forEach(([teacher, data]) => {
        if (!totalsByTeacher[teacher]) {
          totalsByTeacher[teacher] = 0;
        }
        totalsByTeacher[teacher] += data.totalCount;
      });
    });
    
    // Μετατροπή σε sorted array
    const sorted = Object.entries(totalsByTeacher)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    return { success: true, data: sorted };
    
  } catch (error) {
    console.error('❌ Σφάλμα ανάκτησης συνολικών:', error);
    return { success: false, error };
  }
};

/**
 * Ανάκτηση λεπτομερειών αναπληρώσεων για συγκεκριμένο καθηγητή
 */
export const getTeacherReplacementDetails = async (teacherName) => {
  try {
    const dailyPath = 'replacements/daily';
    const snapshot = await get(ref(database, dailyPath));

    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    const allDays = snapshot.val();
    const teacherReplacements = [];

    // Συλλογή από όλες τις ημέρες
    Object.entries(allDays).forEach(([date, dayData]) => {
      const replacements = dayData.replacements?.[teacherName];
      if (replacements && replacements.periods) {
        replacements.periods.forEach(period => {
          teacherReplacements.push({
            date: period.date || date,
            period: period.period,
            absentTeacher: period.absentTeacher,
            subject: period.subject,
            class: period.class || 'N/A'
          });
        });
      }
    });

    // Ταξινόμηση ανά ημερομηνία (πιο πρόσφατες πρώτες)
    teacherReplacements.sort((a, b) => new Date(b.date) - new Date(a.date));

    return { success: true, data: teacherReplacements };

  } catch (error) {
    console.error('❌ Σφάλμα ανάκτησης λεπτομερειών καθηγητή:', error);
    return { success: false, error };
  }
};

export default {
  saveReplacementsForDay,
  getReplacementsForDay,
  getWeeklyReplacements,
  getTopReplacersOfWeek,
  getTotalReplacementsByTeacher,
  getTeacherReplacementDetails
};

