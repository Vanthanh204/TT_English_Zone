const db = require('../config/db');

const Course = {
  create: async (courseData) => {
    const { TenKhoaHoc, HocPhi, SoBuoiHoc, ThoiLuong, TrinhDo, TrangThai } = courseData;
    
    // Tự động sinh MaKhoaHoc (ví dụ: KH006)
    const MaKhoaHoc = await db.generateNextId('khoahoc', 'MaKhoaHoc', 'KH');
    
    await db.execute(
      `INSERT INTO khoahoc (MaKhoaHoc, TenKhoaHoc, HocPhi, SoBuoiHoc, ThoiLuong, TrinhDo, TrangThai) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        MaKhoaHoc,
        TenKhoaHoc,
        HocPhi,
        SoBuoiHoc,
        ThoiLuong,
        TrinhDo,
        TrangThai !== undefined ? TrangThai : 1
      ]
    );
    return MaKhoaHoc;
  },

  getAll: async () => {
    const [rows] = await db.execute('SELECT * FROM khoahoc ORDER BY MaKhoaHoc ASC');
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM khoahoc WHERE MaKhoaHoc = ?', [id]);
    return rows[0];
  },

  update: async (id, courseData) => {
    const { TenKhoaHoc, HocPhi, SoBuoiHoc, ThoiLuong, TrinhDo, TrangThai } = courseData;
    const [result] = await db.execute(
      `UPDATE khoahoc 
       SET TenKhoaHoc = ?, HocPhi = ?, SoBuoiHoc = ?, ThoiLuong = ?, TrinhDo = ?, TrangThai = ? 
       WHERE MaKhoaHoc = ?`,
      [TenKhoaHoc, HocPhi, SoBuoiHoc, ThoiLuong, TrinhDo, TrangThai, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM khoahoc WHERE MaKhoaHoc = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Course;
