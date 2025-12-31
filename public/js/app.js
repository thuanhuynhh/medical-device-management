// ============ API Helper ============
const API = {
  baseUrl: '',
  
  async request(method, endpoint, data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Có lỗi xảy ra');
      }
      
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  get(endpoint) { return this.request('GET', endpoint); },
  post(endpoint, data) { return this.request('POST', endpoint, data); },
  put(endpoint, data) { return this.request('PUT', endpoint, data); },
  delete(endpoint) { return this.request('DELETE', endpoint); }
};

// ============ Auth Helper ============
const Auth = {
  user: null,
  
  // Sync init - for quick checks, reads from localStorage only
  init() {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
    }
    return this.user;
  },
  
  // Async verify - validates session with server
  async verify() {
    const userData = localStorage.getItem('user');
    if (!userData) {
      return { success: false, error: 'no_session', message: 'Chưa đăng nhập' };
    }
    
    const cached = JSON.parse(userData);
    try {
      const result = await API.post('/api/auth/verify', { user_id: cached.id });
      if (result.success) {
        this.user = result.user;
        localStorage.setItem('user', JSON.stringify(result.user));
        return { success: true, user: this.user };
      }
      localStorage.removeItem('user');
      return { success: false, error: 'invalid_session', message: 'Session không hợp lệ' };
    } catch (e) {
      localStorage.removeItem('user');
      return { success: false, error: e.error || 'server_error', message: e.message || 'Lỗi xác thực' };
    }
  },
  
  // Check if user can access a specific page
  async checkPageAccess(page) {
    if (!this.user) {
      return { allowed: false, error: 'no_session', message: 'Chưa đăng nhập' };
    }
    try {
      const result = await API.post('/api/auth/check-page-access', { 
        user_id: this.user.id, 
        page 
      });
      return result;
    } catch (e) {
      return { allowed: false, error: e.error || 'server_error', message: e.message || 'Lỗi kiểm tra quyền' };
    }
  },
  
  // Handle auth errors - show message and redirect appropriately
  handleAuthError(error, message, userRole = null) {
    if (error === 'account_locked') {
      alert(message || 'Tài khoản của bạn đã bị khóa');
      this.logout();
    } else if (error === 'no_permission') {
      alert(message || 'Bạn không có quyền truy cập trang này');
      // Redirect based on role
      if (userRole === 'viewer') {
        window.location.href = '/inspections.html';
      } else {
        window.location.href = '/dashboard.html';
      }
    } else {
      this.logout();
    }
  },
  
  async login(username, password) {
    try {
      const result = await API.post('/api/login', { username, password });
      if (result.success) {
        this.user = result.user;
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      return result;
    } catch (e) {
      // Re-throw with error info for handling locked accounts
      throw e;
    }
  },
  
  logout() {
    this.user = null;
    localStorage.removeItem('user');
    window.location.href = '/';
  },
  
  isLoggedIn() {
    return this.user !== null;
  },
  
  isAdmin() {
    return this.user && this.user.role === 'admin';
  },
  
  isViewer() {
    return this.user && this.user.role === 'viewer';
  }
};

