const db = require('../config/db');

const PlacementTest = {
  create: async (data, connection = db) => {
    const { MaKhachHangTiemNang, MaNhanVien, Diem, TrinhDo, NgayKiemTra } = data;
    
    // Tự động sinh MaKetQuaKiemTra mới
    const MaKetQuaKiemTra = await db.generateNextId('ketquakiemtra', 'MaKetQuaKiemTra', 'KQKT');

    await connection.execute(
      `INSERT INTO ketquakiemtra (MaKetQuaKiemTra, MaKhachHangTiemNang, MaNhanVien, Diem, TrinhDo, NgayKiemTra) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        MaKetQuaKiemTra,
        MaKhachHangTiemNang,
        MaNhanVien,
        Diem,
        TrinhDo,
        NgayKiemTra || new Date()
      ]
    );
    return MaKetQuaKiemTra;
  },

  getByLeadId: async (leadId) => {
    const [rows] = await db.execute(`
      SELECT k.*, nv.HoTen as TenGiaoVien 
      FROM ketquakiemtra k
      LEFT JOIN nhanvien nv ON k.MaNhanVien = nv.MaNhanVien
      WHERE k.MaKhachHangTiemNang = ?
    `, [leadId]);
    return rows[0];
  },

  update: async (leadId, testData) => {
    const { MaNhanVien, Diem, TrinhDo, NgayKiemTra } = testData;
    const [result] = await db.execute(
      `UPDATE ketquakiemtra 
       SET MaNhanVien = ?, Diem = ?, TrinhDo = ?, NgayKiemTra = ? 
       WHERE MaKhachHangTiemNang = ?`,
      [MaNhanVien, Diem, TrinhDo, NgayKiemTra, leadId]
    );
    return result.affectedRows;
  }
};

module.exports = PlacementTest;
