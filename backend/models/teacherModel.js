const db = require('../config/db');

const Teacher = {
  create: async (teacherData) => {
    const { HoTen, SoDienThoai, Email, DiaChi, TrangThai, TenTaiKhoan, MatKhau, NgayVaoLam, NgaySinh, GioiTinh } = teacherData;
    
    // Tự động sinh MaNhanVien mới (ví dụ: NV005)
    const MaNhanVien = await db.generateNextId('nhanvien', 'MaNhanVien', 'NV');

    await db.execute(
      `INSERT INTO nhanvien (MaNhanVien, HoTen, ChucVu, SoDienThoai, Email, DiaChi, TrangThai, TenTaiKhoan, MatKhau, NgayVaoLam, NgaySinh, GioiTinh) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        MaNhanVien,
        HoTen,
        'Giáo viên',
        SoDienThoai,
        Email,
        DiaChi || null,
        TrangThai !== undefined ? TrangThai : 1,
        TenTaiKhoan,
        MatKhau,
        NgayVaoLam || new Date(),
        NgaySinh,
        GioiTinh
      ]
    );
    return MaNhanVien;
  },

  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT MaNhanVien, HoTen, ChucVu, SoDienThoai, Email, DiaChi, TrangThai, NgayVaoLam, NgaySinh, GioiTinh 
      FROM nhanvien 
      WHERE ChucVu = 'Giáo viên' AND TrangThai = 1
      ORDER BY MaNhanVien ASC
    `);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT MaNhanVien, HoTen, ChucVu, SoDienThoai, Email, DiaChi, TrangThai, NgayVaoLam, NgaySinh, GioiTinh 
      FROM nhanvien 
      WHERE MaNhanVien = ? AND ChucVu = 'Giáo viên'
    `, [id]);
    return rows[0];
  },

  update: async (id, teacherData) => {
    const { HoTen, SoDienThoai, Email, DiaChi, TrangThai, NgaySinh, GioiTinh } = teacherData;
    const [result] = await db.execute(
      `UPDATE nhanvien 
       SET HoTen = ?, SoDienThoai = ?, Email = ?, DiaChi = ?, TrangThai = ?, NgaySinh = ?, GioiTinh = ? 
       WHERE MaNhanVien = ? AND ChucVu = 'Giáo viên'`,
      [HoTen, SoDienThoai, Email, DiaChi, TrangThai, NgaySinh, GioiTinh, id]
    );
    return result.affectedRows;
  }
};

module.exports = Teacher;
