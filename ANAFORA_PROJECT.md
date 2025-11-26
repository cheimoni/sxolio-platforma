# 📋 Αναλυτική Αναφορά - Σχολική Πλατφόρμα

## 🎯 Επισκόπηση Project

Το project αποτελείται από **δύο κύρια συστήματα**:

1. **School Platform** (`school-platform/`) - Web εφαρμογή για διαχείριση σχολείου
2. **Anaplirosis** (`anaplirosis/`) - React εφαρμογή για διαχείριση αναπληρώσεων και ωραρίων

---

## 🏫 PART 1: SCHOOL PLATFORM

### Αρχιτεκτονική
- **Frontend**: Vanilla JavaScript (ES6+)
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **UI Framework**: Custom CSS με modular structure
- **Real-time**: Firebase Firestore listeners

### 🔐 1. ΣΥΣΤΗΜΑ ΑΥΘΕΝΤΙΚΟΠΟΙΗΣΗΣ (Authentication)

#### Λειτουργίες:
- ✅ **Login με Email/Password**
  - Έλεγχος ενεργού λογαριασμού
  - Έλεγχος pending approval
  - User-friendly error messages
  
- ✅ **Εγγραφή Νέου Χρήστη**
  - Δημιουργία λογαριασμού με pending status
  - Αναμονή έγκρισης από admin
  - Αυτόματη αποσύνδεση μετά την εγγραφή
  
- ✅ **Reset Password**
  - Αποστολή email επαναφοράς κωδικού
  
- ✅ **Auth State Management**
  - Real-time tracking συνδεδεμένου χρήστη
  - Auto-fetch user data από Firestore
  - Update last seen timestamp

#### Ρόλοι Χρηστών:
1. **Admin** - Super Admin (Ιδιοκτήτης Πλατφόρμας)
2. **Διευθυντής** - Πλήρη δικαιώματα σχολείου
3. **Βοηθός Διευθυντή Α' (ΒΔΑ)** - Σχεδόν πλήρη δικαιώματα
4. **Βοηθός Διευθυντή (ΒΔ)** - Περιορισμένα δικαιώματα
5. **Καθηγητής** - Βασικά δικαιώματα
6. **Υπεύθυνος Τμήματος (ΥΤ)** - Δικαιώματα τμήματος
7. **Γραμματεία** - Διοικητικά δικαιώματα

---

### 💬 2. ΣΥΣΤΗΜΑ ΜΗΝΥΜΑΤΩΝ (Chat/Messaging)

#### Λειτουργίες:
- ✅ **1-1 Private Chat**
  - Real-time messaging
  - Unread message tracking
  - Message timestamps
  - Online/offline status
  
- ✅ **Group Chats**
  - Δημιουργία ομάδων
  - Προσθήκη/αφαίρεση μελών
  - Group announcements
  
- ✅ **Conversation Management**
  - Λίστα συνομιλιών με τελευταίο μήνυμα
  - Sort by last activity
  - Unread badges
  
- ✅ **Message Features**
  - Text messages
  - File attachments (μέσω Files Service)
  - Message status (sent, delivered, read)
  - Message deletion

#### Technical:
- Firestore collections: `conversations`, `messages`
- Real-time listeners με onSnapshot
- Index management για queries

---

### 📢 3. ΑΝΑΚΟΙΝΩΣΕΙΣ (Announcements)

#### Λειτουργίες:
- ✅ **Δημιουργία Ανακοινώσεων**
  - Target: All users, Teachers only, Admins only
  - Specific user targeting
  - Department targeting (TODO)
  
- ✅ **Viewing Announcements**
  - Filtered by user role
  - Real-time updates
  - Priority sorting
  
- ✅ **Announcement Management**
  - Edit/Delete (μόνο δημιουργός/admin)
  - Pin important announcements
  - Expiration dates

---

### 📁 4. ΔΙΑΧΕΙΡΙΣΗ ΑΡΧΕΙΩΝ (Files Management)

#### Λειτουργίες:
- ✅ **Upload Αρχείων**
  - Multiple file types
  - Firebase Storage integration
  - Progress tracking
  - Metadata storage (category, description)
  
- ✅ **File Categories**
  - Διδακτικό Υλικό
  - Διοικητικά
  - Έντυπα
  - Εγκύκλιοι
  - Άλλα
  
