// @FILE-INFO: data.js | src/data.js
// TYPE: Helper Functions
// LAYER: Business (Logic)
// SIZE: 140 lines (High)
// PROVIDES: classes, allStudents
// UPDATED: 2025-2026 School Year Data

const emojis = [
  '🌟', '⚡', '🎯', '🚀', '🎨', '🌈', '🎪', '🎭', '🎊', '🎮', '🎲', '💡', '📚', '🔬', '🔭',
  '🎵', '⚽', '🏀', '🏆', '🏅', '🥇', '🥈', '🥉', '🌍', '🌞', '⭐', '✨', '🔥', '💧', '🌱',
  '🌴', '🍎', '🍓', '🍉', '🥑', '🥦', '🥕', '🌶️', '🍕', '🍔', '🍟', '🍿', '🎹', '🎸', '🎻'
];

let emojiIndex = 0;
const getEmoji = () => {
  const emoji = emojis[emojiIndex % emojis.length];
  emojiIndex++;
  return emoji;
};

export const classes = {
  "A11": [
    { id: 1, am: '1286104', lastName: 'ΓΑΒΡΙΛΙΔΟΥ', firstName: 'ΚΩΝΣΤΑΝΤΙΝΑ', class: 'A11', emoji: getEmoji() },
    { id: 2, am: '1537804', lastName: 'ΓΕΩΡΓΙΟΥ', firstName: 'ΣΟΦΙΑ', class: 'A11', emoji: getEmoji() },
    { id: 3, am: '1615204', lastName: 'ΕΥΑΓΓΕΛΟΥ', firstName: 'ΣΤΥΛΙΑΝΑ', class: 'A11', emoji: getEmoji() },
    { id: 4, am: '1517404', lastName: 'ΙΩΑΝΝΟΥ', firstName: 'ΕΛΕΝΗ', class: 'A11', emoji: getEmoji() },
    { id: 5, am: '1236404', lastName: 'ΚΕΛΛΑΣ', firstName: 'ΜΙΧΑΗΛ', class: 'A11', emoji: getEmoji() },
    { id: 6, am: '1281104', lastName: 'ΜΙΧΑΗΛ', firstName: 'ΠΑΥΛΙΝΑ', class: 'A11', emoji: getEmoji() },
    { id: 7, am: '1581204', lastName: 'ΝΤΙΖΑΙ', firstName: 'ΚΑΤΕΡΙΝΑ', class: 'A11', emoji: getEmoji() },
    { id: 8, am: '1309704', lastName: 'ΠΑΝΑΓΗ', firstName: 'ΜΑΡΙΑ', class: 'A11', emoji: getEmoji() },
    { id: 9, am: '1117404', lastName: 'ΣΤΑΥΡΟΥ', firstName: 'ΕΛΕΝΗ', class: 'A11', emoji: getEmoji() },
    { id: 10, am: '1076704', lastName: 'ΤΣΑΓΓΑΡΙΔΟΥ', firstName: 'ΣΤΑΥΡΟΥΛΛΑ', class: 'A11', emoji: getEmoji() },
    { id: 11, am: '1526004', lastName: 'ΤΥΛΛΗΡΟΥ', firstName: 'ΜΙΚΑΕΛΛΑ', class: 'A11', emoji: getEmoji() },
    { id: 12, am: '1506804', lastName: 'ΦΙΛΑΡΕΤΟΥ', firstName: 'ΔΗΜΗΤΡΑ', class: 'A11', emoji: getEmoji() },
    { id: 13, am: '1494704', lastName: 'ΦΟΥΤΑ', firstName: 'ΔΟΝΑ', class: 'A11', emoji: getEmoji() },
    { id: 14, am: '1718104', lastName: 'ΧΑΡΑΛΑΜΠΟΥΣ', firstName: 'ΣΤΥΛΙΑΝΑ', class: 'A11', emoji: getEmoji() },
    { id: 15, am: '1225404', lastName: 'ΧΟΓΛΑΣΤΟΥ', firstName: 'ΙΦΙΓΕΝΕΙΑ', class: 'A11', emoji: getEmoji() },
    { id: 16, am: '1047504', lastName: 'ΧΡΙΣΤΟΔΟΥΛΟΥ', firstName: 'ΤΖΩΡΤΖΙΑΝΑ', class: 'A11', emoji: getEmoji() }
  ],
  "A24": [
    { id: 19, am: '1159904', lastName: 'ΑΝΤΩΝΙΟΥ', firstName: 'ΓΕΩΡΓΙΟΣ', class: 'A24', emoji: getEmoji() },
    { id: 20, am: '1257904', lastName: 'ΓΙΑΛΛΟΥΡΗ', firstName: 'ΕΙΡΗΝΗ', class: 'A24', emoji: getEmoji() },
    { id: 21, am: '1387904', lastName: 'ΘΕΟΔΟΤΟΥ', firstName: 'ΑΛΕΞΑΝΔΡΟΣ', class: 'A24', emoji: getEmoji() },
    { id: 22, am: '1438504', lastName: 'ΘΕΟΦΑΝΙΔΟΥ', firstName: 'ΑΝΝΑ', class: 'A24', emoji: getEmoji() },
    { id: 23, am: '1569004', lastName: 'ΚΥΡΙΑΚΟΥ', firstName: 'ΕΥΤΥΧΙΑ', class: 'A24', emoji: getEmoji() },
    { id: 24, am: '1467304', lastName: 'ΚΥΡΙΑΚΟΥ', firstName: 'ΝΙΚΟΛΑΣ', class: 'A24', emoji: getEmoji() },
    { id: 25, am: '1304304', lastName: 'ΜΕΝΕΛΑΟΥ', firstName: 'ΜΑΡΙΟΣ ΑΝΔΡΕΑΣ', class: 'A24', emoji: getEmoji() },
    { id: 26, am: '1395104', lastName: 'ΟΔΥΣΣΕΩΣ', firstName: 'ΑΓΓΕΛΙΚΗ', class: 'A24', emoji: getEmoji() },
    { id: 27, am: '1403704', lastName: 'ΠΑΝΑΓΗ', firstName: 'ΑΝΑΣΤΑΣΙΑ', class: 'A24', emoji: getEmoji() },
    { id: 28, am: '1121504', lastName: 'ΠΕΤΡΟΥ', firstName: 'ΧΡΥΣΗΛΙΑ', class: 'A24', emoji: getEmoji() },
    { id: 29, am: '1499105', lastName: 'ΣΤΥΛΙΑΝΟΥ', firstName: 'ΕΒΙΤΑ', class: 'A24', emoji: getEmoji() },
    { id: 30, am: '1159104', lastName: 'ΣΤΥΛΙΑΝΟΥ', firstName: 'ΜΑΡΙΛΙΑ', class: 'A24', emoji: getEmoji() },
    { id: 31, am: '1262504', lastName: 'ΤΖΙΑΚΟΥΡΗΣ', firstName: 'ΡΑΦΑΗΛ', class: 'A24', emoji: getEmoji() },
    { id: 32, am: '1411304', lastName: 'ΧΑΡΑΛΑΜΠΟΥΣ', firstName: 'ΣΤΥΛΙΑΝΟΣ', class: 'A24', emoji: getEmoji() },
    { id: 33, am: '1188604', lastName: 'ΧΡΙΣΤΟΔΟΥΛΟΥ', firstName: 'ΔΗΜΗΤΡΗΣ', class: 'A24', emoji: getEmoji() },
    { id: 34, am: '1157704', lastName: 'ΧΡΙΣΤΟΔΟΥΛΟΥ', firstName: 'ΕΡΜΟΓΕΝΗΣ', class: 'A24', emoji: getEmoji() }
  ],
  "Γκατ_1 ΕΙΚ_κατ (Γ)": [
    { id: 35, am: '6665', lastName: 'ΑΡΙΣΤΕΙΔΟΥ', firstName: 'ΚΥΒΕΛΗ', class: 'Γκατ_1 ΕΙΚ_κατ (Γ)', emoji: getEmoji() },
    { id: 36, am: '6765', lastName: 'ΖΙΠΙΤΗ', firstName: 'ΣΤΕΦΑΝΟΣ', class: 'Γκατ_1 ΕΙΚ_κατ (Γ)', emoji: getEmoji() },
    { id: 37, am: '6683', lastName: 'ΚΑΠΛΑΝΙΟΥ', firstName: 'ΡΑΦΑΕΛΑ', class: 'Γκατ_1 ΕΙΚ_κατ (Γ)', emoji: getEmoji() },
    { id: 38, am: '6663', lastName: 'KEPPY', firstName: 'ΑΝΤΡΙΑΝΑ', class: 'Γκατ_1 ΕΙΚ_κατ (Γ)', emoji: getEmoji() },
    { id: 39, am: '6716', lastName: 'ΚΡΙΓΓΟΥ', firstName: 'ΑΝΤΡΕΑ', class: 'Γκατ_1 ΕΙΚ_κατ (Γ)', emoji: getEmoji() },
    { id: 40, am: '6721', lastName: 'ΚΧΑΛΕΝΤΙ', firstName: 'ΜΠΑΤΡΑΣΙ ΜΑΡΙΑ', class: 'Γκατ_1 ΕΙΚ_κατ (Γ)', emoji: getEmoji() },
    { id: 41, am: '6727', lastName: 'ΚΩΝΣΤΑΝΤΙΝΟΥ', firstName: 'ΧΡΙΣΤΟΣ', class: 'Γκατ_1 ΕΙΚ_κατ (Γ)', emoji: getEmoji() },
    { id: 42, am: '6714', lastName: 'ΝΤΙΝΟΥ', firstName: 'ΣΕΛΕΝΑ ΑΝΤΡΕΕΑ', class: 'Γκατ_1 ΕΙΚ_κατ (Γ)', emoji: getEmoji() },
    { id: 43, am: '6704', lastName: 'ΠΑΝΑΓΙΩΤΟΥ', firstName: 'ΜΑΡΙΝΑ', class: 'Γκατ_1 ΕΙΚ_κατ (Γ)', emoji: getEmoji() },
    { id: 45, am: '6668', lastName: 'ΧΡΙΣΤΟΦΟΡΟΥ', firstName: 'ΔΗΜΗΤΡΗΣ', class: 'Γκατ_1 ΕΙΚ_κατ (Γ)', emoji: getEmoji() }
  ]
};

// Helper function to get a student's full name for display purposes
const getFullName = (student) => `${student.lastName} ${student.firstName}`;

// We create a new array that includes the full name for each student
export const allStudents = Object.values(classes).flat().map(student => ({
    ...student,
    name: getFullName(student) // Add the 'name' property for easier display
}));