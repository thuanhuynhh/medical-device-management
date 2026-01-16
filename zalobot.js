/**
 * Zalo Bot Integration Module
 * Gửi thông báo qua Zalo khi có kiểm tra thiết bị
 * Subscribers được lưu vào database để persist qua restarts
 */

const axios = require('axios');

// Zalo Bot Configuration - loaded from database only
let BOT_TOKEN = '';

// Get current API URL based on token
function getApiUrl() {
  if (!BOT_TOKEN) return null;
  return `https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}`;
}

// Check if bot is configured
function isConfigured() {
  return !!BOT_TOKEN;
}

// Database reference (will be set via init)
let db = null;

/**
 * Initialize with database connection
 * @param {Object} database - better-sqlite3 database instance
 */
function init(database) {
  db = database;
  // Load token from database
  loadTokenFromDb();
  const count = getNotificationChatIds().length;
  console.log(`✅ Zalo Bot: Database initialized with ${count} subscribers`);
}

/**
 * Load Zalo token from database
 */
function loadTokenFromDb() {
  if (!db) return;
  try {
    const config = db.prepare("SELECT value FROM system_config WHERE key = 'zalo_token'").get();
    if (config && config.value) {
      BOT_TOKEN = config.value;
      console.log('✅ Zalo Bot: Token loaded from database');
    } else {
      BOT_TOKEN = '';
      console.log('⚠️ Zalo Bot: No token configured');
    }
  } catch (e) {
    BOT_TOKEN = '';
    console.error('❌ Zalo Bot: Error loading token:', e.message);
  }
}

/**
 * Update Zalo token
 */
function setToken(newToken) {
  BOT_TOKEN = newToken;
  console.log('✅ Zalo Bot: Token updated');
}

/**
 * Disconnect bot (clear token)
 */
function disconnect() {
  stopPolling();
  BOT_TOKEN = '';
  console.log('⏹️ Zalo Bot: Disconnected');
}

/**
 * Get current token (masked for display)
 */
function getTokenMasked() {
  if (!BOT_TOKEN) return '';
  if (BOT_TOKEN.length > 20) {
    return BOT_TOKEN.substring(0, 10) + '...' + BOT_TOKEN.substring(BOT_TOKEN.length - 10);
  }
  return BOT_TOKEN;
}

/**
 * Gửi tin nhắn văn bản qua Zalo Bot
 */
async function sendMessage(chatId, text) {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    // console.log('⚠️ Zalo: Bot chưa cấu hình token');
    return null;
  }
  try {
    const response = await axios.post(`${apiUrl}/sendMessage`, {
      chat_id: chatId,
      text: text.substring(0, 2000)
    });
    
    if (response.data.ok) {
      console.log(`✅ Zalo: Đã gửi tin nhắn đến ${chatId}`);
      return response.data;
    } else {
      console.error(`❌ Zalo: Lỗi gửi tin nhắn:`, response.data);
      return null;
    }
  } catch (error) {
    console.error(`❌ Zalo: Lỗi kết nối:`, error.message);
    return null;
  }
}

/**
 * Kiểm tra kết nối Bot
 */
async function testConnection() {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    // console.log('⚠️ Zalo: Bot chưa cấu hình token');
    return null;
  }
  try {
    const response = await axios.post(`${apiUrl}/getMe`);
    if (response.data.ok) {
      console.log('✅ Zalo Bot connected:', response.data.result);
      return response.data.result;
    }
    return null;
  } catch (error) {
    console.error('❌ Zalo Bot connection failed:', error.message);
    return null;
  }
}

/**
 * Gửi thông báo kiểm tra thiết bị
 */
