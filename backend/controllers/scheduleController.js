const db = require('../config/db');
const Schedule = require('../models/scheduleModel');

const generateSchedule = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { MaLopHoc, NgayBatDau, ThuTrongTuan, GioBatDau, GioKetThuc, PhongHoc } = req.body;

    if (!MaLopHoc || !NgayBatDau || !ThuTrongTuan || !Array.isArray(ThuTrongTuan) || ThuTrongTuan.length === 0 || !GioBatDau || !GioKetThuc) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin cần thiết để xếp lịch' });
    }

    // 1. Lấy thông tin lớp học và số buổi học của khóa học liên kết
    const [classDetails] = await connection.execute(
      `SELECT l.MaLopHoc, l.TenLopHoc, k.SoBuoiHoc 
       FROM lophoc l
       JOIN dottuyensinh d ON l.MaDotTuyenSinh = d.MaDotTuyenSinh
       JOIN khoahoc k ON d.MaKhoaHoc = k.MaKhoaHoc
       WHERE l.MaLopHoc = ?`,
      [MaLopHoc]
    );

    if (classDetails.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học hoặc khóa học liên kết' });
    }

    const { SoBuoiHoc } = classDetails[0];

    // 2. Kiểm tra xem lịch học cũ đã có điểm danh chưa
    const [existingAttendance] = await connection.execute(
      `SELECT dd.MaDiemDanh 
       FROM diemdanh dd
       JOIN lichhoc lh ON dd.MaLichHoc = lh.MaLichHoc
       WHERE lh.MaLopHoc = ?`,
      [MaLopHoc]
    );

    if (existingAttendance.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Lớp học này đã có dữ liệu điểm danh học viên. Không thể xóa hoặc sinh lại lịch học tự động để tránh mất mát dữ liệu.' 
      });
    }

    // 3. Xóa lịch học cũ (nếu có)
    await Schedule.deleteByClassId(MaLopHoc, connection);

    // 4. Sinh lịch học tự động
    const sessions = [];
    let currentDate = new Date(NgayBatDau);
    let sessionCount = 0;

    // ThuTrongTuan chứa mảng số nguyên: 1 (T2), 2 (T3), 3 (T4), 4 (T5), 5 (T6), 6 (T7), 0 (CN)
    // Map JS Day: 0 (CN), 1 (T2), 2 (T3), 3 (T4), 4 (T5), 5 (T6), 6 (T7)
    const allowedDays = ThuTrongTuan.map(day => Number(day));

    // Lặp để tìm đủ số buổi học
    while (sessionCount < SoBuoiHoc) {
      const dayOfWeek = currentDate.getDay(); // 0 = CN, 1 = T2...
      
      if (allowedDays.includes(dayOfWeek)) {
        sessionCount++;
        // Định dạng YYYY-MM-DD
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const ddVal = String(currentDate.getDate()).padStart(2, '0');
        const dateString = `${yyyy}-${mm}-${ddVal}`;

        sessions.push({
          PhongHoc: PhongHoc || null,
          NgayHoc: dateString,
          BuoiSo: sessionCount,
          GioBatDau,
          GioKetThuc,
          MaLopHoc
        });
      }
      
      // Tăng thêm 1 ngày
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 5. Thêm lịch học hàng loạt
    const createdIds = await Schedule.createMany(sessions, connection);

    // 6. Cập nhật trạng thái lớp học sang 2 (Đang dạy) nếu đang là 1 (Sắp mở)
    await connection.execute(
      `UPDATE lophoc SET TrangThai = 2 WHERE MaLopHoc = ? AND TrangThai = 1`,
      [MaLopHoc]
    );

    await connection.commit();
    res.status(201).json({
      success: true,
      message: `Tự động sinh thành công ${SoBuoiHoc} buổi học cho lớp ${classDetails[0].TenLopHoc}`,
      data: createdIds
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

const getClassSchedules = async (req, res) => {
  try {
    const { classId } = req.params;
    const schedules = await Schedule.getByClassId(classId);
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateScheduleSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { PhongHoc, NgayHoc, GioBatDau, GioKetThuc, TrangThai } = req.body;

    const existing = await Schedule.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học này' });
    }

    await Schedule.update(id, {
      PhongHoc: PhongHoc !== undefined ? PhongHoc : existing.PhongHoc,
      NgayHoc: NgayHoc !== undefined ? NgayHoc : existing.NgayHoc,
      GioBatDau: GioBatDau !== undefined ? GioBatDau : existing.GioBatDau,
      GioKetThuc: GioKetThuc !== undefined ? GioKetThuc : existing.GioKetThuc,
      TrangThai: TrangThai !== undefined ? TrangThai : existing.TrangThai
    });

    res.json({ success: true, message: 'Cập nhật buổi học thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateSchedule,
  getClassSchedules,
  updateScheduleSession
};
