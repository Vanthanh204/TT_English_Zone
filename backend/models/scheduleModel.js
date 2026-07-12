const db = require('../config/db');

const Schedule = {
  createMany: async (sessions, connection = db) => {
    // sessions is an array of objects: { PhongHoc, NgayHoc, BuoiSo, GioBatDau, GioKetThuc, MaLopHoc }
    const results = [];
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      // Generate next MaLichHoc using LICH prefix
      const MaLichHoc = await db.generateNextId('lichhoc', 'MaLichHoc', 'LICH', connection);
      
      await connection.execute(
        `INSERT INTO lichhoc (MaLichHoc, PhongHoc, NgayHoc, BuoiSo, TrangThai, GioBatDau, GioKetThuc, MaLopHoc) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          MaLichHoc,
          s.PhongHoc || null,
          s.NgayHoc,
          s.BuoiSo,
          1, // 1: Bình thường, 0: Nghỉ / Đã hủy
          s.GioBatDau,
          s.GioKetThuc,
          s.MaLopHoc
        ]
      );
      results.push(MaLichHoc);
    }
    return results;
  },

  getByClassId: async (classId) => {
    const [rows] = await db.execute(
      `SELECT * FROM lichhoc WHERE MaLopHoc = ? ORDER BY BuoiSo ASC`,
      [classId]
    );
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(
      `SELECT * FROM lichhoc WHERE MaLichHoc = ?`,
      [id]
    );
    return rows[0];
  },

  update: async (id, data) => {
    const { PhongHoc, NgayHoc, GioBatDau, GioKetThuc, TrangThai } = data;
    const [result] = await db.execute(
      `UPDATE lichhoc 
       SET PhongHoc = ?, NgayHoc = ?, GioBatDau = ?, GioKetThuc = ?, TrangThai = ? 
       WHERE MaLichHoc = ?`,
      [PhongHoc || null, NgayHoc, GioBatDau, GioKetThuc, TrangThai, id]
    );
    return result.affectedRows;
  },

  deleteByClassId: async (classId, connection = db) => {
    const [result] = await connection.execute(
      `DELETE FROM lichhoc WHERE MaLopHoc = ?`,
      [classId]
    );
    return result.affectedRows;
  }
};

module.exports = Schedule;
