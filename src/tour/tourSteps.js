// ─────────────────────────────────────────────────────────────────────────
// TOUR STEP DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────
// Each step:
//  path          -> route the tour will auto-navigate to
//  selector      -> CSS selector (data-tour attribute) of the element to spotlight
//  placement     -> where the tooltip box appears relative to the element
//  title/content -> the guidance text shown
//  requiresAuth  -> if true, the tour PAUSES on this step until the user
//                   actually logs in (AuthContext.user becomes truthy)
//
// The full tour is assembled from three blocks:
//   1. PRE_AUTH_STEPS         -> same for every visitor, before login
//   2. POST_AUTH_COMMON_STEPS -> same for every logged-in user (any role)
//   3. OWNER_STEPS / DRIVER_STEPS -> role-specific dashboard walkthrough
//
// getTourSteps(role) stitches these together based on the current user's
// role, so a Boat Owner gets the owner walkthrough and a Boat Driver gets
// the driver walkthrough automatically once they log in.
// ─────────────────────────────────────────────────────────────────────────

const PRE_AUTH_STEPS = [
  {
    id: "welcome",
    path: "/",
    selector: '[data-tour="register-btn"]',
    placement: "bottom",
    title: "Welcome to Deewaraya 👋",
    content:
      "Let's take a quick tour. First, every new user needs an account — click 'Get Started' to register.",
  },
  {
    id: "register-form",
    path: "/register",
    selector: '[data-tour="register-form"]',
    placement: "left",
    title: "Create Your Account",
    content:
      "Fill in your name, email, password, and choose your role (Boat Owner or Boat Driver), then submit to register.",
  },
  {
    id: "login-form",
    path: "/login",
    selector: '[data-tour="login-form"]',
    placement: "left",
    title: "Log In",
    content:
      "Once registered, enter your email and password here to log in to your account.",
  },
  {
    id: "forgot-password",
    path: "/forgot-password",
    selector: '[data-tour="forgot-password"]',
    placement: "top",
    title: "Forgot Your Password?",
    content:
      "No problem — click here and we'll email you a secure link to reset it.",
  },
];

