const fs = require('fs');
const path = require('path');

// ─── Dark Mode CSS ──────────────────────────────────────────

const DARK_MODE_CSS = `
    /* ========== DARK MODE ========== */
    [data-theme="dark"] {
      --primary: #60A5FA;
      --primary-light: #1E3A5F;
      --primary-tint: #162032;
      --bg: #0F172A;
      --card-bg: #1E293B;
      --card: #1E293B;
      --border: #334155;
      --text-primary: #E2E8F0;
      --text: #E2E8F0;
      --text-muted: #94A3B8;
      --muted: #94A3B8;
      --teal: #2DD4BF;
      --teal-bg: #0D3B35;
      --teal-tint: #0A2926;
      --gold: #FBBF24;
      --gold-bg: #3D2E0A;
      --gold-tint: #2A200A;
      --pink: #FB7185;
      --pink-bg: #3D1525;
      --pink-tint: #2A0F1A;
      --navy-bg: #1E3A5F;
      --navy-tint: #162032;
      --shadow-sm: 0 2px 5px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2);
      --shadow-md: 0 4px 10px rgba(0,0,0,0.3), 0 2px 5px rgba(0,0,0,0.2);
      --shadow-lg: 0 10px 20px rgba(0,0,0,0.3), 0 5px 10px rgba(0,0,0,0.2);
      --error: #F87171;
      --error-bg: #3D1515;
      --success: #34D399;
      --success-bg: #0D3D2A;
      --warning: #FBBF24;
      --warning-bg: #3D2E0A;
      --cta: #F1C54B;
      --cta-hover: #D4A832;
    }

    [data-theme="dark"] body {
      background: #0F172A;
      color: #E2E8F0;
    }

    [data-theme="dark"] h1,
    [data-theme="dark"] h2,
    [data-theme="dark"] h3,
    [data-theme="dark"] h4 {
      color: #E2E8F0;
    }

    [data-theme="dark"] a {
      color: #60A5FA;
    }

    [data-theme="dark"] a:hover {
      color: #93C5FD;
    }

    /* Topnav / Navbar */
    [data-theme="dark"] .topnav,
    [data-theme="dark"] .top-nav,
    [data-theme="dark"] .top-nav-inner,
    [data-theme="dark"] .navbar,
    [data-theme="dark"] nav[class*="topnav"],
    [data-theme="dark"] nav[class*="top-nav"],
    [data-theme="dark"] nav[class*="navbar"] {
      background: #1E293B;
      border-color: #334155;
    }

    /* Broad card/panel/white-bg overrides */
    [data-theme="dark"] .card,
    [data-theme="dark"] .panel,
    [data-theme="dark"] .modal-content,
    [data-theme="dark"] .modal-body,
    [data-theme="dark"] .modal-header,
    [data-theme="dark"] .modal-footer,
    [data-theme="dark"] .dropdown-menu,
    [data-theme="dark"] .dropdown-content,
    [data-theme="dark"] .popover,
    [data-theme="dark"] .tooltip-inner,
    [data-theme="dark"] .stat-card,
    [data-theme="dark"] .stats-card,
    [data-theme="dark"] .metric-card,
    [data-theme="dark"] .info-card,
    [data-theme="dark"] .summary-card,
    [data-theme="dark"] .detail-card,
    [data-theme="dark"] .action-card,
    [data-theme="dark"] .feature-card,
    [data-theme="dark"] .profile-card,
    [data-theme="dark"] .review-card,
    [data-theme="dark"] .activity-card,
    [data-theme="dark"] .kpi-card,
    [data-theme="dark"] .widget,
    [data-theme="dark"] .content-card,
    [data-theme="dark"] .list-card,
    [data-theme="dark"] .form-card,
    [data-theme="dark"] .chart-card,
    [data-theme="dark"] .table-card,
    [data-theme="dark"] .data-card,
    [data-theme="dark"] .notification-card,
    [data-theme="dark"] .alert-card,
    [data-theme="dark"] .timeline-card,
    [data-theme="dark"] .empty-state,
    [data-theme="dark"] .page-header,
    [data-theme="dark"] .section-header,
    [data-theme="dark"] .filter-bar,
    [data-theme="dark"] .search-bar,
    [data-theme="dark"] .toolbar,
    [data-theme="dark"] .tab-content,
    [data-theme="dark"] .tab-pane {
      background: #1E293B;
      color: #E2E8F0;
    }

    /* Catch-all: any element with hardcoded white bg */
    [data-theme="dark"] [style*="background: #fff"],
    [data-theme="dark"] [style*="background:#fff"],
    [data-theme="dark"] [style*="background: #FFF"],
    [data-theme="dark"] [style*="background:#FFF"],
    [data-theme="dark"] [style*="background: white"],
    [data-theme="dark"] [style*="background:white"],
    [data-theme="dark"] [style*="background-color: #fff"],
    [data-theme="dark"] [style*="background-color:#fff"],
    [data-theme="dark"] [style*="background-color: #FFF"],
    [data-theme="dark"] [style*="background-color:#FFF"],
    [data-theme="dark"] [style*="background-color: white"],
    [data-theme="dark"] [style*="background-color:white"] {
      background: #1E293B !important;
      color: #E2E8F0 !important;
    }

    /* Forms */
    [data-theme="dark"] input,
    [data-theme="dark"] select,
    [data-theme="dark"] textarea,
    [data-theme="dark"] .form-control,
    [data-theme="dark"] .input,
    [data-theme="dark"] .search-input {
      background: #0F172A;
      color: #E2E8F0;
      border-color: #334155;
    }

    [data-theme="dark"] input::placeholder,
    [data-theme="dark"] select::placeholder,
    [data-theme="dark"] textarea::placeholder {
      color: #64748B;
    }

    [data-theme="dark"] input:focus,
    [data-theme="dark"] select:focus,
    [data-theme="dark"] textarea:focus {
      border-color: #60A5FA;
      box-shadow: 0 0 0 3px rgba(96,165,250,0.15);
    }

    /* Tables */
    [data-theme="dark"] table {
      border-color: #334155;
    }

    [data-theme="dark"] th {
      background: #162032;
      color: #94A3B8;
      border-color: #334155;
    }

    [data-theme="dark"] td {
      border-color: #334155;
      color: #E2E8F0;
    }

    [data-theme="dark"] tr:hover td {
      background: rgba(96,165,250,0.05);
    }

    [data-theme="dark"] tbody tr:nth-child(even) td {
      background: rgba(15,23,42,0.3);
    }

    /* Sidebar */
    [data-theme="dark"] .sidebar {
      background: #0B1929;
    }

    /* Buttons */
    [data-theme="dark"] .btn-cta {
      color: #0F172A;
    }

    [data-theme="dark"] .btn-ghost {
      border-color: #334155;
      color: #94A3B8;
    }

    [data-theme="dark"] .btn-ghost:hover {
      border-color: #60A5FA;
      color: #60A5FA;
    }

    [data-theme="dark"] .btn-primary {
      color: #60A5FA;
      border-color: var(--cta);
    }

    /* Notification badge */
    [data-theme="dark"] .notification-badge,
    [data-theme="dark"] .nav-badge,
    [data-theme="dark"] .badge {
      border-color: transparent;
    }

    /* Modal overlay */
    [data-theme="dark"] .modal-overlay,
    [data-theme="dark"] .overlay {
      background: rgba(0,0,0,0.7);
    }

    /* Demo bar */
    [data-theme="dark"] .demo-bar,
    [data-theme="dark"] .demo-toggle-bar {
      background: #1E293B;
      border-color: #334155;
    }

    [data-theme="dark"] .demo-btn {
      background: #0F172A;
      color: #E2E8F0;
      border-color: #334155;
    }

    [data-theme="dark"] .demo-btn:hover,
    [data-theme="dark"] .demo-btn.active {
      background: #60A5FA;
      color: #0F172A;
      border-color: #60A5FA;
    }

    /* Skeleton loading */
    [data-theme="dark"] .skeleton {
      background: linear-gradient(90deg, #1E293B 25%, #334155 50%, #1E293B 75%) !important;
      background-size: 200% 100% !important;
    }

    /* Scrollbar */
    [data-theme="dark"] ::-webkit-scrollbar-track {
      background: #0F172A;
    }

    [data-theme="dark"] ::-webkit-scrollbar-thumb {
      background: #334155;
    }

    [data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
      background: #475569;
    }

    /* Breadcrumb */
    [data-theme="dark"] .breadcrumb a {
      color: #94A3B8;
    }

    [data-theme="dark"] .breadcrumb-current {
      color: #60A5FA;
    }

    /* Tags, pills, status badges */
    [data-theme="dark"] .tag,
    [data-theme="dark"] .pill,
    [data-theme="dark"] .chip,
    [data-theme="dark"] .status-badge,
    [data-theme="dark"] .label {
      border-color: #334155;
    }

    /* Tabs */
    [data-theme="dark"] .tab,
    [data-theme="dark"] .nav-tab,
    [data-theme="dark"] .tabs {
      border-color: #334155;
    }

    [data-theme="dark"] .tab.active,
    [data-theme="dark"] .nav-tab.active {
      color: #60A5FA;
      border-color: #60A5FA;
    }

    /* Dividers / HRs */
    [data-theme="dark"] hr {
      border-color: #334155;
    }

    /* Avatar fallback */
    [data-theme="dark"] .topnav-avatar,
    [data-theme="dark"] .nav-avatar,
    [data-theme="dark"] .user-avatar {
      background: #334155;
      color: #E2E8F0;
    }

    /* Progress bars */
    [data-theme="dark"] .progress-bg,
    [data-theme="dark"] .progress-track {
      background: #334155;
    }

    /* Topnav icon buttons in dark */
    [data-theme="dark"] .topnav-icon-btn:hover,
    [data-theme="dark"] .nav-icon-btn:hover {
      background: #334155;
    }

    /* Toggle button styling */
    .theme-toggle-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted, #64748B);
      transition: all 200ms ease;
      position: relative;
    }

    .theme-toggle-btn:hover {
      background: var(--bg, #F1F5F9);
      color: var(--primary, #05527E);
    }

    .theme-toggle-btn svg {
      width: 20px;
      height: 20px;
    }

    [data-theme="dark"] .theme-toggle-btn:hover {
      background: #334155;
      color: #FBBF24;
    }

    /* Misc containers that use white/light backgrounds */
    [data-theme="dark"] .content,
    [data-theme="dark"] .main-content,
    [data-theme="dark"] .page-content,
    [data-theme="dark"] .container,
    [data-theme="dark"] .wrapper {
      color: #E2E8F0;
    }

    /* Section titles and labels */
    [data-theme="dark"] .section-title,
    [data-theme="dark"] .card-title,
    [data-theme="dark"] .card-header,
    [data-theme="dark"] .panel-header,
    [data-theme="dark"] .panel-title {
      color: #E2E8F0;
    }

    /* Muted/secondary text */
    [data-theme="dark"] .text-muted,
    [data-theme="dark"] .text-secondary,
    [data-theme="dark"] .subtitle,
    [data-theme="dark"] .description,
    [data-theme="dark"] .help-text,
    [data-theme="dark"] .hint,
    [data-theme="dark"] small {
      color: #94A3B8;
    }

    /* Code blocks */
    [data-theme="dark"] code,
    [data-theme="dark"] pre {
      background: #0F172A;
      color: #E2E8F0;
      border-color: #334155;
    }

    /* Lists */
    [data-theme="dark"] .list-item,
    [data-theme="dark"] .list-group-item {
      background: #1E293B;
      border-color: #334155;
      color: #E2E8F0;
    }

    [data-theme="dark"] .list-item:hover,
    [data-theme="dark"] .list-group-item:hover {
      background: #263449;
    }
`;

