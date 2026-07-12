const EnrollmentSession = require('../models/enrollmentSessionModel');

const getAllSessions = async (req, res) => {
  try {
    const sessions = await EnrollmentSession.getAll();
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSessionById = async (req, res) => {
  try {
    const session = await EnrollmentSession.getById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đợt tuyển sinh' });
    }
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSession = async (req, res) => {
  try {
    const { TenDotTuyenSinh, MaKhoaHoc, TrangThai, NgayBatDau, NgayKetThuc, NgayKhaiGiang, ChiTieu } = req.body;
    
    if (!TenDotTuyenSinh || !MaKhoaHoc || !NgayBatDau || !NgayKetThuc || !NgayKhaiGiang || !ChiTieu) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc' });
    }

    const newId = await EnrollmentSession.create({
      TenDotTuyenSinh,
      MaKhoaHoc,
      TrangThai,
      NgayBatDau,
      NgayKetThuc,
      NgayKhaiGiang,
      ChiTieu
    });

    res.status(201).json({ success: true, message: 'Tạo đợt tuyển sinh thành công', data: { MaDotTuyenSinh: newId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { TenDotTuyenSinh, MaKhoaHoc, TrangThai, NgayBatDau, NgayKetThuc, NgayKhaiGiang, ChiTieu } = req.body;

    const session = await EnrollmentSession.getById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đợt tuyển sinh' });
    }

    await EnrollmentSession.update(id, {
      TenDotTuyenSinh,
      MaKhoaHoc,
      TrangThai: TrangThai !== undefined ? TrangThai : session.TrangThai,
      NgayBatDau: NgayBatDau || session.NgayBatDau,
      NgayKetThuc: NgayKetThuc || session.NgayKetThuc,
      NgayKhaiGiang: NgayKhaiGiang || session.NgayKhaiGiang,
      ChiTieu: ChiTieu !== undefined ? ChiTieu : session.ChiTieu
    });

    res.json({ success: true, message: 'Cập nhật đợt tuyển sinh thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const affected = await EnrollmentSession.delete(id);
    if (affected === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đợt tuyển sinh để xóa' });
    }
    res.json({ success: true, message: 'Xóa đợt tuyển sinh thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession
};
