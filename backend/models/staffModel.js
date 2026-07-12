const db = require('../config/db');

const Staff = {
  create: async (data) => {
    const { HoTen, ChucVu, SoDienThoai, Email, DiaChi, TrangThai, TenTaiKhoan, MatKhau, NgayVaoLam, NgaySinh, GioiTinh, AnhDaiDien, LyLich, ChungChi } = data;
    const MaNhanVien = await db.generateNextId('nhanvien', 'MaNhanVien', 'NV');

    await db.execute(
      `INSERT INTO nhanvien (MaNhanVien, HoTen, ChucVu, SoDienThoai, Email, DiaChi, TrangThai, TenTaiKhoan, MatKhau, NgayVaoLam, NgaySinh, GioiTinh, AnhDaiDien, LyLich, ChungChi) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        MaNhanVien,
        HoTen,
        ChucVu,
        SoDienThoai,
        Email,
        DiaChi || null,
        TrangThai !== undefined ? TrangThai : 1,
        TenTaiKhoan,
        MatKhau,
        NgayVaoLam || new Date(),
        NgaySinh,
        GioiTinh,
        AnhDaiDien || null,
        LyLich || null,
        ChungChi || null
      ]
    );
    return MaNhanVien;
  },

  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT MaNhanVien, HoTen, ChucVu, SoDienThoai, Email, DiaChi, TrangThai, NgayVaoLam, NgaySinh, GioiTinh, AnhDaiDien, LyLich, ChungChi 
      FROM nhanvien 
      ORDER BY MaNhanVien ASC
    `);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT MaNhanVien, HoTen, ChucVu, SoDienThoai, Email, DiaChi, TrangThai, NgayVaoLam, NgaySinh, GioiTinh, AnhDaiDien, LyLich, ChungChi 
      FROM nhanvien 
      WHERE MaNhanVien = ?
    `, [id]);
    return rows[0];
  },

  update: async (id, data) => {
    const { HoTen, ChucVu, SoDienThoai, Email, DiaChi, TrangThai, NgaySinh, GioiTinh, AnhDaiDien, LyLich, ChungChi } = data;
    
    const updates = [
      'HoTen = ?',
      'ChucVu = ?',
      'SoDienThoai = ?',
      'Email = ?',
      'DiaChi = ?',
      'TrangThai = ?',
      'NgaySinh = ?',
      'GioiTinh = ?'
    ];
    const params = [HoTen, ChucVu, SoDienThoai, Email, DiaChi, TrangThai, NgaySinh, GioiTinh];

    if (AnhDaiDien !== undefined) {
      updates.push('AnhDaiDien = ?');
      params.push(AnhDaiDien);
    }
    if (LyLich !== undefined) {
      updates.push('LyLich = ?');
      params.push(LyLich);
    }
    if (ChungChi !== undefined) {
      updates.push('ChungChi = ?');
      params.push(ChungChi);
    }

    params.push(id);

    const [result] = await db.execute(
      `UPDATE nhanvien SET ${updates.join(', ')} WHERE MaNhanVien = ?`,
      params
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await db.execute(
      'DELETE FROM nhanvien WHERE MaNhanVien = ?',
      [id]
    );
    return result.affectedRows;
  }
};

module.exports = Staff;