// ─── Theme Toggle HTML ──────────────────────────────────────

const THEME_TOGGLE_HTML = `
      <button class="theme-toggle-btn" id="themeToggle" title="Toggle dark mode">
        <svg id="themeIconMoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        <svg id="themeIconSun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
      </button>`;

// ─── Theme JS ───────────────────────────────────────────────

const THEME_JS = `
  <script>
  (function() {
    'use strict';
    var toggle = document.getElementById('themeToggle');
    var moonIcon = document.getElementById('themeIconMoon');
    var sunIcon = document.getElementById('themeIconSun');

    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('shumela-theme', theme);
      if (moonIcon && sunIcon) {
        if (theme === 'dark') {
          moonIcon.style.display = 'none';
          sunIcon.style.display = 'block';
        } else {
          moonIcon.style.display = 'block';
          sunIcon.style.display = 'none';
        }
      }
    }

    // Initialize theme
    var saved = localStorage.getItem('shumela-theme');
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    if (toggle) {
      toggle.addEventListener('click', function() {
        var current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
      });
    }
  })();
  </script>
`;

// ─── Process a single file ──────────────────────────────────

function processFile(filePath) {
  const filename = path.basename(filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // Idempotency: skip if already injected
  if (content.includes('id="themeToggle"')) {
    console.log('  SKIP (already has dark mode)');
    return true;
  }

  // 1. Inject dark mode CSS before last </style>
  const styleIdx = content.lastIndexOf('</style>');
  if (styleIdx === -1) {
    console.error('  ERROR: No </style> in ' + filename);
    return false;
  }
  content = content.slice(0, styleIdx) + DARK_MODE_CSS + '\n  ' + content.slice(styleIdx);

  // 2. Inject theme toggle button into nav-right area (before first child)
  let navRightTag = null;
  let navRightIdx = -1;

  const variants = [
    '<div class="topnav-right">',
    '<div class="nav-right">',
    '<div class="navbar-right">'
  ];

  for (const tag of variants) {
    const idx = content.indexOf(tag);
    if (idx !== -1) {
      navRightTag = tag;
      navRightIdx = idx;
      break;
    }
  }

  if (navRightIdx === -1) {
    console.error('  ERROR: No nav-right container in ' + filename);
    return false;
  }

  const afterNavRight = navRightIdx + navRightTag.length;
  content = content.slice(0, afterNavRight) + THEME_TOGGLE_HTML + content.slice(afterNavRight);

  // 3. Inject theme JS before </body>
  const bodyIdx = content.lastIndexOf('</body>');
  if (bodyIdx === -1) {
    console.error('  ERROR: No </body> in ' + filename);
    return false;
  }
  content = content.slice(0, bodyIdx) + THEME_JS + '\n' + content.slice(bodyIdx);

  fs.writeFileSync(filePath, content);
  return true;
}

// ─── Main ───────────────────────────────────────────────────

const mocksDir = __dirname;
const htmlFiles = fs.readdirSync(mocksDir).filter(f => f.endsWith('.html')).sort();

console.log('Injecting dark mode into ' + htmlFiles.length + ' HTML files...\n');

let success = 0;
let errors = 0;

htmlFiles.forEach(f => {
  process.stdout.write('  ' + f + ' ... ');
  if (processFile(path.join(mocksDir, f))) {
    if (!process.stdout.writableEnded) console.log('OK');
    success++;
  } else {
    errors++;
  }
});

console.log('\nDone: ' + success + ' processed, ' + errors + ' errors.');