const POST_AUTH_COMMON_STEPS = [
  {
    id: "profile-icon",
    path: "/",
    selector: '[data-tour="profile-icon"]',
    placement: "bottom",
    title: "Your Profile",
    requiresAuth: true,
    content:
      "Now that you're logged in, click your profile picture anytime to view or edit your account details.",
  },
  {
    id: "profile-page",
    path: "/profile",
    selector: '[data-tour="profile-page"]',
    placement: "bottom",
    requiresAuth: true,
    title: "Profile Page",
    content:
      "Here you can update your name, contact details, and password.",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// BOAT OWNER TOUR
// ─────────────────────────────────────────────────────────────────────────
const OWNER_STEPS = [
  {
    id: "dashboard",
    path: "/boatownerdashboard",
    selector: '[data-tour="dashboard-overview"]',
    placement: "bottom",
    requiresAuth: true,
    title: "Your Dashboard",
    content:
      "This is your command center — see your fleet at a glance: total boats, income, expenses, net profit, and maintenance alerts, all in one place.",
  },
  {
    id: "boats-list",
    path: "/boatownerboats",
    selector: '[data-tour="boats-list"]',
    placement: "bottom",
    requiresAuth: true,
    title: "Your Boats",
    content:
      "Every boat you own is listed here, with its registration, status, and quick actions like viewing details or generating a QR code.",
  },
  {
    id: "add-boat",
    path: "/addnewboat",
    selector: '[data-tour="add-boat-btn"]',
    placement: "left",
    requiresAuth: true,
    title: "Add a New Boat",
    content:
      "Click here to register a new boat — enter its name, registration number, type, and location so it starts showing up across the app.",
  },
  {
    id: "qr-code",
    path: "/qr-code",
    selector: '[data-tour="qr-code-page"]',
    placement: "top",
    requiresAuth: true,
    title: "Vessel QR Code",
    content:
      "Generate and print a QR code for any boat — scanning it opens a public safety page with that vessel's official details.",
  },
  {
    id: "maintenance",
    path: "/maintenance",
    selector: '[data-tour="maintenance-page"]',
    placement: "top",
    requiresAuth: true,
    title: "Maintenance Tracking",
    content:
      "Log engine services, spare part changes, and repairs here, and get reminders before things become overdue.",
  },
  {
    id: "maintenance-engine",
    path: "/maintenance/engine",
    selector: '[data-tour="maintenance-engine-page"]',
    placement: "top",
    requiresAuth: true,
    title: "Engine Maintenance",
    content:
      "Track engine service history, upcoming services, and nearby repair providers for every boat in your fleet.",
  },
  {
    id: "maintenance-spare-parts",
    path: "/maintenance/spare-parts",
    selector: '[data-tour="maintenance-spare-parts-page"]',
    placement: "top",
    requiresAuth: true,
    title: "Spare Parts Tracking",
    content:
      "Keep a record of every spare part replaced, its cost, and when the next replacement is due.",
  },
  {
    id: "maintenance-body-parts",
    path: "/maintenance/body-parts",
    selector: '[data-tour="maintenance-body-parts-page"]',
    placement: "top",
    requiresAuth: true,
    title: "Body & Hull Maintenance",
    content:
      "Log hull repairs, painting, and body work so you always know the condition of each boat.",
  },
  {
    id: "weather",
    path: "/weather",
    selector: '[data-tour="weather-page"]',
    placement: "top",
    requiresAuth: true,
    title: "Weather Dashboard",
    content:
      "Select a boat to see live weather and location shared by its driver — wind, rain, temperature, and a safety map, refreshing automatically.",
  },
  {
    id: "finance",
    path: "/owner/finance",
    selector: '[data-tour="finance-page"]',
    placement: "top",
    requiresAuth: true,
    title: "Finance Dashboard",
    content:
      "This is your finance hub — jump into Daily Calculation to log catches and expenses, or Monthly Reports for a full performance summary.",
  },
  {
    id: "daily-calculation",
    path: "/owner/finance/daily",
    selector: '[data-tour="daily-calculation-page"]',
    placement: "top",
    requiresAuth: true,
    title: "Daily Calculation",
    content:
      "Record today's fish catch, fuel, salary, ice, and other expenses — your daily net profit is calculated automatically.",
  },
  {
    id: "monthly-reports",
    path: "/owner/finance/monthly",
    selector: '[data-tour="monthly-reports-page"]',
    placement: "top",
    requiresAuth: true,
    title: "Monthly Reports",
    content:
      "Compare months side by side, view performance charts, and email yourself a full PDF report. That's the full tour!",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// BOAT DRIVER TOUR
// ─────────────────────────────────────────────────────────────────────────
const DRIVER_STEPS = [
  {
    id: "driver-dashboard",
    path: "/boatdriverdashboard",
    selector: '[data-tour="driver-dashboard-overview"]',
    placement: "bottom",
    requiresAuth: true,
    title: "Your Dashboard",
    content:
      "This is your command center on the water — live speed, heading, depth, wind, temperature, boat details, and quick actions like Deploy Anchor and Emergency Broadcast.",
  },
  {
    id: "gps-save",
    path: "/gps-save",
    selector: '[data-tour="gps-save-page"]',
    placement: "bottom",
    requiresAuth: true,
    title: "Share Your Location",
    content:
      "Save your boat's current GPS position here — your owner will see it live on their Weather Dashboard map for safety tracking.",
  },
  {
    id: "weather",
    path: "/weather",
    selector: '[data-tour="weather-page"]',
    placement: "top",
    requiresAuth: true,
    title: "Weather Dashboard",
    content:
      "Check live wind, rain, and temperature for your boat, plus a safety map — refreshing automatically while you're out at sea.",
  },
  {
    id: "qr-code",
    path: "/qr-code",
    selector: '[data-tour="qr-code-page"]',
    placement: "top",
    requiresAuth: true,
    title: "Vessel QR Code",
    content:
      "View and print your boat's QR code — scanning it opens a public safety page with the vessel's official details. That's the full tour!",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────

// Builds the full step list for the given role ("owner" | "driver" | undefined).
// Before login the role is unknown, so it defaults to the owner branch —
// this only matters for steps after "profile-page", which are all
// requiresAuth: true and therefore never reached until the user is logged
// in (by which point their real role is known and the correct branch is used).
export const getTourSteps = (role) => {
  const roleSteps = role === "driver" ? DRIVER_STEPS : OWNER_STEPS;
  return [...PRE_AUTH_STEPS, ...POST_AUTH_COMMON_STEPS, ...roleSteps];
};

// Kept for backward compatibility with any code importing TOUR_STEPS
// directly (defaults to the Boat Owner tour).
export const TOUR_STEPS = getTourSteps("owner");