const db = require('../config/db');

const Class = {
  create: async (classData) => {
    const { TenLopHoc, MaNhanVien, MaDotTuyenSinh, NgayKhaiGiang, TrangThai, NgayBatDau, NgayKetThuc, SiSoToiDa, PhongHoc } = classData;
    
    // Tự động sinh MaLopHoc (ví dụ LH004)
    const MaLopHoc = await db.generateNextId('lophoc', 'MaLopHoc', 'LH');
    const defaultSiSoHienTai = 0;

    await db.execute(
      `INSERT INTO lophoc (MaLopHoc, TenLopHoc, MaNhanVien, MaDotTuyenSinh, NgayKhaiGiang, TrangThai, NgayBatDau, NgayKetThuc, SiSoToiDa, SiSoHienTai, PhongHoc) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        MaLopHoc,
        TenLopHoc,
        MaNhanVien || null,
        MaDotTuyenSinh,
        NgayKhaiGiang,
        TrangThai !== undefined ? TrangThai : 1, // 1: Sắp mở
        NgayBatDau,
        NgayKetThuc,
        SiSoToiDa !== undefined ? SiSoToiDa : 25,
        defaultSiSoHienTai,
        PhongHoc || null
      ]
    );
    return MaLopHoc;
  },

  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT l.*, nv.HoTen as TenGiaoVien, d.TenDotTuyenSinh, k.TenKhoaHoc, k.TrinhDo,
             (SELECT GROUP_CONCAT(DISTINCT DAYOFWEEK(NgayHoc) ORDER BY DAYOFWEEK(NgayHoc)) 
              FROM lichhoc WHERE MaLopHoc = l.MaLopHoc) as ScheduleDays
      FROM lophoc l
      LEFT JOIN nhanvien nv ON l.MaNhanVien = nv.MaNhanVien
      LEFT JOIN dottuyensinh d ON l.MaDotTuyenSinh = d.MaDotTuyenSinh
      LEFT JOIN khoahoc k ON d.MaKhoaHoc = k.MaKhoaHoc
      ORDER BY l.MaLopHoc ASC
    `);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT l.*, nv.HoTen as TenGiaoVien, d.TenDotTuyenSinh, k.TenKhoaHoc, k.TrinhDo,
             (SELECT GROUP_CONCAT(DISTINCT DAYOFWEEK(NgayHoc) ORDER BY DAYOFWEEK(NgayHoc)) 
              FROM lichhoc WHERE MaLopHoc = l.MaLopHoc) as ScheduleDays
      FROM lophoc l
      LEFT JOIN nhanvien nv ON l.MaNhanVien = nv.MaNhanVien
      LEFT JOIN dottuyensinh d ON l.MaDotTuyenSinh = d.MaDotTuyenSinh
      LEFT JOIN khoahoc k ON d.MaKhoaHoc = k.MaKhoaHoc
      WHERE l.MaLopHoc = ?
    `, [id]);
    return rows[0];
  },

  update: async (id, classData) => {
    const { TenLopHoc, MaNhanVien, MaDotTuyenSinh, NgayKhaiGiang, TrangThai, NgayBatDau, NgayKetThuc, SiSoToiDa, PhongHoc } = classData;
    const [result] = await db.execute(
      `UPDATE lophoc 
       SET TenLopHoc = ?, MaNhanVien = ?, MaDotTuyenSinh = ?, NgayKhaiGiang = ?, TrangThai = ?, NgayBatDau = ?, NgayKetThuc = ?, SiSoToiDa = ?, PhongHoc = ? 
       WHERE MaLopHoc = ?`,
      [TenLopHoc, MaNhanVien, MaDotTuyenSinh, NgayKhaiGiang, TrangThai, NgayBatDau, NgayKetThuc, SiSoToiDa, PhongHoc, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM lophoc WHERE MaLopHoc = ?', [id]);
    return result.affectedRows;
  },

  getRoster: async (classId) => {
    const [rows] = await db.execute(`
      SELECT dk.MaDangKy, dk.NgayDangKy, hv.MaHocVien, hv.HoTen, hv.SoDienThoai, hv.Email,
             (SELECT COUNT(*) FROM lichhoc lh WHERE lh.MaLopHoc = dk.MaLopHoc AND lh.TrangThai = 1) as TotalSessions,
             (SELECT COUNT(*) FROM diemdanh dd JOIN lichhoc lh ON dd.MaLichHoc = lh.MaLichHoc 
              WHERE lh.MaLopHoc = dk.MaLopHoc AND dd.MaHocVien = hv.MaHocVien AND dd.TrangThai = 1) as PresentCount,
             (SELECT COUNT(*) FROM diemdanh dd JOIN lichhoc lh ON dd.MaLichHoc = lh.MaLichHoc 
              WHERE lh.MaLopHoc = dk.MaLopHoc AND dd.MaHocVien = hv.MaHocVien AND dd.TrangThai = 0) as AbsentCount,
             (SELECT COUNT(*) FROM diemdanh dd JOIN lichhoc lh ON dd.MaLichHoc = lh.MaLichHoc 
              WHERE lh.MaLopHoc = dk.MaLopHoc AND dd.MaHocVien = hv.MaHocVien AND dd.TrangThai = 2) as LateCount
      FROM dangkyhoc dk
      JOIN hocvien hv ON dk.MaHocVien = hv.MaHocVien
      WHERE dk.MaLopHoc = ? AND dk.TrangThai = 1
      ORDER BY hv.MaHocVien ASC
    `, [classId]);
    return rows;
  }
};

module.exports = Class;
