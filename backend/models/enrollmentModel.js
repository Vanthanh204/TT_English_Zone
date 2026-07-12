const db = require('../config/db');

const Enrollment = {
  create: async (data, connection = db) => {
    const { MaHocVien, MaDotTuyenSinh, MaKhoaHoc, MaLopHoc, NgayDangKy } = data;
    
    // Tự động sinh MaDangKy mới (ví dụ DK001)
    const MaDangKy = await db.generateNextId('dangkyhoc', 'MaDangKy', 'DK');

    await connection.execute(
      `INSERT INTO dangkyhoc (MaDangKy, MaHocVien, MaDotTuyenSinh, MaKhoaHoc, MaLopHoc, TrangThai, NgayDangKy) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        MaDangKy,
        MaHocVien,
        MaDotTuyenSinh,
        MaKhoaHoc,
        MaLopHoc,
        1, // 1: Hoạt động
        NgayDangKy || new Date()
      ]
    );
    return MaDangKy;
  },

  checkExists: async (studentId, classId) => {
    const [rows] = await db.execute(
      'SELECT * FROM dangkyhoc WHERE MaHocVien = ? AND MaLopHoc = ? AND TrangThai = 1',
      [studentId, classId]
    );
    return rows.length > 0;
  }
};

module.exports = Enrollment;