- ✅ **File Operations**
  - Download files
  - Delete files (με permissions)
  - Search by category
  - File preview (για supported types)
  
- ✅ **Permissions**
  - Upload: Teachers, Admins
  - Delete: Only creator or admin

---

### 📅 5. ΗΜΕΡΟΛΟΓΙΟ (Calendar/Events)

#### Λειτουργίες:
- ✅ **Event Management**
  - Δημιουργία events
  - Event types: Meeting, Deadline, Event, Holiday
  - Date range events
  - Recurring events (TODO)
  
- ✅ **Event Viewing**
  - Monthly calendar view
  - Upcoming events list
  - Event details modal
  
- ✅ **Event Features**
  - Color coding by type
  - Reminders
  - Event participants
  - Event attachments

---

### 👥 6. ΔΙΑΧΕΙΡΙΣΗ ΧΡΗΣΤΩΝ (Users Management)

#### Λειτουργίες:
- ✅ **User List**
  - View all users
  - Filter by role
  - Search by name/email
  - User status (active/inactive)
  
- ✅ **User Management** (Admin/Director only)
  - Approve pending users
  - Edit user data
  - Deactivate users
  - Assign roles
  - Assign departments
  
- ✅ **User Profile**
  - Display name, email, role
  - Specialty (για καθηγητές)
  - Departments
  - Phone number
  - Last seen

---

### 🎯 7. ΕΦΗΜΕΡΙΕΣ (Duties)

#### Λειτουργίες:
- ✅ **Duty Types**
  - Πρωινή (07:30-08:15)
  - 1ο Διάλειμμα (09:00-09:15)
  - 2ο Διάλειμμα (10:00-10:15)
  - 3ο Διάλειμμα (11:00-11:15)
  - Μεσημεριανό (12:00-12:30)
  - Απογευματινή (13:30-14:00)
  
- ✅ **Duty Management**
  - Weekly schedule view
  - Assign duties to teachers
  - Edit/Delete duties
  - Teacher-specific duty list
  
- ✅ **Features**
  - Calendar view
  - Real-time updates
  - Duty history

---

### ✅ 8. ΕΡΓΑΣΙΕΣ (Tasks)

#### Λειτουργίες:
- ✅ **Task Creation**
  - Title, description
  - Priority (low, medium, high)
  - Due date
  - Category (general, meeting, deadline, personal)
  - Assignment to users
  
- ✅ **Task Management**
  - Status: pending, in_progress, completed, cancelled
  - Task assignment
  - Task delegation
  - Task completion tracking
  
- ✅ **Task Views**
  - My tasks
  - Tasks I created
  - Tasks assigned to me
  - Filter by status/priority
  - Reminders

---

### 🔄 9. ΑΝΤΙΚΑΤΑΣΤΑΣΕΙΣ (Substitutions)

#### Λειτουργίες:
- ✅ **Substitution Requests**
  - Create substitution request
  - Original teacher info
  - Substitute teacher selection
  - Date, period, subject, classroom
  - Reason and notes
  
- ✅ **Substitution Management**
  - Status: pending, approved, rejected, cancelled
  - Admin approval workflow
  - Processed by tracking
  - Daily substitution view
  
- ✅ **Features**
  - View by date
  - My substitutions (as original or substitute)
  - Substitution calendar

---

### 📊 10. ΨΗΦΟΦΟΡΙΕΣ (Polls)

#### Λειτουργίες:
- ✅ **Poll Creation**
  - Question and description
  - Multiple choice options
  - Allow multiple selections
  - Target audience (all, specific roles)
  - Expiration date
  
- ✅ **Voting**
  - Vote on polls
  - View results (real-time)
  - Anonymous or named voting
  - Vote change (if allowed)
  
- ✅ **Poll Management**
  - Active/Inactive status
  - Close polls manually
  - View all votes
  - Poll statistics

---

### 🚨 11. ΕΚΤΑΚΤΕΣ ΕΙΔΟΠΟΙΗΣΕΙΣ (Alerts)

#### Λειτουργίες:
- ✅ **Alert Types**
  - 🚨 Έκτακτη Ανάγκη
  - ⛈️ Καιρός
  - 📅 Αλλαγή Προγράμματος
  - 🏥 Υγεία
  - 🔒 Ασφάλεια
  - 📢 Γενική
  
- ✅ **Alert Creation** (Admin/Director only)
  - Priority: low, normal, high, critical
  - Target roles
  - Expiration
  - Requires acknowledgment
  
