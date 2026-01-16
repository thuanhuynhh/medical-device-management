/**
 * Shared Navbar Component
 * Renders the navigation bar dynamically on all pages
 */

const Navbar = {
  // Menu items configuration
  menuItems: [
    { id: 'dashboardMenuItem', href: '/dashboard.html', icon: 'dashboard', label: 'Dashboard', roles: ['admin', 'inspector'] },
    { id: 'devicesMenuItem', href: '/devices.html', icon: 'devices', label: 'Thiết bị', roles: ['admin', 'inspector', 'technician'] },
    { id: 'inspectionsMenuItem', href: '/inspections.html', icon: 'inspections', label: 'Kiểm tra', roles: ['admin', 'inspector', 'viewer', 'technician'] },
    { id: 'ticketsMenuItem', href: '/tickets.html', icon: 'tickets', label: 'Sự cố', roles: ['admin', 'inspector', 'technician'] },
    { id: 'usersMenuItem', href: '/users.html', icon: 'users', label: 'Users', roles: ['admin', 'inspector'] },
    { id: 'settingsMenuItem', href: '/settings.html', icon: 'settings', label: 'Cài đặt', roles: ['admin'] }
  ],

  // SVG icons
  icons: {
    dashboard: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    devices: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    inspections: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>',
    tickets: '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>',
    users: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>'
  },

  // Current page
  currentPage: '',

  // User info
  user: null,

  /**
   * Initialize navbar
   */
  init(user) {
    this.user = user;
    this.currentPage = window.location.pathname.split('/').pop() || 'index.html';
    this.render();
    this.renderFooter();
    this.loadBranding();
  },

  renderFooter() {
    const existingFooter = document.querySelector('.main-footer');
    if (existingFooter) return;

    const footer = document.createElement('footer');
    footer.className = 'main-footer';
    const copyrightSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><circle cx="12" cy="12" r="10"></circle><path d="M14.83 14.83a4 4 0 1 1 0-5.66"></path></svg>`;
    footer.innerHTML = `<p>Copyrights ${copyrightSvg} 2026 <a href="https://vicas.vn" target="_blank">VICAS.vn</a> All rights reserved</p>`;
    
    // Try to append to page-wrapper for correct layout, fallback to body
    const wrapper = document.querySelector('.page-wrapper');
    if (wrapper) {
      wrapper.appendChild(footer);
    } else {
      document.body.appendChild(footer);
    }
  },

  /**
   * Get default page based on user role
   */
  getDefaultPage(role) {
    switch(role) {
      case 'viewer': return '/inspections.html';
      case 'technician': return '/tickets.html';
      default: return '/dashboard.html';
    }
  },

  /**
   * Render the navbar
   */
  /**
   * Render the navbar
   */
  render() {
    const container = document.getElementById('navbar-container');
    if (!container) return;

    const userRole = this.user?.role || 'viewer';
    const userName = this.user?.full_name || 'User';
    const userInitial = userName.charAt(0).toUpperCase();
    const roleLabels = { admin: 'Quản trị viên', inspector: 'Kiểm tra viên', viewer: 'Người xem', technician: 'Kỹ thuật viên' };
    const roleLabel = roleLabels[userRole] || userRole;

    container.innerHTML = `
      <nav class="navbar">
        <div class="navbar-inner">
          <div style="display: flex; align-items: center; gap: 12px;">
            <button class="mobile-menu-toggle" onclick="Navbar.toggleMobileMenu()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <a href="${this.getDefaultPage(userRole)}" class="navbar-brand">
              <img src="/images/logo.png" alt="Logo" id="navLogo" style="width: 28px; height: 28px; object-fit: contain;">
              <span id="navTitle">Quản lý Thiết bị Y tế</span>
            </a>
          </div>
          
          <ul class="navbar-menu" id="navbarMenu">
            ${this.renderMenuItems(userRole)}
          </ul>
          
          <div class="navbar-actions">
            <button class="theme-toggle" id="themeToggle" title="Chuyển chế độ sáng/tối">
              <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              <svg class="moon-icon hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            </button>
            
            <div class="user-info">
              <div class="user-dropdown-container">
                <div class="user-avatar" onclick="Navbar.toggleUserDropdown()" title="${userName}">
                  ${userInitial}
                </div>
                <div class="user-dropdown-menu" id="userDropdown">
                  <div class="user-dropdown-header">
                    <span class="user-dropdown-name">${userName}</span>
                    <span class="user-dropdown-role">${roleLabel}</span>
                  </div>
                  <div class="user-dropdown-content">
                    <a class="user-dropdown-item danger" onclick="Auth.logout()">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Đăng xuất
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    `;

    // Initialize theme toggle
    this.initTheme();
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-dropdown-container')) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.classList.remove('active');
      }
      
      const mobileMenu = document.getElementById('navbarMenu');
      const toggleBtn = e.target.closest('.mobile-menu-toggle');
      if (mobileMenu && mobileMenu.classList.contains('active') && !toggleBtn && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('active');
      }
    });
  },

  toggleMobileMenu() {
    const menu = document.getElementById('navbarMenu');
    if (menu) menu.classList.toggle('active');
  },

  toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.toggle('active');
  },

  /**
   * Render menu items based on user role
   */
  renderMenuItems(userRole) {
    return this.menuItems
      .filter(item => item.roles.includes(userRole))
      .map(item => {
        const isActive = this.currentPage === item.href.split('/').pop();
        return `
          <li id="${item.id}">
            <a href="${item.href}"${isActive ? ' class="active"' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                ${this.icons[item.icon]}
              </svg>
              ${item.label}
            </a>
          </li>
        `;
      })
      .join('');
  },

  /**
   * Load branding from config
   */
  async loadBranding() {
    try {
      const config = await API.get('/api/config');
      if (config.custom_logo) {
        const logo = document.getElementById('navLogo');
        if (logo) logo.src = config.custom_logo;
      }
      if (config.site_title) {
        const title = document.getElementById('navTitle');
        if (title) title.textContent = config.site_title;
      }
    } catch (e) {}
  },

  /**
   * Theme management
   */
  initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
    
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.addEventListener('click', () => this.toggleTheme());
    }
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    this.updateThemeIcon(next);
  },

  updateThemeIcon(theme) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    if (sunIcon) sunIcon.classList.toggle('hidden', theme === 'dark');
    if (moonIcon) moonIcon.classList.toggle('hidden', theme !== 'dark');
  }
};
