const Lead = require('../models/leadModel');
const db = require('../config/db');

const createLead = async (req, res) => {
  try {
    const { MaDotTuyenSinh, HoTen, SoDienThoai, Email, NgaySinh, GioiTinh, DiaChi } = req.body;
    
    if (!MaDotTuyenSinh || !HoTen || !SoDienThoai || !Email || !NgaySinh || GioiTinh === undefined) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc' });
    }

    const leadId = await Lead.create({
      MaDotTuyenSinh,
      HoTen,
      SoDienThoai,
      Email,
      NgaySinh,
      GioiTinh,
      DiaChi
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký nhận tư vấn thành công',
      data: { MaKhachHangTiemNang: leadId }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại hoặc Email này đã đăng ký nhận tư vấn trước đó.'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllLeads = async (req, res) => {
  try {
    const leads = await Lead.getAll();
    res.json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.getById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng tiềm năng' });
    }
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { TrangThai } = req.body;

    if (TrangThai === undefined) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp trạng thái mới' });
    }

    const lead = await Lead.getById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng tiềm năng' });
    }

    await Lead.updateStatus(id, TrangThai);
    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const affected = await Lead.delete(id);
    if (affected === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng tiềm năng để xóa' });
    }
    res.json({ success: true, message: 'Xóa khách hàng tiềm năng thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const scheduleTestAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { LichHenTest, MaNhanVienPhuTrach, HinhThucTest } = req.body;

    if (!LichHenTest || !MaNhanVienPhuTrach || !HinhThucTest) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin lịch hẹn, người phụ trách và hình thức' });
    }

    const lead = await Lead.getById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng tiềm năng' });
    }

    // Update in database
    await db.execute(
      `UPDATE khachhangtiemnang 
       SET TrangThai = 3, LichHenTest = ?, MaNhanVienPhuTrach = ?, HinhThucTest = ? 
       WHERE MaKhachHangTiemNang = ?`,
      [LichHenTest, MaNhanVienPhuTrach, HinhThucTest, id]
    );

    // Fetch details for email mock logging
    const [teacher] = await db.execute('SELECT HoTen, Email FROM nhanvien WHERE MaNhanVien = ?', [MaNhanVienPhuTrach]);
    const teacherName = teacher[0]?.HoTen || 'Giáo viên';
    const teacherEmail = teacher[0]?.Email || '';

    // MOCK EMAIL NOTIFICATION SENT LOGGING
    console.log(`\n================ MOCK EMAIL SYSTEM ================`);
    console.log(`[Đến: ${lead.Email}] Xin chào ${lead.HoTen}, Lịch hẹn test đầu vào của bạn đã được đặt vào lúc ${new Date(LichHenTest).toLocaleString('vi-VN')} theo hình thức ${HinhThucTest}.`);
    console.log(`[Đến: ${teacherEmail}] Xin chào GV ${teacherName}, bạn đã được phân công chấm bài test cho học viên ${lead.HoTen} vào lúc ${new Date(LichHenTest).toLocaleString('vi-VN')} (${HinhThucTest}).`);
    console.log(`====================================================\n`);

    res.json({ success: true, message: 'Đặt lịch hẹn test và phân công giáo viên thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLeadStatus,
  deleteLead,
  scheduleTestAppointment
};