- ✅ **Alert Features**
  - Active alerts display
  - Read tracking
  - Acknowledgment system
  - Push notifications (high priority)
  - Alert history

---

### 📞 12. ΚΛΗΣΕΙΣ (Voice/Video Calls)

#### Λειτουργίες:
- ✅ **WebRTC Integration**
  - Voice calls
  - Video calls
  - High quality audio/video
  - STUN servers for NAT traversal
  
- ✅ **Call Features**
  - Incoming call notifications
  - Call accept/reject
  - Mute/unmute
  - Video on/off
  - Call timer
  - Call history
  
- ✅ **Technical**
  - Peer-to-peer connection
  - ICE candidate exchange
  - Firebase signaling
  - Call state management

---

### 📊 13. DASHBOARD

#### Λειτουργίες:
- ✅ **Statistics Cards**
  - Νέα Μηνύματα
  - Ανακοινώσεις
  - Επόμενα Events
  - Νέα Αρχεία
  
- ✅ **Widgets**
  - School Clock (real-time)
  - Recent Messages
  - Upcoming Events
  - Quick Actions
  
- ✅ **Personalization**
  - Welcome message
  - Role-based content
  - Time-based greetings

---

### ⚙️ 14. ADMIN PANEL

#### Λειτουργίες:
- ✅ **User Management**
  - Approve/reject pending users
  - Edit user roles
  - Activate/deactivate users
  - Bulk operations
  
- ✅ **Platform Settings**
  - School information
  - Schedule settings
  - System configuration
  
- ✅ **Reports & Analytics**
  - User activity
  - Message statistics
  - File usage
  - Event participation

---

### 🕐 15. ΩΡΑΡΙΟ (Schedule)

#### Λειτουργίες:
- ✅ **Schedule Types**
  - Long schedule (Δευτέρα & Πέμπτη - 8 περίοδοι)
  - Short schedule (Τρίτη, Τετάρτη, Παρασκευή - 7 περίοδοι)
  
- ✅ **Period Management**
  - Custom period times
  - Break durations
  - Period labels
  
- ✅ **Schedule Settings**
  - Save custom schedules
  - Apply to school
  - Schedule templates

---

## 🔧 PART 2: ANAPLIROSIS (React Application)

### Αρχιτεκτονική
- **Framework**: React 18
- **State Management**: React Hooks
- **Styling**: CSS Modules
- **Data**: JSON files, Firebase integration
- **Features**: Schedule management, Substitution system

### 🎯 Κύριες Λειτουργίες:

#### 1. **Διαχείριση Ωραρίων**
- Προβολή ωραρίων καθηγητών
- Προβολή ωραρίων τμημάτων
- Προβολή ωραρίων αίθουσων
- Weekly/Daily views

#### 2. **Σύστημα Αναπληρώσεων**
- Smart substitution assignment
- Teacher availability checking
- Automatic replacement suggestions
- Replacement confirmation
- Replacement statistics

#### 3. **Συνδιδασκαλία (Coteaching)**
- Coteaching class management
- Coteaching pair tracking
- Coteaching schedule viewer

#### 4. **Διαχείριση Μαθητών**
- Student lists per class
- Student attendance tracking
- Student group management

#### 5. **Διαχείριση Αιθουσών**
- Available classrooms
- Classroom schedule
- Classroom booking

#### 6. **Smart Scheduler**
- Automatic schedule generation
- Conflict detection
- Optimization algorithms

#### 7. **Period Analysis**
- Period usage statistics
- Teacher workload analysis
- Quota display

#### 8. **UI Components**
- Draggable windows
- Resizable panels
- Theme selector
- Text settings
- School clock widget
- Sticky notes

#### 9. **Firebase Integration**
- Schedule tracking
- Data synchronization
- Analytics

#### 10. **File Management**
- HTML file manager
- PDF processing
- JSON data export/import

---

## 🔒 ΔΙΚΑΙΩΜΑΤΑ ΚΑΙ PERMISSIONS

### Permission Matrix:

| Feature | Admin | Director | ΒΔΑ | ΒΔ | Teacher | ΥΤ | Secretary |
|---------|-------|----------|-----|-----|---------|----|-----------|
| Manage Users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Announce to All | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Announce to Dept | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Manage Groups | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Files | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View All Messages | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Calendar | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| View Reports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Schools | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Platform | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🗂️ ΔΟΜΗ ΒΑΣΗΣ ΔΕΔΟΜΕΝΩΝ (Firestore Collections)

