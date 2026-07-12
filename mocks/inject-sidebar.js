const fs = require('fs');
const path = require('path');

// ─── SVG Icons ──────────────────────────────────────────────

const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  recruitment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  hr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  talent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
  engagement: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  analytics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  integrations: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  candidate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>',
  communication: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>'
};

const CHEVRON = '<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

// ─── Navigation Structure ───────────────────────────────────

const modules = [
  {
    id: 'dashboard', label: 'Dashboard', icon: 'dashboard', single: true,
    pages: [{ file: 'dashboard.html', label: 'Dashboard' }]
  },
  {
    id: 'recruitment', label: 'Recruitment', icon: 'recruitment',
    pages: [
      { file: 'job-postings.html', label: 'Job Postings' },
      { file: 'job-templates.html', label: 'Job Templates' },
      { file: 'requisitions.html', label: 'Requisitions' },
      { file: 'applications.html', label: 'Applications' },
      { file: 'applicants.html', label: 'Applicants' },
      { file: 'recruitment-pipeline.html', label: 'Pipeline' },
      { file: 'interviews.html', label: 'Interviews' },
      { file: 'offers.html', label: 'Offers' }
    ]
  },
  {
    id: 'hr', label: 'HR', icon: 'hr',
    pages: [
      { file: 'employee-directory.html', label: 'Employee Directory' },
      { file: 'employee-profile.html', label: 'Employee Profile' },
      { file: 'employee-portal.html', label: 'Employee Portal' },
      { file: 'add-employee.html', label: 'Add Employee' },
      { file: 'leave-management.html', label: 'Leave Management' },
      { file: 'payslips.html', label: 'Payslips' },
      { file: 'overtime-log.html', label: 'Overtime Log' },
      { file: 'expense-submission.html', label: 'Expense Submission' },
      { file: 'time-attendance.html', label: 'Time & Attendance' },
      { file: 'shift-scheduling.html', label: 'Shift Scheduling' },
      { file: 'onboarding.html', label: 'Onboarding' },
      { file: 'company-documents.html', label: 'Company Documents' },
      { file: 'documents-management.html', label: 'Document Management' }
    ]
  },
  {
    id: 'talent', label: 'Talent', icon: 'talent',
    pages: [
      { file: 'performance-reviews.html', label: 'Performance Reviews' },
      { file: 'training-catalog.html', label: 'Training Catalog' },
      { file: 'training-admin.html', label: 'Training Admin' },
      { file: 'development-plans.html', label: 'Development Plans' },
      { file: 'competency-framework.html', label: 'Competency Framework' },
      { file: 'performance-improvement.html', label: 'Performance Improvement' },
      { file: '360-reviews.html', label: '360 Reviews' }
    ]
  },
  {
    id: 'engagement', label: 'Engagement', icon: 'engagement',
    pages: [
      { file: 'engagement-hub.html', label: 'Engagement Hub' },
      { file: 'pulse-surveys.html', label: 'Pulse Surveys' },
      { file: 'recognition.html', label: 'Recognition' },
      { file: 'social-feed.html', label: 'Social Feed' },
      { file: 'wellness.html', label: 'Wellness' }
    ]
  },
  {
    id: 'analytics', label: 'Analytics', icon: 'analytics',
    pages: [
      { file: 'analytics-dashboard.html', label: 'Analytics Dashboard' },
      { file: 'recruiter-dashboard.html', label: 'Recruiter Dashboard' },
      { file: 'reports.html', label: 'Reports' },
      { file: 'employee-report.html', label: 'Employee Reports' }
    ]
  },
  {
    id: 'admin', label: 'Administration', icon: 'admin',
    pages: [
      { file: 'role-permissions.html', label: 'Roles & Permissions' },
      { file: 'audit-logs.html', label: 'Audit Logs' },
      { file: 'departments.html', label: 'Departments' },
      { file: 'compliance.html', label: 'Compliance' },
      { file: 'labour-relations.html', label: 'Labour Relations' },
      { file: 'branding.html', label: 'Branding' },
      { file: 'document-templates.html', label: 'Document Templates' },
      { file: 'document-retention.html', label: 'Document Retention' },
      { file: 'custom-fields.html', label: 'Custom Fields' }
    ]
  },
  {
    id: 'integrations', label: 'Integrations', icon: 'integrations',
    pages: [
      { file: 'integrations-hub.html', label: 'Integrations Hub' },
      { file: 'sage-integration.html', label: 'Sage Integration' },
      { file: 'sso-configuration.html', label: 'SSO Configuration' },
      { file: 'workflow-management.html', label: 'Workflow Management' }
    ]
  },
  {
    id: 'candidate', label: 'Candidate Portal', icon: 'candidate',
    pages: [
      { file: 'candidate-portal.html', label: 'Candidate Portal' },
      { file: 'candidate-interviews-offers.html', label: 'Interviews & Offers' }
    ]
  },
  {
    id: 'communication', label: 'Communication', icon: 'communication',
    pages: [
      { file: 'announcements.html', label: 'Announcements' },
      { file: 'messaging.html', label: 'Messaging' },
      { file: 'notifications-and-search.html', label: 'Notifications & Search' },
      { file: 'it-support.html', label: 'IT Support' }
    ]
  },
  {
    id: 'ai', label: 'AI Tools', icon: 'ai', single: true,
    pages: [{ file: 'ai-tools.html', label: 'AI Tools' }]
  },
  {
    id: 'settings', label: 'Settings', icon: 'settings', single: true,
    pages: [{ file: 'settings.html', label: 'Settings' }]
  }
];

