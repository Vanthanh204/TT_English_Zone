const db = require('../config/db');

const Student = {
  create: async (studentData, connection = db) => {
    const { MaKhachHangTiemNang, HoTen, SoDienThoai, Email, DiaChi, TrangThai, SDTPhuHuynh, NgaySinh, GioiTinh, NgayDangKy } = studentData;
    
    // Tự động sinh MaHocVien mới (ví dụ: HV011)
    const MaHocVien = await db.generateNextId('hocvien', 'MaHocVien', 'HV');

    await connection.execute(
      `INSERT INTO hocvien (MaHocVien, MaKhachHangTiemNang, HoTen, SoDienThoai, Email, DiaChi, TrangThai, SDTPhuHuynh, NgayDangKy, NgaySinh, GioiTinh) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        MaHocVien,
        MaKhachHangTiemNang || null,
        HoTen,
        SoDienThoai,
        Email,
        DiaChi || null,
        TrangThai !== undefined ? TrangThai : 1,
        SDTPhuHuynh || null,
        NgayDangKy || new Date(),
        NgaySinh,
        GioiTinh
      ]
    );
    return MaHocVien;
  },

  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT hv.*, 
             (
               SELECT GROUP_CONCAT(lh.TenLopHoc SEPARATOR ', ')
               FROM dangkyhoc dk
               JOIN lophoc lh ON dk.MaLopHoc = lh.MaLopHoc
               WHERE dk.MaHocVien = hv.MaHocVien AND dk.TrangThai = 1
             ) AS CurrentClasses,
             (
               SELECT COALESCE(SUM(hp.ThanhTien - COALESCE(payments.totalPaid, 0)), 0)
               FROM hocphi hp
               LEFT JOIN (
                 SELECT MaHocPhi, SUM(SoTienThu) AS totalPaid
                 FROM phieuthu
                 GROUP BY MaHocPhi
               ) payments ON hp.MaHocPhi = payments.MaHocPhi
               WHERE hp.MaHocVien = hv.MaHocVien
             ) AS TotalDebt
      FROM hocvien hv 
      ORDER BY hv.MaHocVien ASC
    `);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM hocvien WHERE MaHocVien = ?', [id]);
    return rows[0];
  },

  update: async (id, studentData) => {
    const { HoTen, SoDienThoai, Email, DiaChi, TrangThai, SDTPhuHuynh, NgaySinh, GioiTinh } = studentData;
    const [result] = await db.execute(
      `UPDATE hocvien 
       SET HoTen = ?, SoDienThoai = ?, Email = ?, DiaChi = ?, TrangThai = ?, SDTPhuHuynh = ?, NgaySinh = ?, GioiTinh = ? 
       WHERE MaHocVien = ?`,
      [HoTen, SoDienThoai, Email, DiaChi, TrangThai, SDTPhuHuynh, NgaySinh, GioiTinh, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM hocvien WHERE MaHocVien = ?', [id]);
    return result.affectedRows;
  },

  findByEmail: async (email) => {
    const [rows] = await db.execute('SELECT * FROM hocvien WHERE Email = ?', [email]);
    return rows[0];
  }
};

module.exports = Student;
