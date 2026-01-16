/**
 * Script tạo dữ liệu test cho hệ thống
 * Chạy: node seed-data.js
 */

const Database = require('better-sqlite3');
const crypto = require('crypto');

// Function to seed data using a provided database connection
function seedData(db) {
  try {
      // Sample departments
      const departments = [
        { name: 'Chẩn đoán hình ảnh', description: 'Khoa Chẩn đoán hình ảnh' },
        { name: 'Hồi sức tích cực', description: 'Khoa Hồi sức tích cực - Chống độc' },
        { name: 'Cấp cứu', description: 'Khoa Cấp cứu' },
        { name: 'Phòng mổ', description: 'Khu vực phẫu thuật' },
        { name: 'X-quang Nha', description: 'Khu vực chụp X-quang nha khoa' }
      ];

      // Sample categories
      const categories = [
        { name: 'X-quang', description: 'Máy X-quang các loại', color: '#0ea5e9' },
        { name: 'CT Scanner', description: 'Máy chụp cắt lớp vi tính', color: '#8b5cf6' },
        { name: 'MRI', description: 'Máy cộng hưởng từ', color: '#ec4899' },
        { name: 'Siêu âm', description: 'Máy siêu âm các loại', color: '#10b981' },
        { name: 'Nội soi', description: 'Hệ thống nội soi', color: '#f59e0b' }
      ];

      // Sample devices with category names (will be mapped to IDs)
      const devices = [
        {
          name: 'Máy X-quang DR',
          model: 'DRX-Evolution',
          serial_number: 'XR2024001',
          manufacturer: 'Carestream',
          location: 'Phòng X-quang số 1',
          department: 'Chẩn đoán hình ảnh',
          category: 'X-quang',
          status: 'active'
        },
        {
          name: 'Máy CT Scanner 64 lát',
          model: 'Aquilion Prime SP',
          serial_number: 'CT2024002',
          manufacturer: 'Canon Medical',
          location: 'Phòng CT',
          department: 'Chẩn đoán hình ảnh',
          category: 'CT Scanner',
          status: 'active'
        },
        {
          name: 'Máy MRI 1.5T',
          model: 'Vantage Orian',
          serial_number: 'MR2024003',
          manufacturer: 'Canon Medical',
          location: 'Phòng MRI',
          department: 'Chẩn đoán hình ảnh',
          category: 'MRI',
          status: 'active'
        },
        {
          name: 'Máy siêu âm tổng quát',
          model: 'LOGIQ E10',
          serial_number: 'US2024004',
          manufacturer: 'GE Healthcare',
          location: 'Phòng siêu âm số 1',
          department: 'Chẩn đoán hình ảnh',
          category: 'Siêu âm',
          status: 'active'
        },
        {
          name: 'Máy siêu âm tim',
          model: 'Vivid E95',
          serial_number: 'US2024005',
          manufacturer: 'GE Healthcare',
          location: 'Phòng siêu âm tim mạch',
          department: 'Chẩn đoán hình ảnh',
          category: 'Siêu âm',
          status: 'active'
        },
        {
          name: 'Máy C-Arm di động',
          model: 'Cios Spin',
          serial_number: 'CA2024006',
          manufacturer: 'Siemens Healthineers',
          location: 'Phòng mổ',
          department: 'Chẩn đoán hình ảnh',
          category: 'X-quang',
          status: 'maintenance'
        },
        {
          name: 'Máy X-quang di động',
          model: 'Mobilett Elara Max',
          serial_number: 'XR2024007',
          manufacturer: 'Siemens Healthineers',
          location: 'Khoa ICU',
          department: 'Hồi sức tích cực',
          category: 'X-quang',
          status: 'active'
        },
        {
          name: 'Máy nội soi tiêu hóa',
          model: 'Evis X1',
          serial_number: 'NS2024008',
          manufacturer: 'Olympus',
          location: 'Phòng nội soi',
          department: 'Chẩn đoán hình ảnh',
          category: 'Nội soi',
          status: 'active'
        },
        {
          name: 'Máy chụp nhũ ảnh Mammography',
          model: 'Senographe Pristina',
          serial_number: 'MM2024009',
          manufacturer: 'GE Healthcare',
          location: 'Phòng nhũ ảnh',
          department: 'Chẩn đoán hình ảnh',
          category: 'X-quang',
          status: 'active'
        },
        {
          name: 'Máy X-quang Panorama nha khoa',
          model: 'ORTHOPANTOMOGRAPH OP 3D',
          serial_number: 'XR2024010',
          manufacturer: 'KaVo Kerr',
          location: 'Phòng X-quang nha',
          department: 'Chẩn đoán hình ảnh',
          category: 'X-quang',
          status: 'inactive'
        }
      ];

      // Sample inspectors
      const inspectors = [
        'Nguyễn Văn An',
        'Trần Thị Bình',
        'Lê Văn Cường',
        'Phạm Thị Dung',
        'Hoàng Văn Em'
      ];

      // Statuses for inspections
      const statuses = ['good', 'good', 'good', 'good', 'issue', 'critical'];

      console.log('🗑️  Xóa dữ liệu cũ...');
      // Disable foreign keys temporarily to delete without constraints issues if needed
      try { db.prepare('DELETE FROM ticket_replies').run(); } catch(e) {}
      try { db.prepare('DELETE FROM incident_tickets').run(); } catch(e) {}
      try { db.prepare('DELETE FROM inspections').run(); } catch(e) {}
      try { db.prepare('DELETE FROM devices').run(); } catch(e) {}
      try { db.prepare('DELETE FROM departments').run(); } catch(e) {}
      try { db.prepare('DELETE FROM device_categories').run(); } catch(e) {}
      
      // Clean up demo users if they exist
      try { db.prepare("DELETE FROM users WHERE username IN ('demo', 'tech', 'viewer') OR username LIKE 'user%'").run(); } catch(e) {}


      console.log('🏥 Thêm khoa phòng...');
      const insertDep = db.prepare("INSERT INTO departments (name, description) VALUES (?, ?)");
      const depMap = new Map(); // Name -> ID
      departments.forEach(dep => {
        try {
          const info = insertDep.run(dep.name, dep.description);
          depMap.set(dep.name, info.lastInsertRowid);
        } catch(e) {
          // If exists, try to get ID (e.g. running multiple times or setup context)
           try {
              const row = db.prepare("SELECT id FROM departments WHERE name = ?").get(dep.name);
              if (row) depMap.set(dep.name, row.id);
          } catch(ex) {}
        }
      });

      console.log('🏷️ Thêm loại thiết bị...');
      const insertCat = db.prepare("INSERT INTO device_categories (name, description, color) VALUES (?, ?, ?)");
      const catMap = new Map(); // Name -> ID
      categories.forEach(cat => {
        try {
          const info = insertCat.run(cat.name, cat.description, cat.color);
          catMap.set(cat.name, info.lastInsertRowid);
        } catch(e) {
           try {
              const row = db.prepare("SELECT id FROM device_categories WHERE name = ?").get(cat.name);
              if (row) catMap.set(cat.name, row.id);
          } catch(ex) {}
        }
      });

      console.log('👥 Thêm User Demo...');
      const insertUser = db.prepare("INSERT INTO users (username, password, full_name, role, department_id, active) VALUES (?, ?, ?, ?, ?, 1)");
      
      const demoDepId = depMap.get('Chẩn đoán hình ảnh');

      // Demo user (Inspector)
      try { insertUser.run('demo', 'demo', 'Demo User', 'inspector', demoDepId); } catch(e) {}
      // Tech user
      try { insertUser.run('tech', '123456', 'Kỹ thuật viên', 'technician', demoDepId); } catch(e) {}
      // Viewer user
      try { insertUser.run('viewer', '123456', 'Quan sát viên', 'viewer', demoDepId); } catch(e) {}

      // Get user IDs for future use
      const demoUserId = db.prepare("SELECT id FROM users WHERE username = 'demo'").get()?.id;
      const techUserId = db.prepare("SELECT id FROM users WHERE username = 'tech'").get()?.id;

      console.log('📱 Thêm thiết bị...');
      const insertDevice = db.prepare(`
        INSERT INTO devices (id, name, model, serial_number, manufacturer, location, department, department_id, category_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
      `);

      const deviceIds = [];
      devices.forEach((device, index) => {
        const id = crypto.randomUUID();
        deviceIds.push(id);
        
        const depId = depMap.get(device.department) || null;
        const catId = catMap.get(device.category) || null;
        
        try {
          insertDevice.run(
            id,
            device.name,
            device.model,
            device.serial_number,
            device.manufacturer,
            device.location,
            device.department,
            depId,
            catId,
            device.status,
            Math.floor(Math.random() * 60) + 30 // 30-90 ngày trước
          );
          console.log(`  ✅ ${device.name}`);
        } catch(e) {}
      });

      console.log('\n📋 Thêm lịch sử kiểm tra...');
      const insertInspection = db.prepare(`
        INSERT INTO inspections (device_id, inspector_name, user_id, status, notes, inspection_date)
        VALUES (?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days', '+' || ? || ' hours'))
      `);

      // Generate inspections for the past 30 days
      let inspectionCount = 0;
      for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
        // Random number of inspections per day (3-8)
        const inspectionsPerDay = Math.floor(Math.random() * 6) + 3;
        
        for (let i = 0; i < inspectionsPerDay; i++) {
          const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
          const inspector = inspectors[Math.floor(Math.random() * inspectors.length)];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const hour = Math.floor(Math.random() * 10) + 7; // 7-17h
          
          let notes = '';
          if (status === 'good') {
            notes = ['Thiết bị hoạt động bình thường', 'Đã kiểm tra, OK', 'Không có vấn đề', ''][Math.floor(Math.random() * 4)];
          } else if (status === 'issue') {
            notes = ['Cần vệ sinh bộ lọc', 'Màn hình hiển thị mờ', 'Tiếng ồn bất thường nhẹ'][Math.floor(Math.random() * 3)];
          } else {
            notes = ['Máy không khởi động được', 'Lỗi hệ thống, cần sửa chữa'][Math.floor(Math.random() * 2)];
          }
          
          // Randomize user_id for inspection (sometimes demo user, sometimes null/legacy)
          const userId = Math.random() > 0.5 ? demoUserId : null;
          
          try {
            insertInspection.run(deviceId, inspector, userId, status, notes, daysAgo, hour);
            inspectionCount++;
          } catch(e) {}
        }
      }
      console.log(`  ✅ Đã thêm ${inspectionCount} lần kiểm tra`);

      console.log('\n🎫 Thêm sự cố (Tickets)...');
      const insertTicket = db.prepare(`
        INSERT INTO incident_tickets (device_id, title, description, status, priority, created_by, assigned_to, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
      `);

      // Sample tickets
      const ticketSamples = [
        { title: 'Máy báo lỗi E04', desc: 'Máy báo lỗi E04 khi khởi động, cần kiểm tra gấp', priority: 'high', status: 'open' },
        { title: 'Hỏng bàn phím', desc: 'Phím Enter bị liệt', priority: 'low', status: 'assigned' },
        { title: 'Màn hình chập chờn', desc: 'Màn hình thỉnh thoảng bị tắt', priority: 'medium', status: 'resolved' },
        { title: 'Cần bảo dưỡng định kỳ', desc: 'Đến hạn bảo dưỡng 6 tháng', priority: 'medium', status: 'open' }
      ];

      let ticketCount = 0;
      for (let i = 0; i < 10; i++) {
        const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
        const sample = ticketSamples[Math.floor(Math.random() * ticketSamples.length)];
        const daysAgo = Math.floor(Math.random() * 20);
        
        let assignedTo = null;
        if (sample.status !== 'open') {
          assignedTo = techUserId;
        }
        
        try {
          insertTicket.run(deviceId, sample.title, sample.desc, sample.status, sample.priority, demoUserId, assignedTo, daysAgo);
          ticketCount++;
        } catch(e) {}
      }
      console.log(`  ✅ Đã thêm ${ticketCount} sự cố`);


      // Summary
      const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
      const totalInspections = db.prepare('SELECT COUNT(*) as count FROM inspections').get().count;
      const totalTickets = db.prepare('SELECT COUNT(*) as count FROM incident_tickets').get().count;

      console.log('\n📊 Tổng kết:');
      console.log(`  - Khoa phòng: ${departments.length}`);
      console.log(`  - Loại thiết bị: ${categories.length}`);
      console.log(`  - Thiết bị: ${deviceCount}`);
      console.log(`  - Lịch sử kiểm tra: ${totalInspections}`);
      console.log(`  - Sự cố (Tickets): ${totalTickets}`);
      console.log(`  - User Demo: username='demo', password='demo'`);
      console.log(`  - User Tech: username='tech', password='123456'`);
      console.log(`  - User Viewer: username='viewer', password='123456'`);

      console.log('\n✅ Hoàn tất tạo dữ liệu test!');
  } catch (err) {
      console.error('❌ Lỗi khi tạo dữ liệu demo:', err);
  }
}

// Export the function
module.exports = { seedData };

// If run directly via execute command
if (require.main === module) {
  const db = new Database('devices.db');
  seedData(db);
  db.close();
}

