const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  create: async (userData) => {
    const { HoTen, ChucVu, SoDienThoai, Email, DiaChi, TenTaiKhoan, MatKhau, NgayVaoLam, NgaySinh, GioiTinh } = userData;
    
    // Tự động tạo MaNhanVien mới (ví dụ NV005)
    const MaNhanVien = await db.generateNextId('NhanVien', 'MaNhanVien', 'NV');
    
    const hashedPassword = await bcrypt.hash(MatKhau, 10);
    
    const [result] = await db.execute(
      `INSERT INTO NhanVien (MaNhanVien, HoTen, ChucVu, SoDienThoai, Email, DiaChi, TenTaiKhoan, MatKhau, NgayVaoLam, NgaySinh, GioiTinh, TrangThai) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [MaNhanVien, HoTen, ChucVu, SoDienThoai, Email, DiaChi, TenTaiKhoan, hashedPassword, NgayVaoLam, NgaySinh, GioiTinh]
    );
    
    return MaNhanVien;
  },

  findByUsername: async (username) => {
    const [rows] = await db.execute(
      'SELECT * FROM NhanVien WHERE TenTaiKhoan = ?',
      [username]
    );
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      'SELECT * FROM NhanVien WHERE MaNhanVien = ?',
      [id]
    );
    return rows[0];
  },

  getAll: async () => {
    const [rows] = await db.execute('SELECT * FROM NhanVien');
    return rows;
  }
};

module.exports = User;
