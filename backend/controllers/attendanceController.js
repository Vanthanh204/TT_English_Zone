const db = require('../config/db');
const Attendance = require('../models/attendanceModel');

const getAttendanceSession = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const records = await Attendance.getAttendanceByScheduleId(scheduleId);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const saveAttendanceSession = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { scheduleId } = req.params;
    const { records } = req.body; // Array of { MaHocVien, TrangThai }

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Danh sách điểm danh không hợp lệ' });
    }

    const savedIds = await Attendance.saveAttendance(scheduleId, records, connection);

    await connection.commit();
    res.json({ 
      success: true, 
      message: 'Ghi nhận điểm danh buổi học thành công',
      data: savedIds
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAttendanceSession,
  saveAttendanceSession
};