// Build file → module lookup
const fileToModule = {};
modules.forEach(mod => {
  mod.pages.forEach(page => { fileToModule[page.file] = mod.id; });
});

// ─── CSS to Inject ──────────────────────────────────────────

const SIDEBAR_CSS = `
    /* ========== SIDEBAR NAVIGATION ========== */
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 260px;
      background: var(--primary, #05527E);
      z-index: 200;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }

    .sidebar-hidden .sidebar {
      transform: translateX(-260px);
    }

    .sidebar-header {
      padding: 0 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      flex-shrink: 0;
    }

    .sidebar-brand {
      font-weight: 800;
      font-size: 1.125rem;
      color: #FFFFFF;
      text-decoration: none;
      letter-spacing: -0.02em;
    }

    .sidebar-brand span {
      color: var(--cta, #F1C54B);
    }

    .sidebar-close {
      display: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      align-items: center;
      justify-content: center;
      transition: all 200ms ease;
    }

    .sidebar-close:hover {
      background: rgba(255,255,255,0.2);
      color: #FFFFFF;
    }

    .sidebar-close svg {
      width: 16px;
      height: 16px;
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0;
    }

    .sidebar-nav::-webkit-scrollbar {
      width: 4px;
    }

    .sidebar-nav::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar-nav::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.15);
      border-radius: 4px;
    }

    .sidebar-nav::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.3);
    }

    .sidebar-divider {
      height: 1px;
      background: rgba(255,255,255,0.08);
      margin: 0.375rem 1.25rem;
    }

    .sidebar-group-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.5rem 1.25rem;
      border: none;
      background: transparent;
      color: rgba(255,255,255,0.7);
      font-family: inherit;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 200ms ease;
      text-align: left;
    }

    .sidebar-group-header:hover {
      color: #FFFFFF;
      background: rgba(255,255,255,0.05);
    }

    .sidebar-group-header svg:first-child {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .sidebar-group-header .chevron {
      margin-left: auto;
      width: 14px;
      height: 14px;
      transition: transform 200ms ease;
      opacity: 0.5;
    }

    .sidebar-group-header.expanded .chevron {
      transform: rotate(90deg);
    }

    .sidebar-group-body {
      overflow: hidden;
      max-height: 600px;
      transition: max-height 0.3s ease;
    }

    .sidebar-group-body.collapsed {
      max-height: 0;
    }

    .sidebar-link {
      display: block;
      padding: 0.375rem 1.25rem 0.375rem 3rem;
      color: rgba(255,255,255,0.55);
      text-decoration: none;
      font-size: 0.8125rem;
      font-weight: 500;
      transition: all 200ms ease;
      border-left: 3px solid transparent;
    }

    .sidebar-link:hover {
      color: #FFFFFF;
      background: rgba(255,255,255,0.05);
    }

    .sidebar-link.active {
      color: #FFFFFF;
      background: rgba(255,255,255,0.08);
      border-left-color: var(--cta, #F1C54B);
      font-weight: 600;
    }

    .sidebar-single-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1.25rem;
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      font-size: 0.8125rem;
      font-weight: 600;
      transition: all 200ms ease;
      border-left: 3px solid transparent;
    }

    .sidebar-single-link:hover {
      color: #FFFFFF;
      background: rgba(255,255,255,0.05);
    }

    .sidebar-single-link.active {
      color: #FFFFFF;
      background: rgba(255,255,255,0.08);
      border-left-color: var(--cta, #F1C54B);
    }

    .sidebar-single-link svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .sidebar-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 199;
    }

    .sidebar-toggle {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-control, 8px);
      border: none;
      background: transparent;
      color: var(--text-muted, #64748B);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 200ms ease;
      flex-shrink: 0;
    }

    .sidebar-toggle:hover {
      background: var(--bg, #F1F5F9);
      color: var(--primary, #05527E);
    }

    .sidebar-toggle svg {
      width: 20px;
      height: 20px;
    }

    /* Sidebar body layout shift */
    body {
      padding-left: 260px;
      transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    body.sidebar-hidden {
      padding-left: 0;
    }

    @media (max-width: 768px) {
      body, body.sidebar-hidden {
        padding-left: 0 !important;
      }

      body:not(.sidebar-hidden) .sidebar-overlay {
        display: block;
      }

      .sidebar {
        box-shadow: 4px 0 24px rgba(0,0,0,0.25);
      }

      .sidebar-close {
        display: flex;
      }
    }
`;