### Collections:

1. **users** - Χρήστες πλατφόρμας
2. **conversations** - Συνομιλίες
3. **messages** - Μηνύματα
4. **announcements** - Ανακοινώσεις
5. **files** - Μεταδεδομένα αρχείων
6. **events** - Events ημερολογίου
7. **duties** - Εφημερίες
8. **tasks** - Εργασίες
9. **substitutions** - Αντικαταστάσεις
10. **polls** - Ψηφοφορίες
11. **alerts** - Έκτακτες ειδοποιήσεις
12. **groups** - Ομάδες χρηστών
13. **scheduleSettings** - Ρυθμίσεις ωραρίου
14. **notifications** - Ειδοποιήσεις

---

## 🎨 UI/UX FEATURES

### Design System:
- **Colors**: Green theme (#16a34a primary)
- **Fonts**: 16 διαθέσιμες γραμματοσειρές (Courier New default)
- **Components**: Cards, Buttons, Modals, Forms
- **Responsive**: Mobile-friendly design
- **Accessibility**: Keyboard navigation, ARIA labels

### Components:
- Sidebar navigation
- Header with user info
- Chat windows
- Modal dialogs
- Toast notifications
- Loading spinners
- School clock widget
- Voice call UI

---

## 🔄 REAL-TIME FEATURES

### Firebase Real-time Listeners:
- ✅ Conversations updates
- ✅ Messages (new messages)
- ✅ Announcements
- ✅ Files (new uploads)
- ✅ Events (calendar updates)
- ✅ Duties (schedule changes)
- ✅ Polls (vote updates)
- ✅ Alerts (new alerts)
- ✅ User presence (online/offline)

---

## 📱 RESPONSIVE DESIGN

- Mobile-first approach
- Breakpoints for tablets/desktops
- Touch-friendly interfaces
- Adaptive layouts

---

## 🔐 ΑΣΦΑΛΕΙΑ

### Firebase Security Rules:
- Authentication required for all operations
- Role-based access control
- User data protection
- File upload restrictions
- Message privacy

---

## 📊 STATISTICS & ANALYTICS

### Tracked Metrics:
- User activity
- Message counts
- File uploads
- Event participation
- Poll votes
- Substitution frequency
- Duty assignments

---

## 🚀 DEPLOYMENT

### School Platform:
- Static files (HTML/CSS/JS)
- Firebase hosting ready
- No build process required

### Anaplirosis:
- React build process
- `npm run build` for production
- Firebase hosting compatible

---

## 📝 TECHNICAL NOTES

### Dependencies:
- Firebase SDK 9.23.0
- WebRTC APIs
- Modern JavaScript (ES6+)

### Browser Support:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

### Performance:
- Lazy loading
- Code splitting (where applicable)
- Optimized Firebase queries
- Caching strategies

---

## 🎯 FUTURE ENHANCEMENTS (TODO)

### Phase 2+ Features:
- [ ] Push notifications (PWA)
- [ ] Mobile apps
- [ ] Advanced reporting
- [ ] Integration with external systems
- [ ] Multi-language support
- [ ] Advanced search
- [ ] Export/Import functionality
- [ ] Backup/restore

---

## 📞 SUPPORT & DOCUMENTATION

### Documentation Files:
- `README.md` - Setup guide
- `FIREBASE_TRACKING_GUIDE.md` - Analytics setup
- `PDF_MERGE_GUIDE.md` - PDF processing
- `CONVERSION_GUIDE.md` - Data conversion

---

## ✅ SUMMARY

Το project είναι μια **πλήρης σχολική πλατφόρμα** που περιλαμβάνει:

1. **15+ major features** στο School Platform
2. **10+ major features** στο Anaplirosis
3. **7 user roles** με διαφορετικά permissions
4. **14+ Firestore collections** για data management
5. **Real-time updates** σε όλα τα features
6. **Modern UI/UX** με responsive design
7. **Firebase integration** για backend services
8. **WebRTC** για voice/video calls

**Συνολικά**: Περισσότερες από **25 διαφορετικές λειτουργίες** που καλύπτουν όλες τις ανάγκες μιας σύγχρονης σχολικής πλατφόρμας.

---

*Τελευταία ενημέρωση: 2025*

