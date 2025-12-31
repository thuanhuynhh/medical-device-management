/**
 * Script tạo dữ liệu test cho hệ thống
 * Chạy: node seed-data.js
 */

const Database = require('better-sqlite3');
const crypto = require('crypto');

const db = new Database('devices.db');

// Sample devices for Radiology department
const devices = [
  {
    name: 'Máy X-quang DR',
    model: 'DRX-Evolution',
    serial_number: 'XR2024001',
    manufacturer: 'Carestream',
    location: 'Phòng X-quang số 1',
    department: 'Chẩn đoán hình ảnh',
    status: 'active'
  },
  {
    name: 'Máy CT Scanner 64 lát',
    model: 'Aquilion Prime SP',
    serial_number: 'CT2024002',
    manufacturer: 'Canon Medical',
    location: 'Phòng CT',
    department: 'Chẩn đoán hình ảnh',
    status: 'active'
  },
  {
    name: 'Máy MRI 1.5T',
    model: 'Vantage Orian',
    serial_number: 'MR2024003',
    manufacturer: 'Canon Medical',
    location: 'Phòng MRI',
    department: 'Chẩn đoán hình ảnh',
    status: 'active'
  },
  {
    name: 'Máy siêu âm tổng quát',
    model: 'LOGIQ E10',
    serial_number: 'US2024004',
    manufacturer: 'GE Healthcare',
    location: 'Phòng siêu âm số 1',
    department: 'Chẩn đoán hình ảnh',
    status: 'active'
  },
  {
    name: 'Máy siêu âm tim',
    model: 'Vivid E95',
    serial_number: 'US2024005',
    manufacturer: 'GE Healthcare',
    location: 'Phòng siêu âm tim mạch',
    department: 'Chẩn đoán hình ảnh',
    status: 'active'
  },
  {
    name: 'Máy C-Arm di động',
    model: 'Cios Spin',
    serial_number: 'CA2024006',
    manufacturer: 'Siemens Healthineers',
    location: 'Phòng mổ',
    department: 'Chẩn đoán hình ảnh',
    status: 'maintenance'
  },
  {
    name: 'Máy X-quang di động',
    model: 'Mobilett Elara Max',
    serial_number: 'XR2024007',
    manufacturer: 'Siemens Healthineers',
    location: 'Khoa ICU',
    department: 'Chẩn đoán hình ảnh',
    status: 'active'
  },
  {
    name: 'Máy đo loãng xương DEXA',
    model: 'Horizon DXA',
    serial_number: 'DX2024008',
    manufacturer: 'Hologic',
    location: 'Phòng DEXA',
    department: 'Chẩn đoán hình ảnh',
    status: 'active'
  },
  {
    name: 'Máy chụp nhũ ảnh Mammography',
    model: 'Senographe Pristina',
    serial_number: 'MM2024009',
    manufacturer: 'GE Healthcare',
    location: 'Phòng nhũ ảnh',
    department: 'Chẩn đoán hình ảnh',
    status: 'active'
  },
  {
    name: 'Máy X-quang Panorama nha khoa',
    model: 'ORTHOPANTOMOGRAPH OP 3D',
    serial_number: 'XR2024010',
    manufacturer: 'KaVo Kerr',
    location: 'Phòng X-quang nha',
    department: 'Chẩn đoán hình ảnh',
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
db.prepare('DELETE FROM inspections').run();
db.prepare('DELETE FROM devices').run();

console.log('📱 Thêm thiết bị...');
const insertDevice = db.prepare(`
  INSERT INTO devices (id, name, model, serial_number, manufacturer, location, department, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
`);

const deviceIds = [];
devices.forEach((device, index) => {
  const id = crypto.randomUUID();
  deviceIds.push(id);
  insertDevice.run(
    id,
    device.name,
    device.model,
    device.serial_number,
    device.manufacturer,
    device.location,
    device.department,
    device.status,
    Math.floor(Math.random() * 60) + 30 // 30-90 ngày trước
  );
  console.log(`  ✅ ${device.name}`);
});

console.log('\n📋 Thêm lịch sử kiểm tra...');
const insertInspection = db.prepare(`
  INSERT INTO inspections (device_id, inspector_name, status, notes, inspection_date)
  VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' days', '+' || ? || ' hours'))
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
    
    insertInspection.run(deviceId, inspector, status, notes, daysAgo, hour);
    inspectionCount++;
  }
}

console.log(`  ✅ Đã thêm ${inspectionCount} lần kiểm tra`);

// Summary
const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
const totalInspections = db.prepare('SELECT COUNT(*) as count FROM inspections').get().count;

console.log('\n📊 Tổng kết:');
console.log(`  - Thiết bị: ${deviceCount}`);
console.log(`  - Lịch sử kiểm tra: ${totalInspections}`);

console.log('\n✅ Hoàn tất tạo dữ liệu test!');
db.close();
