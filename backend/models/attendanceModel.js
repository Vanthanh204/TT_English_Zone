const db = require('../config/db');

const Attendance = {
  getAttendanceByScheduleId: async (scheduleId) => {
    // Trả về toàn bộ danh sách học viên trong lớp cùng trạng thái điểm danh hiện tại của buổi học
    const [rows] = await db.execute(
      `SELECT 
        hv.MaHocVien, 
        hv.HoTen, 
        hv.SoDienThoai,
        dd.MaDiemDanh, 
        dd.TrangThai, 
        dd.NgayDiemDanh
       FROM dangkyhoc dk
       JOIN hocvien hv ON dk.MaHocVien = hv.MaHocVien
       JOIN lichhoc lh ON dk.MaLopHoc = lh.MaLopHoc
       LEFT JOIN diemdanh dd ON hv.MaHocVien = dd.MaHocVien AND dd.MaLichHoc = lh.MaLichHoc
       WHERE lh.MaLichHoc = ? AND dk.TrangThai = 1
       ORDER BY hv.MaHocVien ASC`,
      [scheduleId]
    );
    return rows;
  },

  saveAttendance: async (scheduleId, records, connection = db) => {
    // records: array of { MaHocVien, TrangThai }
    const results = [];
    const today = new Date();
    
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      // Check if attendance already recorded
      const [existing] = await connection.execute(
        `SELECT MaDiemDanh FROM diemdanh WHERE MaHocVien = ? AND MaLichHoc = ?`,
        [r.MaHocVien, scheduleId]
      );

      if (existing.length > 0) {
        // Update existing record
        await connection.execute(
          `UPDATE diemdanh SET TrangThai = ?, NgayDiemDanh = ? WHERE MaDiemDanh = ?`,
          [r.TrangThai, today, existing[0].MaDiemDanh]
        );
        results.push(existing[0].MaDiemDanh);
      } else {
        // Create new record
        const MaDiemDanh = await db.generateNextId('diemdanh', 'MaDiemDanh', 'DD', connection);
        await connection.execute(
          `INSERT INTO diemdanh (MaDiemDanh, MaHocVien, MaLichHoc, NgayDiemDanh, TrangThai) 
           VALUES (?, ?, ?, ?, ?)`,
          [MaDiemDanh, r.MaHocVien, scheduleId, today, r.TrangThai]
        );
        results.push(MaDiemDanh);
      }
    }
    return results;
  }
};

module.exports = Attendance;
