const db = require('../config/db');

const EnrollmentSession = {
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT d.*, k.TenKhoaHoc,
             (SELECT COUNT(*) FROM khachhangtiemnang l WHERE l.MaDotTuyenSinh = d.MaDotTuyenSinh AND l.TrangThai = 6) AS DaDat
      FROM dottuyensinh d
      JOIN khoahoc k ON d.MaKhoaHoc = k.MaKhoaHoc
      ORDER BY d.MaDotTuyenSinh DESC
    `);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT d.*, k.TenKhoaHoc,
             (SELECT COUNT(*) FROM khachhangtiemnang l WHERE l.MaDotTuyenSinh = d.MaDotTuyenSinh AND l.TrangThai = 6) AS DaDat
      FROM dottuyensinh d
      JOIN khoahoc k ON d.MaKhoaHoc = k.MaKhoaHoc
      WHERE d.MaDotTuyenSinh = ?
    `, [id]);
    return rows[0];
  },

  create: async (data) => {
    const { TenDotTuyenSinh, MaKhoaHoc, TrangThai, NgayBatDau, NgayKetThuc, NgayKhaiGiang, ChiTieu } = data;
    
    // Tự động sinh MaDotTuyenSinh tiếp theo (ví dụ DTS004)
    const MaDotTuyenSinh = await db.generateNextId('dottuyensinh', 'MaDotTuyenSinh', 'DTS');
    
    await db.execute(
      `INSERT INTO dottuyensinh (MaDotTuyenSinh, TenDotTuyenSinh, MaKhoaHoc, TrangThai, NgayBatDau, NgayKetThuc, NgayKhaiGiang, ChiTieu) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        MaDotTuyenSinh,
        TenDotTuyenSinh,
        MaKhoaHoc,
        TrangThai !== undefined ? TrangThai : 1,
        NgayBatDau,
        NgayKetThuc,
        NgayKhaiGiang,
        ChiTieu
      ]
    );
    return MaDotTuyenSinh;
  },

  update: async (id, data) => {
    const { TenDotTuyenSinh, MaKhoaHoc, TrangThai, NgayBatDau, NgayKetThuc, NgayKhaiGiang, ChiTieu } = data;
    const [result] = await db.execute(
      `UPDATE dottuyensinh 
       SET TenDotTuyenSinh = ?, MaKhoaHoc = ?, TrangThai = ?, NgayBatDau = ?, NgayKetThuc = ?, NgayKhaiGiang = ?, ChiTieu = ? 
       WHERE MaDotTuyenSinh = ?`,
      [TenDotTuyenSinh, MaKhoaHoc, TrangThai, NgayBatDau, NgayKetThuc, NgayKhaiGiang, ChiTieu, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await db.execute(
      'DELETE FROM dottuyensinh WHERE MaDotTuyenSinh = ?',
      [id]
    );
    return result.affectedRows;
  }
};

module.exports = EnrollmentSession;