async function sendInspectionNotification(inspection, device) {
  const statusEmoji = { good: '✅', issue: '⚠️', critical: '🚨' };
  const statusText = { good: 'Tốt', issue: 'Có vấn đề', critical: 'Nghiêm trọng' };
  
  const emoji = statusEmoji[inspection.status] || '📋';
  const status = statusText[inspection.status] || inspection.status;
  
  const now = new Date();
  const timeStr = now.toLocaleString('vi-VN', { 
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  
  let message = `🏥 THÔNG BÁO KIỂM TRA THIẾT BỊ\n\n`;
  message += `📱 Thiết bị: ${device.name}\n`;
  if (device.model) message += `📦 Model: ${device.model}\n`;
  message += `📍 Vị trí: ${device.location || 'N/A'}\n`;
  message += `👤 Người kiểm tra: ${inspection.inspector_name}\n`;
  message += `${emoji} Trạng thái: ${status}\n`;
  message += `🕐 Thời gian: ${timeStr}`;
  
  if (inspection.issues) message += `\n\n⚠️ Vấn đề:\n${inspection.issues}`;
  if (inspection.notes) message += `\n\n📝 Ghi chú:\n${inspection.notes}`;
  
  // Add image info if available
  if (inspection.images) {
    const images = JSON.parse(inspection.images);
    if (images.length > 0) message += `\n\n📷 Có ${images.length} ảnh đính kèm`;
  }
  
  // Find subscribers to notify: Admins + Inspectors of this department
  let subscribers = [];
  if (db) {
    try {
      const deptId = device.department_id;
      // Select Zalo IDs of Admins AND (Inspectors/Technicians of the same department)
      const users = db.prepare(`
        SELECT zalo_user_id FROM users 
        WHERE zalo_user_id IS NOT NULL 
        AND (role = 'admin' OR (department_id = ? AND role IN ('inspector', 'technician')))
      `).all(deptId);
      
      subscribers = users.map(u => u.zalo_user_id).filter(id => id); // Filter valid IDs
      // Deduplicate
      subscribers = [...new Set(subscribers)];
      
    } catch(e) {
      console.error('❌ Zalo: Error finding subscribers:', e.message);
      subscribers = getNotificationChatIds(); // Fallback to old list if query fails
    }
  } else {
    subscribers = getNotificationChatIds();
  }

  if (subscribers.length === 0) {
    console.log('⚠️ Zalo: No target subscribers found for this notification');
    return [];
  }
  
  const results = [];
  for (const chatId of subscribers) {
    // Send text message first
    const result = await sendMessage(chatId, message);
    results.push({ chatId, success: !!result });
    
    // Send images if available (Zalo Bot API uses sendPhoto)
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      try {
        // Convert relative URL to absolute if needed
        // Get domain from database config or use default
        let baseUrl = 'https://quanly.nhoctf.xyz';
        if (db) {
          try {
            const config = db.prepare("SELECT value FROM system_config WHERE key = 'domain_url'").get();
            if (config && config.value) {
              baseUrl = config.value.startsWith('http') ? config.value : `https://${config.value}`;
            }
          } catch (e) { /* ignore */ }
        }
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
        console.log(`📷 Zalo: Đang gửi ảnh ${i+1}/${images.length}: ${fullUrl}`);
        
        const response = await axios.post(`${getApiUrl()}/sendPhoto`, {
          chat_id: chatId,
          photo: fullUrl,
          caption: `Ảnh ${i+1}/${images.length} - ${device.name}`
        });
        
        if (response.data.ok) {
          console.log(`✅ Zalo: Đã gửi ảnh ${i+1} đến ${chatId}`);
        } else {
          console.error(`❌ Zalo: Lỗi gửi ảnh:`, response.data);
        }
      } catch (err) {
        console.error(`❌ Zalo: Lỗi gửi ảnh:`, err.response?.data || err.message);
      }
    }
  }
  return results;
}

/**
 * Thêm subscriber vào database
 */
function addNotificationChatId(chatId, displayName = '') {
  if (!db) {
    console.error('❌ Zalo: Database not initialized');
    return false;
  }
  try {
    db.prepare("INSERT OR IGNORE INTO zalo_subscribers (chat_id, display_name) VALUES (?, ?)").run(chatId, displayName);
    console.log(`✅ Zalo: Đã lưu ${chatId} (${displayName}) vào database`);
    return true;
  } catch (e) {
    console.error('❌ Zalo: Lỗi lưu subscriber:', e.message);
    return false;
  }
}

/**
 * Xóa subscriber khỏi database
 */
function removeNotificationChatId(chatId) {
  if (!db) return false;
  try {
    db.prepare("DELETE FROM zalo_subscribers WHERE chat_id = ?").run(chatId);
    console.log(`✅ Zalo: Đã xóa ${chatId} khỏi database`);
    return true;
  } catch (e) {
    console.error('❌ Zalo: Lỗi xóa subscriber:', e.message);
    return false;
  }
}

/**
 * Lấy danh sách subscribers từ database
 */
function getNotificationChatIds() {
  if (!db) return [];
  try {
    const rows = db.prepare("SELECT chat_id FROM zalo_subscribers").all();
    return rows.map(r => r.chat_id);
  } catch (e) {
    console.error('❌ Zalo: Lỗi đọc subscribers:', e.message);
    return [];
  }
}

/**
 * Xử lý tin nhắn từ getUpdates (polling)
 */
async function processUpdate(update) {
  if (!update.message) return null;
  
  const message = update.message;
  const chatId = message.chat?.id;
  const text = message.text || '';
  const displayName = message.from?.display_name || 'Người dùng';
  
  console.log(`📨 Zalo: Nhận tin từ ${displayName} (${chatId}): ${text}`);
  
  if (text.toLowerCase() === '/dangky' || text.toLowerCase() === '/register' || text.toLowerCase() === '/id') {
    await sendMessage(chatId, `🆔 Zalo ID của bạn là: ${chatId}\n\nHãy nhập ID này vào trang quản lý User để nhận thông báo liên quan đến khoa phòng của bạn.`);
    return { action: 'id_requested', chatId };
  }
  
  if (text.toLowerCase() === '/start') {
    await sendMessage(chatId, `Xin chào ${displayName}! 👋\n\nĐây là Bot Quản lý Thiết bị Y tế.\n\nGửi "/dangky" để lấy ID và nhập vào hệ thống để nhận thông báo.`);
    return { action: 'start', chatId };
  }
  
  if (text.toLowerCase() === 'hủy' || text.toLowerCase() === '/stop') {
    removeNotificationChatId(chatId);
    await sendMessage(chatId, `Bạn đã hủy đăng ký nhận thông báo. 👋\n\nGửi "đăng ký" để nhận lại.`);
    return { action: 'unsubscribed', chatId };
  }
  
  if (text.toLowerCase() === 'test') {
    await sendMessage(chatId, `🧪 Tin nhắn thử nghiệm\n\nHệ thống hoạt động bình thường!\nChat ID: ${chatId}`);
    return { action: 'test', chatId };
  }
  
  await sendMessage(chatId, `Xin chào ${displayName}! 👋\n\nGửi "đăng ký" để nhận thông báo kiểm tra thiết bị.`);
  return { action: 'info', chatId };
}

/**
 * Xử lý webhook từ Zalo Bot
 */
async function handleWebhook(body) {
  if (!body.ok || !body.result) return null;
  
  const result = body.result;
  const message = result.message;
  if (!message) return null;
  
  return processUpdate({ message });
}

/**
 * Polling
 */
let pollingActive = false;
let pollingInterval = null;

async function startPolling(intervalMs = 1000) {
  if (pollingActive) {
    console.log('⚠️ Zalo: Polling đã đang chạy');
    return;
  }
  
  pollingActive = true;
  console.log('🔄 Zalo: Bắt đầu polling để nhận tin nhắn...');
  
  const poll = async () => {
    if (!pollingActive) return;
    
    try {
      const response = await axios.post(`${getApiUrl()}/getUpdates`, { timeout: 30 }, { timeout: 35000 });
      
      if (response.data.ok && response.data.result) {
        const updates = Array.isArray(response.data.result) ? response.data.result : [response.data.result];
        for (const update of updates) {
          if (update.message) await processUpdate(update);
        }
      }
    } catch (error) {
      if (error.code !== 'ECONNABORTED') {
        console.error('❌ Zalo polling error:', error.message);
      }
    }
    
    if (pollingActive) pollingInterval = setTimeout(poll, intervalMs);
  };
  
  poll();
}

function stopPolling() {
  pollingActive = false;
  if (pollingInterval) {
    clearTimeout(pollingInterval);
    pollingInterval = null;
  }
  console.log('⏹️ Zalo: Đã dừng polling');
}

function isPolling() {
  return pollingActive;
}

module.exports = {
  init,
  sendMessage,
  sendInspectionNotification,
  testConnection,
  addNotificationChatId,
  removeNotificationChatId,
  getNotificationChatIds,
  handleWebhook,
  processUpdate,
  startPolling,
  stopPolling,
  isPolling,
  setToken,
  getTokenMasked,
  loadTokenFromDb,
  disconnect,
  isConfigured
};
