const PlacementTest = require('../models/placementTestModel');
const Lead = require('../models/leadModel');
const db = require('../config/db');

const recordTestResult = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { MaKhachHangTiemNang, MaNhanVien, Diem, TrinhDo, NgayKiemTra } = req.body;

    if (!MaKhachHangTiemNang || !MaNhanVien || Diem === undefined || !TrinhDo) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin kết quả thi' });
    }

    // Kiểm tra xem Lead có tồn tại không
    const lead = await Lead.getById(MaKhachHangTiemNang);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng tiềm năng' });
    }

    // 1. Tạo kết quả kiểm tra đầu vào
    const testId = await PlacementTest.create({
      MaKhachHangTiemNang,
      MaNhanVien,
      Diem,
      TrinhDo,
      NgayKiemTra
    }, connection);

    // 2. Tự động chuyển trạng thái của Lead thành 4 (Đã test)
    await connection.execute(
      'UPDATE khachhangtiemnang SET TrangThai = 4 WHERE MaKhachHangTiemNang = ?',
      [MaKhachHangTiemNang]
    );

    await connection.commit();
    res.status(201).json({
      success: true,
      message: 'Ghi nhận kết quả kiểm tra đầu vào và cập nhật trạng thái khách hàng thành công',
      data: { MaKetQuaKiemTra: testId }
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

const getTestResultByLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const result = await PlacementTest.getByLeadId(leadId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Chưa có kết quả kiểm tra cho khách hàng này' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTestResult = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { MaNhanVien, Diem, TrinhDo, NgayKiemTra } = req.body;

    if (!MaNhanVien || Diem === undefined || !TrinhDo) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin để chỉnh sửa' });
    }

    const test = await PlacementTest.getByLeadId(leadId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy kết quả kiểm tra để cập nhật' });
    }

    await PlacementTest.update(leadId, {
      MaNhanVien,
      Diem,
      TrinhDo,
      NgayKiemTra: NgayKiemTra || test.NgayKiemTra
    });

    res.json({ success: true, message: 'Cập nhật kết quả kiểm tra thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  recordTestResult,
  getTestResultByLead,
  updateTestResult
};
