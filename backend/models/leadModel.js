const db = require('../config/db');

const Lead = {
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT l.*, d.TenDotTuyenSinh, k.TenKhoaHoc, kq.Diem, kq.TrinhDo, kq.MaNhanVien as MaGiaoVienCham, nv.HoTen as TenNhanVienPhuTrach
      FROM khachhangtiemnang l
      JOIN dottuyensinh d ON l.MaDotTuyenSinh = d.MaDotTuyenSinh
      JOIN khoahoc k ON d.MaKhoaHoc = k.MaKhoaHoc
      LEFT JOIN ketquakiemtra kq ON l.MaKhachHangTiemNang = kq.MaKhachHangTiemNang
      LEFT JOIN nhanvien nv ON l.MaNhanVienPhuTrach = nv.MaNhanVien
      ORDER BY l.NgayTao DESC
    `);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT l.*, d.TenDotTuyenSinh, k.TenKhoaHoc, kq.Diem, kq.TrinhDo, kq.MaNhanVien as MaGiaoVienCham, nv.HoTen as TenNhanVienPhuTrach
      FROM khachhangtiemnang l
      JOIN dottuyensinh d ON l.MaDotTuyenSinh = d.MaDotTuyenSinh
      JOIN khoahoc k ON d.MaKhoaHoc = k.MaKhoaHoc
      LEFT JOIN ketquakiemtra kq ON l.MaKhachHangTiemNang = kq.MaKhachHangTiemNang
      LEFT JOIN nhanvien nv ON l.MaNhanVienPhuTrach = nv.MaNhanVien
      WHERE l.MaKhachHangTiemNang = ?
    `, [id]);
    return rows[0];
  },

  create: async (leadData) => {
    const { MaDotTuyenSinh, HoTen, SoDienThoai, Email, NgaySinh, GioiTinh, DiaChi } = leadData;
    
    // Sinh MaKhachHangTiemNang mới (Ví dụ: KHTN011)
    const MaKhachHangTiemNang = await db.generateNextId('khachhangtiemnang', 'MaKhachHangTiemNang', 'KHTN');
    const NgayTao = new Date(); // Thời gian tạo hiện tại
    const TrangThai = 1; // 1: Mới

    await db.execute(
      `INSERT INTO khachhangtiemnang (MaKhachHangTiemNang, MaDotTuyenSinh, HoTen, SoDienThoai, Email, NgayTao, TrangThai, NgaySinh, GioiTinh, DiaChi) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        MaKhachHangTiemNang,
        MaDotTuyenSinh,
        HoTen,
        SoDienThoai,
        Email,
        NgayTao,
        TrangThai,
        NgaySinh,
        GioiTinh,
        DiaChi || null
      ]
    );
    return MaKhachHangTiemNang;
  },

  updateStatus: async (id, status) => {
    const [result] = await db.execute(
      'UPDATE khachhangtiemnang SET TrangThai = ? WHERE MaKhachHangTiemNang = ?',
      [status, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await db.execute(
      'DELETE FROM khachhangtiemnang WHERE MaKhachHangTiemNang = ?',
      [id]
    );
    return result.affectedRows;
  }
};

module.exports = Lead;
