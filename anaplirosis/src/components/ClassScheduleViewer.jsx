import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Book, School, Users } from 'lucide-react';

const ClassScheduleViewer = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [selectedClass, setSelectedClass] = useState('Α11');
  const [selectedDay, setSelectedDay] = useState('Δευτέρα');
  const [viewMode, setViewMode] = useState('single'); // 'single', 'week', 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGroupTabs, setActiveGroupTabs] = useState({}); // For switching between groups in coteaching per period

  // Helper function για τον αριθμό περιόδων ανά ημέρα
  const getDayPeriodCount = (dayName) => {
    const daysWith8Periods = ['Δευτέρα', 'Τρίτη', 'Πέμπτη'];
    return daysWith8Periods.includes(dayName) ? 8 : 7;
  };

  // Build class schedule helper function - merges data from teachers, students, classrooms, and coteaching groups
  const buildClassSchedule = async (teachers, students, classrooms, className, groupsData) => {
    const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];
    const searchClassNameUpper = className.toUpperCase().trim();

    const schedule = {
      'Δευτέρα': {},
      'Τρίτη': {},
      'Τετάρτη': {},
      'Πέμπτη': {},
      'Παρασκευή': {}
    };

    // First, collect data from teachers
    const teacherData = {};
    teachers.forEach(teacher => {
      const teacherName = teacher['Καθηγητής'] || teacher['καθηγητής'];
      if (!teacherName) return;

      const programa = teacher['Πρόγραμμα'] || teacher['πρόγραμμα'] || teacher['Μαθήματα'];
      if (!programa) return;

      days.forEach(day => {
        const maxPeriods = getDayPeriodCount(day);
        const daySchedule = programa[day];
        if (daySchedule) {
          for (let period = 1; period <= maxPeriods; period++) {
            const subject = daySchedule[period.toString()];
            if (subject && subject.trim() !== '-') {
              const subjectUpper = subject.toUpperCase().trim();
              let matches = false;

              if (searchClassNameUpper.includes('+')) {
                const parts = searchClassNameUpper.split('+');
                matches = parts.every(part => subjectUpper.includes(part));
              } else {
                const patterns = [
                  new RegExp(`^${searchClassNameUpper}[\\s_+]`, 'i'),
                  new RegExp(`[\\s+]${searchClassNameUpper}[\\s_+]`, 'i'),
                  new RegExp(`Γυμ${searchClassNameUpper}[\\s_+]`, 'i'),
                ];
                matches = patterns.some(pattern => pattern.test(subjectUpper));
              }

              if (matches) {
                const key = `${day}-${period}`;
                if (!teacherData[key]) teacherData[key] = [];
                teacherData[key].push({ teacher: teacherName, subject: subject });
              }
            }
          }
        }
      });
    });

    // Second, collect data from students - track both unified and split groups
    const studentData = {};
    const studentGroupData = {}; // Track split groups (coteaching/electives)

    if (students && students.length > 0) {
      const classStudents = students.filter(s => {
        const kategoria = s['Κατηγορία'] || '';
        return kategoria.includes(`(${className})`);
      });

      const uniqueStudents = [...new Set(classStudents.map(s => s['Κατηγορία']))];

      days.forEach(day => {
        for (let period = 1; period <= 8; period++) {
          const key = `${day}-${period}`;
          const subjectsInPeriod = new Map();

          uniqueStudents.forEach(studentId => {
            const studentRecords = students.filter(s => s['Κατηγορία'] === studentId);
            const periodRecord = studentRecords.find(r => r[''] === period.toString());

            if (periodRecord && periodRecord[day]) {
              const subject = periodRecord[day].trim();
              if (subject) {
                if (!subjectsInPeriod.has(subject)) {
                  subjectsInPeriod.set(subject, 0);
                }
                subjectsInPeriod.set(subject, subjectsInPeriod.get(subject) + 1);
              }
            }
          });

          if (subjectsInPeriod.size === 1) {
            const subject = Array.from(subjectsInPeriod.keys())[0];
            if (subject.toUpperCase().includes(searchClassNameUpper)) {
              studentData[key] = subject;
            }
          } else if (subjectsInPeriod.size > 1) {
            studentGroupData[key] = Array.from(subjectsInPeriod.entries()).map(([subject, count]) => ({
              subject: subject,
              studentCount: count
            }));
          }
        }
      });
    }

    // Enhanced: Add coteaching groups data from JSON files
    const groupsEnhancedData = {};
    if (groupsData && groupsData.groups) {
      groupsData.groups.forEach(group => {
        if (group.title && group.τμήματα) {
          const titleParts = group.title.split('_');
          if (titleParts.length >= 2) {
            const groupDepartments = group.τμήματα || [];
            const matchesDept = groupDepartments.some(dept =>
              dept.toUpperCase() === searchClassNameUpper
            );

            if (matchesDept) {
              // Parse the title to extract info (e.g., "Α11_ΠΤ_Π")
              const groupInfo = {
                departments: groupDepartments,
                title: group.title,
                memberCount: group.members?.length || 0
              };

              // Store this group info to be used when rendering
              // This will be used to enhance the display
              const groupKey = group.title;
              groupsEnhancedData[groupKey] = groupInfo;
            }
          }
        }
      });
    }

    // Third, collect data from classrooms
    const classroomData = {};
    if (classrooms && classrooms.length > 0) {
      days.forEach(day => {
        for (let period = 1; period <= 8; period++) {
          const classroomRecords = classrooms.filter(c => c[''] === period.toString());
          classroomRecords.forEach(record => {
            if (record[day]) {
              const entry = record[day];
              if (entry && entry.toUpperCase().includes(searchClassNameUpper)) {
                const key = `${day}-${period}`;
                const roomName = record['Κατηγορία'];
                if (!classroomData[key]) classroomData[key] = [];
                classroomData[key].push({ room: roomName, entry: entry });
              }
            }
          });
        }
      });
    }

    // Now merge all three sources
    days.forEach(day => {
      const maxPeriods = getDayPeriodCount(day);
      for (let period = 1; period <= maxPeriods; period++) {
        const key = `${day}-${period}`;

        if (teacherData[key]) {
          if (!schedule[day][period.toString()]) {
            schedule[day][period.toString()] = [];
          }

          teacherData[key].forEach(item => {
            const classroomInfo = classroomData[key];
            let room = 'Άγνωστη αίθουσα';

            if (classroomInfo && classroomInfo.length > 0) {
              const matchingClassroom = classroomInfo.find(c =>
                c.entry.toUpperCase().includes(searchClassNameUpper)
              );
              if (matchingClassroom) {
                room = matchingClassroom.room;
              } else if (classroomInfo.length === 1) {
                room = classroomInfo[0].room;
              }
            }

            // Check if this matches a coteaching group
            const matchingGroup = Object.values(groupsEnhancedData).find(g =>
              item.subject.includes(g.title.split('_')[0]) // Match department part
            );

            schedule[day][period.toString()].push({
              ...item,
              room: room,
              groupInfo: matchingGroup // Add group info if available
            });
          });
        } else if (studentGroupData[key]) {
          if (!schedule[day][period.toString()]) {
            schedule[day][period.toString()] = [];
          }

          studentGroupData[key].forEach(group => {
            let room = 'Άγνωστη αίθουσα';
            const roomMatch = group.subject.match(/([A-ZΑ-Ω][0-9]{3}|[A-ZΑ-Ω]{2,}[0-9]{1,3}|Γηπ[0-9])/);
            if (roomMatch) {
              room = roomMatch[0];
            }

            schedule[day][period.toString()].push({
              teacher: 'Συνδιδασκαλία',
              subject: group.subject,
              room: room,
              studentCount: group.studentCount,
              isGroup: true
            });
          });
        } else if (studentData[key] || classroomData[key]) {
          const subject = studentData[key];
          const classroomInfo = classroomData[key];
          const room = classroomInfo && classroomInfo.length > 0 ? classroomInfo[0].room : 'Άγνωστη αίθουσα';

          if (!schedule[day][period.toString()]) {
            schedule[day][period.toString()] = [];
          }
          schedule[day][period.toString()].push({
            teacher: 'Άγνωστος',
            subject: subject || (classroomInfo && classroomInfo[0] ? classroomInfo[0].entry : ''),
            room: room
          });
        }
      }
    });

    // Convert arrays to formatted strings and mark coteaching
    days.forEach(day => {
      for (let period = 1; period <= 8; period++) {
        const periodData = schedule[day][period.toString()];
        if (Array.isArray(periodData) && periodData.length > 0) {
          if (periodData.length > 1) {
            const hasGroups = periodData.some(item => item.isGroup);
            schedule[day][period.toString()] = {
              groups: periodData.map(item => ({
                subject: item.subject,
                teacher: item.teacher || 'Συνδιδασκαλία',
                room: item.room,
                studentCount: item.studentCount,
                isGroup: item.isGroup
              })),
              isCoteaching: true,
              isGroupSplit: hasGroups
            };
          } else {
            const item = periodData[0];
            if (item.isGroup) {
              schedule[day][period.toString()] = `${item.subject}\n(${item.studentCount} μαθητές)\nΑίθουσα: ${item.room}`;
            } else {
              schedule[day][period.toString()] = `${item.subject}\n(${item.teacher})\nΑίθουσα: ${item.room}`;
            }
          }
        } else {
          schedule[day][period.toString()] = '';
        }
      }
    });

    return schedule;
  };

  // Load schedule data from JSON files
  useEffect(() => {
    const loadScheduleData = async () => {
      try {
        const [teachersRes, studentsRes, classroomsRes, coteachingRes, allClassesRes, groupsARes, groupsBRes, groupsCRes] = await Promise.all([
          fetch('/teachers.json'),
          fetch('/mathites-schedule.json'),
          fetch('/classrooms-schedule.json'),
          fetch('/coteaching-classes.json'),
          fetch('/all-classes.json'),
          fetch('/Συνδιδασκαλία_Α_Τάξη.json'),
          fetch('/Συνδιδασκαλία_Β_Τάξη.json'),
          fetch('/Συνδιδασκαλία_Γ_Τάξη.json')
        ]);

        const [teachers, students, classrooms, coteachingClasses, allClassesData, groupsA, groupsB, groupsC] = await Promise.all([
          teachersRes.json(),
          studentsRes.json(),
          classroomsRes.json(),
          coteachingRes.json(),
          allClassesRes.json(),
          groupsARes.json(),
          groupsBRes.json(),
          groupsCRes.json()
        ]);

        const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή"];
        const periods = [1, 2, 3, 4, 5, 6, 7, 8];

        const classesSet = new Set();
        const schedule = {};

        // Add ALL regular classes from all-classes.json
        allClassesData.regular.forEach(className => classesSet.add(className));

        // Add ALL support classes (Στήριξη) from all-classes.json
        allClassesData.support.forEach(className => classesSet.add(className));

        // Add ALL coteaching classes
        coteachingClasses.forEach(cotClass => {
          classesSet.add(cotClass.className);
        });

        // Sort all classes
        const classes = Array.from(classesSet).sort((a, b) => {
          return a.localeCompare(b, 'el');
        });

        console.log(`📚 Total classes loaded: ${classes.length}`);
        console.log(`   - Regular: ${allClassesData.regular.length}`);
        console.log(`   - Support (Στήριξη): ${allClassesData.support.length}`);
        console.log(`   - Coteaching (Συνδιδασκαλία): ${coteachingClasses.length}`);

        // Combine all groups data
        const allGroups = {
          A: groupsA,
          B: groupsB,
          C: groupsC
        };

        // Build schedule for each class
        for (const className of classes) {
          // Check if this is a coteaching class
          const cotClass = coteachingClasses.find(c => c.className === className);

          if (cotClass) {
            // Use pre-built coteaching schedule
            const builtSchedule = {
              'Δευτέρα': {},
              'Τρίτη': {},
              'Τετάρτη': {},
              'Πέμπτη': {},
              'Παρασκευή': {}
            };

            days.forEach(day => {
              if (cotClass.schedule[day]) {
                Object.keys(cotClass.schedule[day]).forEach(period => {
                  const periodData = cotClass.schedule[day][period];
                  if (periodData && periodData.length > 0) {
                    const item = periodData[0];
                    builtSchedule[day][period] = `${item.subject}\n(${item.teacher})`;
                  }
                });
              }
            });

            schedule[className] = builtSchedule;
          } else {
            // Build schedule for regular class
            const classLevel = className.charAt(0).toUpperCase();
            const groupsForClass = allGroups[classLevel];
            schedule[className] = await buildClassSchedule(teachers, students, classrooms, className, groupsForClass);
          }
        }

        setScheduleData({
          classes,
          schedule,
          days,
          periods,
          coteachingClasses,  // Πλήρη στοιχεία συνδιδασκαλιών
          groupsData: { A: groupsA, B: groupsB, C: groupsC }
        });
      } catch (error) {
        console.error('Σφάλμα φόρτωσης δεδομένων:', error);
      }
    };

    loadScheduleData();
  }, []);

  const getSubjectColor = (subject) => {
    const colors = {
      'Μαθηματικά': 'bg-blue-100 text-blue-800 border-blue-200',
      'Νέα Ελληνικά': 'bg-green-100 text-green-800 border-green-200',
      'Αρχαία Ελληνικά': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Ιστορία': 'bg-amber-100 text-amber-800 border-amber-200',
      'Φυσική': 'bg-purple-100 text-purple-800 border-purple-200',
      'Χημεία': 'bg-red-100 text-red-800 border-red-200',
      'Βιολογία': 'bg-lime-100 text-lime-800 border-lime-200',
      'Αγγλικά': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Γαλλικά': 'bg-pink-100 text-pink-800 border-pink-200',
      'Θρησκευτικά': 'bg-orange-100 text-orange-800 border-orange-200',
      'Τέχνη': 'bg-teal-100 text-teal-800 border-teal-200',
      'Μουσική': 'bg-violet-100 text-violet-800 border-violet-200',
      'Φυσική Αγωγή': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Πληροφορική': 'bg-slate-100 text-slate-800 border-slate-200',
      'Οικονομικά': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Σχεδ. & Τεχνολογία': 'bg-gray-100 text-gray-800 border-gray-200',
      'Λογιστική': 'bg-rose-100 text-rose-800 border-rose-200',
      'Εμπορικά-Marketing': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      'Οργάνωση Γραφείου': 'bg-stone-100 text-stone-800 border-stone-200'
    };

    for (const [key, color] of Object.entries(colors)) {
      if (subject.includes(key)) return color;
    }
    return 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const getTimeForPeriod = (period) => {
    const times = {
      1: '07:45-08:35',
      2: '08:35-09:25',
      3: '09:25-10:15',
      4: '10:35-11:25',
      5: '11:25-12:15',
      6: '12:15-13:05',
      7: '13:05-13:55',
      8: '13:55-14:45'
    };
    return times[period] || '';
  };

  const getClassLevel = (classCode) => {
    const level = classCode.charAt(0);
    const levels = {
      'Α': 'Α\' Λυκείου',
      'Β': 'Β\' Λυκείου',
      'Γ': 'Γ\' Λυκείου'
    };
    return levels[level] || 'Άγνωστη Τάξη';
  };

  const filteredClasses = scheduleData ?
    scheduleData.classes.filter(cls =>
      cls.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

  const renderSingleClassView = () => {
    if (!scheduleData) return <div>Φόρτωση...</div>;

    const classSchedule = scheduleData.schedule[selectedClass] || {};

    return (
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-blue-800 flex items-center">
                <School className="mr-3 text-3xl" />
                Ωράριο Τμήματος {selectedClass}
              </h2>
              <p className="text-blue-600 mt-1">{getClassLevel(selectedClass)}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Σχολική Χρονιά 2025-26</div>
              <div className="text-sm text-gray-500">Εβδομαδιαίο Πρόγραμμα</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-6 gap-2 mb-4">
            <div className="font-bold text-center py-3 bg-gray-100 rounded-lg">
              <Clock size={16} className="inline mb-1" />
              <div>Περίοδος</div>
            </div>
            {scheduleData.days.map(day => (
              <div key={day} className="font-bold text-center py-3 bg-gradient-to-b from-blue-100 to-blue-50 rounded-lg text-blue-800">
                {day}
              </div>
            ))}

            {scheduleData.periods.map(period => (
              <React.Fragment key={period}>
                <div className="text-center py-4 bg-gradient-to-b from-blue-50 to-blue-25 rounded-lg border border-blue-200">
                  <div className="text-lg font-bold text-blue-800">{period}η</div>
                  <div className="text-xs text-blue-600 mt-1">{getTimeForPeriod(period)}</div>
                </div>
                {scheduleData.days.map(day => {
                  const subjectData = classSchedule[day]?.[period];

                  // Handle groups with tabs
                  if (typeof subjectData === 'object' && subjectData !== null && 'groups' in subjectData) {
                    const groups = subjectData.groups;
                    const activePeriodTab = activeGroupTabs[`${day}-${period}`] || 0;
                    const activeGroup = groups[activePeriodTab % groups.length] || groups[0];
                    const subject = activeGroup.isGroup
                      ? `${activeGroup.subject}\n(${activeGroup.studentCount} μαθητές)\nΑίθουσα: ${activeGroup.room}`
                      : `${activeGroup.subject}\n(${activeGroup.teacher})\nΑίθουσα: ${activeGroup.room}`;

                    return (
                      <div key={`${day}-${period}`} className="p-3 min-h-[80px] border-2 border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className={`p-3 rounded-lg text-sm font-medium text-center border-2 transition-all hover:scale-105 bg-red-100 text-red-800 border-red-200`}>
                          <div style={{ whiteSpace: 'pre-line' }}>{subject}</div>
                          {groups && groups.length > 1 && (
                            <div className="flex gap-1 mt-2 justify-center">
                              {groups.map((group, idx) => (
                                <button
                                  key={idx}
                                  className={`px-2 py-1 text-xs rounded ${idx === activePeriodTab ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                  onClick={() => setActiveGroupTabs(prev => ({ ...prev, [`${day}-${period}`]: idx }))}
                                >
                                  Ομάδα {idx + 1}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Regular subject (string)
                  const subject = subjectData || '';
                  return (
                    <div key={`${day}-${period}`} className="p-3 min-h-[80px] border-2 border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      {subject ? (
                        <div className={`p-3 rounded-lg text-sm font-medium text-center border-2 transition-all hover:scale-105 ${getSubjectColor(subject)}`}>
                          <div style={{ whiteSpace: 'pre-line' }}>{subject}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 text-center py-6 italic">
                          Ελεύθερη περίοδος
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    if (!scheduleData) return <div>Φόρτωση...</div>;

    return (
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <h2 className="text-2xl font-bold text-green-800 flex items-center">
            <Calendar className="mr-3 text-3xl" />
            Προβολή Ημέρας: {selectedDay}
          </h2>
          <p className="text-green-600 mt-1">Όλα τα τμήματα για {selectedDay}</p>
        </div>

        <div className="p-6 overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-9 gap-2 text-sm">
              <div className="font-bold text-center py-3 bg-gray-100 rounded-lg">
                <Users size={16} className="inline mb-1" />
                <div>Τμήμα</div>
              </div>
              {scheduleData.periods.map(period => (
                <div key={period} className="font-bold text-center py-3 bg-gradient-to-b from-green-100 to-green-50 rounded-lg text-green-800">
                  <div>{period}η περίοδος</div>
                  <div className="text-xs text-green-600 mt-1">{getTimeForPeriod(period)}</div>
                </div>
              ))}

              {filteredClasses.map(classCode => (
                <React.Fragment key={classCode}>
                  <div className="text-center py-4 font-bold bg-gradient-to-b from-blue-50 to-blue-25 rounded-lg text-blue-800 border border-blue-200">
                    <div className="text-lg">{classCode}</div>
                    <div className="text-xs text-blue-600">{getClassLevel(classCode)}</div>
                  </div>
                  {scheduleData.periods.map(period => {
                    const subjectData = scheduleData.schedule[classCode]?.[selectedDay]?.[period];

                    // Handle groups
                    if (typeof subjectData === 'object' && subjectData !== null && 'groups' in subjectData) {
                      const groups = subjectData.groups;
                      const activePeriodTab = activeGroupTabs[`${classCode}-${selectedDay}-${period}`] || 0;
                      const activeGroup = groups[activePeriodTab % groups.length] || groups[0];
                      const subject = activeGroup.isGroup
                        ? activeGroup.subject.split('\n')[0]
                        : activeGroup.subject.split('\n')[0];

                      return (
                        <div key={`${classCode}-${period}`} className="p-2 min-h-[60px] border-2 border-gray-200 rounded-lg">
                          <div className={`p-2 rounded-lg text-xs text-center font-medium border bg-red-100 text-red-800 border-red-200`}>
                            <div>{subject}</div>
                            {groups && groups.length > 1 && (
                              <div className="flex gap-1 mt-1 justify-center">
                                {groups.map((_, idx) => (
                                  <button
                                    key={idx}
                                    className={`w-5 h-5 text-xs rounded-full ${idx === activePeriodTab ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
                                    onClick={() => setActiveGroupTabs(prev => ({ ...prev, [`${classCode}-${selectedDay}-${period}`]: idx }))}
                                  >
                                    {idx + 1}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    const subject = subjectData ? subjectData.split('\n')[0] : '';
                    return (
                      <div key={`${classCode}-${period}`} className="p-2 min-h-[60px] border-2 border-gray-200 rounded-lg">
                        {subject ? (
                          <div className={`p-2 rounded-lg text-xs text-center font-medium border ${getSubjectColor(subject)}`}>
                            {subject}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 text-center py-3 italic">-</div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAllClassesView = () => {
    if (!scheduleData) return <div>Φόρτωση...</div>;

    return (
      <div className="space-y-6">
        {filteredClasses.map(classCode => {
          const classSchedule = scheduleData.schedule[classCode] || {};

          return (
            <div key={classCode} className="bg-white rounded-lg shadow-lg">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b rounded-t-lg">
                <h3 className="text-xl font-bold text-purple-800 flex items-center">
                  <Book className="mr-2" size={20} />
                  Τμήμα {classCode} - {getClassLevel(classCode)}
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-6 gap-1 text-xs">
                  <div className="font-bold text-center py-2 bg-gray-100 rounded">Περίοδος</div>
                  {scheduleData.days.map(day => (
                    <div key={day} className="font-bold text-center py-2 bg-gray-50 rounded text-gray-700">
                      {day}
                    </div>
                  ))}

                  {scheduleData.periods.map(period => (
                    <React.Fragment key={period}>
                      <div className="text-center py-2 bg-blue-50 rounded font-medium text-blue-800">
                        <div>{period}η</div>
                        <div className="text-xs text-blue-600">{getTimeForPeriod(period)}</div>
                      </div>
                      {scheduleData.days.map(day => {
                        const subjectData = classSchedule[day]?.[period];

                        // Handle groups
                        if (typeof subjectData === 'object' && subjectData !== null && 'groups' in subjectData) {
                          const groups = subjectData.groups;
                          const activePeriodTab = activeGroupTabs[`all-${classCode}-${day}-${period}`] || 0;
                          const activeGroup = groups[activePeriodTab % groups.length] || groups[0];
                          const subject = activeGroup.isGroup
                            ? activeGroup.subject.split('\n')[0]
                            : activeGroup.subject.split('\n')[0];

                          return (
                            <div key={`${day}-${period}`} className="p-1 border border-gray-200 rounded min-h-[50px]">
                              <div className={`p-1 rounded text-xs text-center font-medium bg-red-100 text-red-800`}>
                                <div>{subject}</div>
                                {groups && groups.length > 1 && (
                                  <div className="flex gap-1 mt-1 justify-center">
                                    {groups.map((_, idx) => (
                                      <button
                                        key={idx}
                                        className={`w-4 h-4 text-xs rounded-full ${idx === activePeriodTab ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
                                        onClick={() => setActiveGroupTabs(prev => ({ ...prev, [`all-${classCode}-${day}-${period}`]: idx }))}
                                      >
                                        {idx + 1}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }

                        const subject = subjectData ? subjectData.split('\n')[0] : '';
                        return (
                          <div key={`${day}-${period}`} className="p-1 border border-gray-200 rounded min-h-[50px]">
                            {subject ? (
                              <div className={`p-1 rounded text-xs text-center font-medium ${getSubjectColor(subject)}`}>
                                {subject}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 text-center py-2">-</div>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!scheduleData) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center">
          <div className="text-2xl mb-4">⏳</div>
          <div className="text-lg text-gray-600">Φόρτωση ωραρίων...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏫 Σχολικά Ωράρια
          </h1>
          <p className="text-gray-600 text-lg">
            Ωράριο Τμημάτων Α', Β', Γ' Λυκείου - Σχολική Χρονιά 2025-26
          </p>
        </div>

        {/* View Mode Selection */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-200">
            <button
              onClick={() => setViewMode('single')}
              className={`px-6 py-3 rounded-lg transition-all duration-200 ${
                viewMode === 'single'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Book className="inline mr-2" size={18} />
              Ένα Τμήμα
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-6 py-3 rounded-lg transition-all duration-200 ${
                viewMode === 'week'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="inline mr-2" size={18} />
              Μια Μέρα
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-6 py-3 rounded-lg transition-all duration-200 ${
                viewMode === 'all'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="inline mr-2" size={18} />
              Όλα Τμήματα
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          {(viewMode === 'week' || viewMode === 'all') && (
            <div className="flex items-center space-x-2">
              <label className="text-gray-700 font-medium">🔍 Αναζήτηση:</label>
              <input
                type="text"
                placeholder="Αναζήτηση τμήματος..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {viewMode === 'single' && (
            <div className="flex items-center space-x-2">
              <label className="text-gray-700 font-medium">📚 Τμήμα:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {scheduleData.classes.map(classCode => (
                  <option key={classCode} value={classCode}>
                    {classCode} - {getClassLevel(classCode)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'week' && (
            <div className="flex items-center space-x-2">
              <label className="text-gray-700 font-medium">📅 Μέρα:</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {scheduleData.days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Render based on view mode */}
      <div className="overflow-x-auto">
        {viewMode === 'single' && renderSingleClassView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'all' && renderAllClassesView()}
      </div>

      {/* Statistics */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">📊 Στατιστικά Σχολείου</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{scheduleData.classes.length}</div>
            <div className="text-gray-600">Συνολικά Τμήματα</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{scheduleData.days.length}</div>
            <div className="text-gray-600">Ημέρες Εβδομάδας</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{scheduleData.periods.length}</div>
            <div className="text-gray-600">Περίοδοι ανά Ημέρα</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-orange-600">
              {scheduleData.classes.length * scheduleData.days.length * scheduleData.periods.length}
            </div>
            <div className="text-gray-600">Σύνολο Περιόδων</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassScheduleViewer;