// ─── Hamburger Button HTML ──────────────────────────────────

const HAMBURGER_HTML = '\n      <button class="sidebar-toggle" id="sidebarToggle" title="Toggle sidebar">\n        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>\n      </button>';

// ─── Generate Sidebar HTML ──────────────────────────────────

function generateSidebarHTML(activeFile) {
  const activeModule = fileToModule[activeFile] || '';

  let h = '';
  h += '\n  <!-- ========== SIDEBAR NAVIGATION ========== -->\n';
  h += '  <aside class="sidebar" id="sidebar">\n';
  h += '    <div class="sidebar-header">\n';
  h += '      <a href="dashboard.html" class="sidebar-brand">Shumela<span>Hire</span></a>\n';
  h += '      <button class="sidebar-close" id="sidebarClose" title="Close sidebar">\n';
  h += '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>\n';
  h += '      </button>\n';
  h += '    </div>\n';
  h += '    <nav class="sidebar-nav">\n';

  modules.forEach((mod, idx) => {
    const isActive = mod.id === activeModule;
    if (idx > 0) h += '      <div class="sidebar-divider"></div>\n';

    if (mod.single) {
      const pg = mod.pages[0];
      const cls = pg.file === activeFile ? ' active' : '';
      h += '      <a href="' + pg.file + '" class="sidebar-single-link' + cls + '">\n';
      h += '        ' + ICONS[mod.icon] + '\n';
      h += '        <span>' + mod.label + '</span>\n';
      h += '      </a>\n';
    } else {
      h += '      <div class="sidebar-section">\n';
      h += '        <button class="sidebar-group-header' + (isActive ? ' expanded' : '') + '">\n';
      h += '          ' + ICONS[mod.icon] + '\n';
      h += '          <span>' + mod.label + '</span>\n';
      h += '          ' + CHEVRON + '\n';
      h += '        </button>\n';
      h += '        <div class="sidebar-group-body' + (isActive ? '' : ' collapsed') + '">\n';
      mod.pages.forEach(pg => {
        const cls = pg.file === activeFile ? ' active' : '';
        h += '          <a href="' + pg.file + '" class="sidebar-link' + cls + '">' + pg.label + '</a>\n';
      });
      h += '        </div>\n';
      h += '      </div>\n';
    }
  });

  h += '    </nav>\n';
  h += '  </aside>\n';
  h += '  <div class="sidebar-overlay" id="sidebarOverlay"></div>\n';
  return h;
}