// ============ Toast Notifications ============
const Toast = {
  container: null,
  
  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },
  
  show(message, type = 'info', duration = 3000) {
    if (!this.container) this.init();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
    `;
    
    this.container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  
  success(message) { this.show(message, 'success'); },
  error(message) { this.show(message, 'error'); },
  warning(message) { this.show(message, 'warning'); },
  info(message) { this.show(message, 'info'); }
};

// ============ Modal Helper ============
const Modal = {
  overlay: null,
  
  create(title, content, footer = '') {
    this.close(); // Close any existing modal
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" onclick="Modal.close()">✕</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;
    
    document.body.appendChild(this.overlay);
    
    // Trigger animation
    requestAnimationFrame(() => {
      this.overlay.classList.add('active');
    });
    
    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', this.handleEsc);
  },
  
  handleEsc(e) {
    if (e.key === 'Escape') {
      Modal.close();
    }
  },
  
  close() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      setTimeout(() => {
        this.overlay.remove();
        this.overlay = null;
      }, 300);
      document.removeEventListener('keydown', this.handleEsc);
    }
  }
};

// ============ Device Management ============
const DeviceManager = {
  devices: [],
  
  async loadDevices() {
    try {
      this.devices = await API.get('/api/devices');
      return this.devices;
    } catch (error) {
      Toast.error('Không thể tải danh sách thiết bị');
      return [];
    }
  },
  
  async createDevice(data) {
    try {
      const result = await API.post('/api/devices', data);
      if (result.success) {
        Toast.success('Tạo thiết bị thành công!');
        this.devices.unshift(result.device);
      }
      return result;
    } catch (error) {
      Toast.error(error.message);
      throw error;
    }
  },
  
  async updateDevice(id, data) {
    try {
      const result = await API.put(`/api/devices/${id}`, data);
      if (result.success) {
        Toast.success('Cập nhật thiết bị thành công!');
        const index = this.devices.findIndex(d => d.id === id);
        if (index !== -1) {
          this.devices[index] = result.device;
        }
      }
      return result;
    } catch (error) {
      Toast.error(error.message);
      throw error;
    }
  },
  
  async deleteDevice(id) {
    if (!confirm('Bạn có chắc muốn xóa thiết bị này?')) return;
    
    try {
      await API.delete(`/api/devices/${id}`);
      Toast.success('Xóa thiết bị thành công!');
      this.devices = this.devices.filter(d => d.id !== id);
      return true;
    } catch (error) {
      Toast.error(error.message);
      throw error;
    }
  },
  
  async getQRCode(id) {
    try {
      return await API.get(`/api/devices/${id}/qrcode`);
    } catch (error) {
      Toast.error('Không thể tạo mã QR');
      throw error;
    }
  },
  
  async showDeviceForm(device = null) {
    const isEdit = device !== null;
    const title = isEdit ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới';
    
    // Fetch options
    const [categories, departments] = await Promise.all([
      API.get('/api/categories'),
      API.get('/api/departments')
    ]);
    
    // Determine permissions
    // Determine permissions
    const userRole = Auth.user ? Auth.user.role : '';
    const isInspector = userRole === 'inspector';
    let deptHtml = '';
    
    if (isInspector) {
      // For inspector, force their own department
      const userDeptId = Auth.user.department_id;
      const userDept = departments.find(d => d.id === userDeptId);
      const userDeptName = userDept ? userDept.name : 'Khoa của bạn';
      
      deptHtml = `
        <div class="form-group">
          <label class="form-label">Khoa/Phòng</label>
          <input type="text" class="form-control" value="${userDeptName}" disabled style="background-color: var(--bg-tertiary); color: var(--text-muted);">
          <input type="hidden" name="department_id" value="${userDeptId}">
        </div>
      `;
    } else {
      deptHtml = `
        <div class="form-group">
          <label class="form-label">Khoa/Phòng</label>
          <select class="form-control" name="department_id" required>
            <option value="">-- Chọn khoa phòng --</option>
            ${departments.map(d => `
              <option value="${d.id}" ${device && device.department_id === d.id ? 'selected' : ''}>${d.name}</option>
            `).join('')}
          </select>
        </div>
      `;
    }

    const content = `
      <form id="deviceForm">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tên thiết bị *</label>
            <input type="text" class="form-control" name="name" value="${device?.name || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Loại thiết bị</label>
            <select class="form-control" name="category_id">
              <option value="">-- Chọn loại --</option>
              ${categories.map(c => `
                <option value="${c.id}" ${device && device.category_id === c.id ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Model</label>
            <input type="text" class="form-control" name="model" value="${device?.model || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Số Serial</label>
            <input type="text" class="form-control" name="serial_number" value="${device?.serial_number || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nhà sản xuất</label>
            <input type="text" class="form-control" name="manufacturer" value="${device?.manufacturer || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Vị trí</label>
            <input type="text" class="form-control" name="location" value="${device?.location || ''}">
          </div>
        </div>
        <div class="form-row">
          ${deptHtml}
          <div class="form-group">
            <label class="form-label">Tần suất kiểm tra</label>
            <select class="form-control" name="inspection_frequency">
               <option value="monthly" ${device?.inspection_frequency === 'monthly' ? 'selected' : ''}>Hàng tháng</option>
               <option value="weekly" ${device?.inspection_frequency === 'weekly' ? 'selected' : ''}>Hàng tuần</option>
               <option value="daily" ${device?.inspection_frequency === 'daily' ? 'selected' : ''}>Hàng ngày</option>
               <option value="quarterly" ${device?.inspection_frequency === 'quarterly' ? 'selected' : ''}>Hàng quý</option>
               <option value="yearly" ${device?.inspection_frequency === 'yearly' ? 'selected' : ''}>Hàng năm</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Ngày mua</label>
            <input type="date" class="form-control" name="purchase_date" value="${device?.purchase_date || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Hết hạn bảo hành</label>
            <input type="date" class="form-control" name="warranty_expiry" value="${device?.warranty_expiry || ''}">
          </div>
        </div>
        ${isEdit ? `
          <div class="form-group">
            <label class="form-label">Trạng thái</label>
            <select class="form-control" name="status">
              <option value="active" ${device.status === 'active' ? 'selected' : ''}>Hoạt động</option>
              <option value="maintenance" ${device.status === 'maintenance' ? 'selected' : ''}>Bảo trì</option>
              <option value="inactive" ${device.status === 'inactive' ? 'selected' : ''}>Ngừng hoạt động</option>
            </select>
          </div>
        ` : ''}
        <div class="form-group">
          <label class="form-label">Ghi chú</label>
          <textarea class="form-control" name="notes" rows="3">${device?.notes || ''}</textarea>
        </div>
      </form>
    `;
    
    const footer = `
      <button class="btn btn-secondary" onclick="Modal.close()">Hủy</button>
      <button class="btn btn-primary" onclick="DeviceManager.submitForm('${device?.id || ''}')">
        ${isEdit ? 'Cập nhật' : 'Tạo thiết bị'}
      </button>
    `;
    
    Modal.create(title, content, footer);
  },
  
  async submitForm(deviceId) {
    const form = document.getElementById('deviceForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Handle checkbox explicitly
    data.require_auth = formData.get('require_auth') === 'on';
    
    try {
      if (deviceId) {
        await this.updateDevice(deviceId, data);
      } else {
        await this.createDevice(data);
      }
      Modal.close();
      
      // Reload device list if on devices page
      if (typeof renderDevices === 'function') {
        renderDevices();
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  },
  
  async showQRCode(id) {
    try {
      const result = await this.getQRCode(id);
      
      const content = `
        <div class="qr-container">
          <img src="${result.qrcode}" alt="QR Code">
          <h4>${result.device.name}</h4>
          <p>Model: ${result.device.model || 'N/A'}</p>
          <p>Serial: ${result.device.serial_number || 'N/A'}</p>
          <p style="color: var(--primary-color); margin-top: 12px; font-size: 0.875rem;">Quét mã QR để kiểm tra thiết bị</p>
          ${result.url ? `<p style="margin-top: 8px; font-size: 0.75rem; color: var(--text-muted); word-break: break-all;">${result.url}</p>` : ''}
        </div>
      `;
      
      const footer = `
        <button class="btn btn-secondary" onclick="Modal.close()">Đóng</button>
        <button class="btn btn-primary" onclick="DeviceManager.printQR()">
          🖨️ In mã QR
        </button>
      `;
      
      Modal.create('Mã QR Thiết bị', content, footer);
    } catch (error) {
      console.error('Error showing QR code:', error);
    }
  },
  
  printQR() {
    const qrContainer = document.querySelector('.qr-container');
    if (!qrContainer) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>In mã QR thiết bị</title>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            font-family: Arial, sans-serif;
          }
          .qr-print {
            text-align: center;
            padding: 20px;
            border: 2px solid #333;
            border-radius: 8px;
          }
          .qr-print img { max-width: 250px; margin-bottom: 16px; }
          .qr-print h4 { margin: 8px 0; font-size: 18px; }
          .qr-print p { margin: 4px 0; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="qr-print">
          ${qrContainer.innerHTML}
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  },
  
  getStatusBadge(status) {
    const statusMap = {
      active: { text: 'Hoạt động', class: 'badge-success' },
      maintenance: { text: 'Bảo trì', class: 'badge-warning' },
      inactive: { text: 'Ngừng HD', class: 'badge-danger' }
    };
    
    const s = statusMap[status] || { text: status, class: 'badge-info' };
    return `<span class="badge ${s.class}">${s.text}</span>`;
  }
};

// ============ Inspection Management ============
const InspectionManager = {
  async submitInspection(data) {
    try {
      const result = await API.post('/api/inspections', data);
      if (result.success) {
        Toast.success('Ghi nhận kiểm tra thành công!');
      }
      return result;
    } catch (error) {
      Toast.error(error.message);
      throw error;
    }
  },
  
  async getInspections(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      return await API.get(`/api/inspections?${queryString}`);
    } catch (error) {
      Toast.error('Không thể tải lịch sử kiểm tra');
      return [];
    }
  },
  
  getStatusBadge(status) {
    const statusMap = {
      good: { text: 'Tốt', class: 'badge-success' },
      issue: { text: 'Có vấn đề', class: 'badge-warning' },
      critical: { text: 'Nghiêm trọng', class: 'badge-danger' }
    };
    
    const s = statusMap[status] || { text: status, class: 'badge-info' };
    return `<span class="badge ${s.class}">${s.text}</span>`;
  }
};

// ============ Statistics ============
const Statistics = {
  async load(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      return await API.get(`/api/statistics?${queryString}`);
    } catch (error) {
      Toast.error('Không thể tải thống kê');
      return null;
    }
  }
};

// ============ Utility Functions ============
const Utils = {
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  },
  
  formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatTimeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Vừa xong';
    
    const intervals = {
      năm: 31536000,
      tháng: 2592000,
      ngày: 86400,
      giờ: 3600,
      phút: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit} trước`;
      }
    }
    return 'Vừa xong';
  },
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// ============ Initialize ============
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  Toast.init();
});
