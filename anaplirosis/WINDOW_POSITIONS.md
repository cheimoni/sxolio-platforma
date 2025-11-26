# 📐 Default Θέσεις Παραθύρων - Anaplirosis

Αυτό το αρχείο περιέχει τις **default θέσεις** όλων των παραθύρων στην Anaplirosis.

## 🪟 Draggable Windows

### 1. **MainWindow** (Κύριο Παράθυρο)
- **File**: `src/components/MainWindow.js`
- **Default Position**: 
  - `x: 902`
  - `y: -1`
- **Storage Key**: `mainWindow`
- **Initial Size**: 
  - Width: `Math.min(window.innerWidth - 900, 1200)`
  - Height: `window.innerHeight - 80`
- **Min Size**: 400x300

---

### 2. **NewWindow** (Νέο Παράθυρο - Class Schedule)
- **File**: `src/components/NewWindow.js`
- **Default Position**: 
  - `x: 231`
  - `y: 431`
- **Storage Key**: `newWindow`
- **Initial Size**: 
  - Width: `350`
  - Height: `window.innerHeight - 421 - 80`
- **Min Size**: 280x150

---

### 3. **TeacherScheduleCard** (Κάρτα Προγράμματος Καθηγητή)
- **File**: `src/components/TeacherScheduleCard.js`
- **Default Position**: 
  - `x: 232`
  - `y: 1`
- **Storage Key**: `teacherSchedule`
- **Initial Size**: 
  - Width: `isExpanded ? 320 : 280`
  - Height: `420`
- **Min Size**: 200x200

---

### 4. **TeacherAvailabilityCard** (Κάρτα Διαθεσιμότητας)
- **File**: `src/components/TeacherAvailabilityCard.js`
- **Default Position**: 
  - `x: 557`
  - `y: 1`
- **Storage Key**: `teacherAvailability`
- **Initial Size**: 
  - Width: `isExpanded ? 351 : 311`
  - Height: `420`
- **Min Size**: 200x200

---

### 5. **SwapPanelWindow** (Παράθυρο Ανταλλαγής)
- **File**: `src/components/SwapPanelWindow.js`
- **Default Position**: 
  - `x: centerX` (calculated: `Math.max(20, (window.innerWidth - width) / 2)`)
  - `y: visibleY` (calculated: `window.innerHeight - HEADER_HEIGHT - 5`)
- **Storage Key**: `swapPanel`
- **Initial Size**: 
  - Width: `500`
  - Height: `250`
- **Min Size**: 400x200
- **Note**: Το παράθυρο τοποθετείται στο **κάτω μέρος, κεντραρισμένο**

---

### 6. **ChangesWindow** (Παράθυρο Αλλαγών)
- **File**: `src/components/ChangesWindow.js`
- **Default Position**: 
  - `x: 690`
  - `y: 260`
- **Storage Key**: Δεν έχει (χρησιμοποιεί useState)
- **Initial Size**: 
  - Width: `280`
  - Height: `150`
- **Note**: Δεν χρησιμοποιεί το `useDraggable` hook, έχει custom drag implementation

---

### 7. **ReplacementBadgeWindow** (Badge Αναπληρωτή)
- **File**: `src/components/ReplacementBadgeWindow.js`
- **Default Position**: 
  - `x: initialX` (calculated: `baseX + (index * badgeWidth)`)
    - `baseX = isExpanded ? 533 : 493`
    - `badgeWidth = 150`
  - `y: 430`
- **Storage Key**: Δεν έχει (κάθε badge είναι unique)
- **Initial Size**: 
  - Width: `140`
  - Height: `80`
- **Min Size**: 100x60
- **Note**: 
  - Κάθε badge τοποθετείται **οριζόντια** μετά το προηγούμενο
  - Το `baseX` εξαρτάται από το `isExpanded` state
  - Το `index` καθορίζει την οριζόντια απόσταση

---

### 8. **SmartScheduler** (Έξυπνος Προγραμματιστής)
- **File**: `src/components/SmartScheduler.js`
- **Default Position**: 
  - `x: 557`
  - `y: 431`
- **Storage Key**: `smartScheduler`
- **Initial Size**: 
  - Width: `isExpanded ? 320 : 280`
  - Height: (calculated - extends to bottom of screen)
- **Min Size**: 200x200

---

## 🔒 Fixed/Non-Draggable Windows

### 9. **ThirdWindow**
- **File**: `src/components/ThirdWindow.js`
- **Position**: Fixed (δεν έχει draggable functionality)

### 10. **PeriodAnalysisWindow**
- **File**: `src/components/PeriodAnalysisWindow.js`
- **Position**: Fixed (δεν έχει draggable functionality)

### 11. **QuotaDisplayWindow**
- **File**: `src/components/QuotaDisplayWindow.js`
- **Position**: Fixed (δεν έχει draggable functionality)

---

## 💾 LocalStorage Keys

Οι θέσεις των παραθύρων αποθηκεύονται στο `localStorage` με τα εξής keys:

- `windowPosition_mainWindow`
- `windowPosition_newWindow`
- `windowPosition_teacherSchedule`
- `windowPosition_teacherAvailability`
- `windowPosition_swapPanel`
- `windowPosition_smartScheduler`

**Σημείωση**: Τα `ReplacementBadgeWindow` και `ChangesWindow` δεν αποθηκεύουν θέσεις στο localStorage.

---

## 🔄 Reset Functions

Κάθε draggable window έχει μια `resetPosition()` function που επαναφέρει το παράθυρο στην default θέση:

- `window.resetMainWindowPosition()`
- `window.resetNewWindowPosition()`
- `window.resetTeacherSchedulePosition()`
- `window.resetAvailabilityPosition()`
- `window.resetSmartSchedulerPosition()`

---

## 📊 Visual Layout (Approximate)

```
┌─────────────────────────────────────────────────────────────┐
│ TeacherScheduleCard (232, 1)                                │
│                                                              │
│                    MainWindow (902, -1)                     │
│                                                              │
│ TeacherAvailabilityCard (553, -2)                            │
│                                                              │
│                                                              │
│                                                              │
│                    NewWindow (230, 506)                      │
│                                                              │
│                    ChangesWindow (690, 260)                  │
│                                                              │
│                    ReplacementBadges (baseX + index*150, 430) │
│                                                              │
│                    SwapPanelWindow (center, bottom)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Notes

1. **Negative Y values** (-1, -2) σημαίνουν ότι τα παράθυρα ξεκινούν από την **κορυφή** της οθόνης
2. **Calculated positions** υπολογίζονται δυναμικά βάσει του window size
3. **ReplacementBadgeWindow** positions εξαρτώνται από το `isExpanded` state και το `index`
4. **SwapPanelWindow** είναι πάντα κεντραρισμένο στο κάτω μέρος

---

**Τελευταία ενημέρωση**: 2025-01-27

