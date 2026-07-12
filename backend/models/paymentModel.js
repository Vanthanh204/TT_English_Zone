const db = require('../config/db');

const Payment = {
  getTuitionList: async (filters = {}) => {
    let sql = `
      SELECT 
        hp.MaHocPhi,
        hp.MaHocVien,
        hv.HoTen AS TenHocVien,
        hv.SoDienThoai,
        hp.MaDangKy,
        lh.TenLopHoc,
        kh.TenKhoaHoc,
        hp.TongTien,
        hp.ThanhTien,
        COALESCE(payments.totalPaid, 0) AS DaDong,
        (hp.ThanhTien - COALESCE(payments.totalPaid, 0)) AS ConNo,
        hp.TrangThai,
        hp.HanThanhToan
      FROM hocphi hp
      JOIN hocvien hv ON hp.MaHocVien = hv.MaHocVien
      JOIN dangkyhoc dk ON hp.MaDangKy = dk.MaDangKy
      JOIN lophoc lh ON dk.MaLopHoc = lh.MaLopHoc
      JOIN khoahoc kh ON dk.MaKhoaHoc = kh.MaKhoaHoc
      LEFT JOIN (
        SELECT MaHocPhi, SUM(SoTienThu) AS totalPaid
        FROM phieuthu
        GROUP BY MaHocPhi
      ) payments ON hp.MaHocPhi = payments.MaHocPhi
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.TrangThai !== undefined && filters.TrangThai !== '') {
      sql += ` AND hp.TrangThai = ?`;
      params.push(filters.TrangThai);
    }
    
    if (filters.search) {
      sql += ` AND (hv.HoTen LIKE ? OR hv.MaHocVien LIKE ? OR lh.TenLopHoc LIKE ?)`;
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += ` ORDER BY hp.HanThanhToan ASC, hp.MaHocPhi DESC`;

    const [rows] = await db.execute(sql, params);
    return rows;
  },

  getTuitionById: async (id) => {
    const sql = `
      SELECT 
        hp.MaHocPhi,
        hp.MaHocVien,
        hv.HoTen AS TenHocVien,
        hv.SoDienThoai,
        hv.Email,
        hp.MaDangKy,
        lh.TenLopHoc,
        kh.TenKhoaHoc,
        hp.TongTien,
        hp.ThanhTien,
        COALESCE(payments.totalPaid, 0) AS DaDong,
        (hp.ThanhTien - COALESCE(payments.totalPaid, 0)) AS ConNo,
        hp.TrangThai,
        hp.HanThanhToan
      FROM hocphi hp
      JOIN hocvien hv ON hp.MaHocVien = hv.MaHocVien
      JOIN dangkyhoc dk ON hp.MaDangKy = dk.MaDangKy
      JOIN lophoc lh ON dk.MaLopHoc = lh.MaLopHoc
      JOIN khoahoc kh ON dk.MaKhoaHoc = kh.MaKhoaHoc
      LEFT JOIN (
        SELECT MaHocPhi, SUM(SoTienThu) AS totalPaid
        FROM phieuthu
        GROUP BY MaHocPhi
      ) payments ON hp.MaHocPhi = payments.MaHocPhi
      WHERE hp.MaHocPhi = ?
    `;
    const [rows] = await db.execute(sql, [id]);
    return rows[0];
  },

  getReceiptsByTuitionId: async (tuitionId) => {
    const [rows] = await db.execute(
      `SELECT * FROM phieuthu WHERE MaHocPhi = ? ORDER BY NgayThu DESC`,
      [tuitionId]
    );
    return rows;
  },

  createReceipt: async (receiptData, connection = db) => {
    const { MaHocPhi, SoTienThu, HinhThucThanhToan } = receiptData;
    
    // Sinh mã phiếu thu (prefix PT)
    const MaPhieuThu = await db.generateNextId('phieuthu', 'MaPhieuThu', 'PT', connection);
    
    const today = new Date();
    await connection.execute(
      `INSERT INTO phieuthu (MaPhieuThu, MaHocPhi, SoTienThu, NgayThu, HinhThucThanhToan) 
       VALUES (?, ?, ?, ?, ?)`,
      [MaPhieuThu, MaHocPhi, SoTienThu, today, HinhThucThanhToan]
    );
    
    return MaPhieuThu;
  },

  updateTuitionStatus: async (tuitionId, status, connection = db) => {
    await connection.execute(
      `UPDATE hocphi SET TrangThai = ? WHERE MaHocPhi = ?`,
      [status, tuitionId]
    );
  }
};

module.exports = Payment;