// ─── Sidebar JS ─────────────────────────────────────────────

const SIDEBAR_JS = `
  <script>
  (function() {
    'use strict';
    var sidebar = document.getElementById('sidebar');
    var toggle = document.getElementById('sidebarToggle');
    var closeBtn = document.getElementById('sidebarClose');
    var overlay = document.getElementById('sidebarOverlay');

    if (window.innerWidth < 768) {
      document.body.classList.add('sidebar-hidden');
    }

    function toggleSidebar() {
      document.body.classList.toggle('sidebar-hidden');
    }

    if (toggle) toggle.addEventListener('click', toggleSidebar);

    if (closeBtn) closeBtn.addEventListener('click', function() {
      document.body.classList.add('sidebar-hidden');
    });

    if (overlay) overlay.addEventListener('click', function() {
      document.body.classList.add('sidebar-hidden');
    });

    var headers = document.querySelectorAll('.sidebar-group-header');
    for (var i = 0; i < headers.length; i++) {
      headers[i].addEventListener('click', function() {
        this.classList.toggle('expanded');
        var body = this.nextElementSibling;
        if (body) body.classList.toggle('collapsed');
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && window.innerWidth < 768 && !document.body.classList.contains('sidebar-hidden')) {
        document.body.classList.add('sidebar-hidden');
      }
    });

    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        if (window.innerWidth >= 768) {
          document.body.classList.remove('sidebar-hidden');
        }
      }, 150);
    });
  })();
  </script>
`;

// ─── Process a single file ──────────────────────────────────

function processFile(filePath) {
  const filename = path.basename(filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already injected
  if (content.includes('id="sidebar"')) {
    console.log('  SKIP (already has sidebar)');
    return true;
  }

  // 1. Inject sidebar CSS before last </style>
  const styleIdx = content.lastIndexOf('</style>');
  if (styleIdx === -1) {
    console.error('  ERROR: No </style> in ' + filename);
    return false;
  }
  content = content.slice(0, styleIdx) + SIDEBAR_CSS + '\n  ' + content.slice(styleIdx);

  // 2. Add hamburger button into topnav-left (or nav-left variant)
  let tlTag = '<div class="topnav-left">';
  let tlIdx = content.indexOf(tlTag);
  if (tlIdx === -1) {
    tlTag = '<div class="nav-left">';
    tlIdx = content.indexOf(tlTag);
  }
  if (tlIdx === -1) {
    tlTag = '<div class="navbar-left">';
    tlIdx = content.indexOf(tlTag);
  }
  if (tlIdx === -1) {
    console.error('  ERROR: No topnav-left/nav-left/navbar-left in ' + filename);
    return false;
  }
  const afterTl = tlIdx + tlTag.length;
  content = content.slice(0, afterTl) + HAMBURGER_HTML + content.slice(afterTl);

  // 3. Inject sidebar HTML after first </nav>
  const navIdx = content.indexOf('</nav>');
  if (navIdx === -1) {
    console.error('  ERROR: No </nav> in ' + filename);
    return false;
  }
  const afterNav = navIdx + '</nav>'.length;
  content = content.slice(0, afterNav) + '\n' + generateSidebarHTML(filename) + content.slice(afterNav);

  // 4. Inject sidebar JS before </body>
  const bodyIdx = content.lastIndexOf('</body>');
  if (bodyIdx === -1) {
    console.error('  ERROR: No </body> in ' + filename);
    return false;
  }
  content = content.slice(0, bodyIdx) + SIDEBAR_JS + '\n' + content.slice(bodyIdx);

  fs.writeFileSync(filePath, content);
  return true;
}

// ─── Main ───────────────────────────────────────────────────

const mocksDir = __dirname;
const htmlFiles = fs.readdirSync(mocksDir).filter(f => f.endsWith('.html')).sort();

console.log('Processing ' + htmlFiles.length + ' HTML files...\n');

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
