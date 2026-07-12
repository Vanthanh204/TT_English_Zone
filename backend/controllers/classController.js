const Class = require('../models/classModel');

const createClass = async (req, res) => {
  try {
    const { TenLopHoc, MaNhanVien, MaDotTuyenSinh, NgayKhaiGiang, TrangThai, NgayBatDau, NgayKetThuc, SiSoToiDa, PhongHoc } = req.body;
    
    if (!TenLopHoc || !MaDotTuyenSinh || !NgayKhaiGiang || !NgayBatDau || !NgayKetThuc) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc' });
    }

    const classId = await Class.create({
      TenLopHoc,
      MaNhanVien,
      MaDotTuyenSinh,
      NgayKhaiGiang,
      TrangThai,
      NgayBatDau,
      NgayKetThuc,
      SiSoToiDa,
      PhongHoc
    });

    res.status(201).json({
      success: true,
      message: 'Tạo lớp học thành công',
      data: { MaLopHoc: classId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.getAll();
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getClassById = async (req, res) => {
  try {
    const cls = await Class.getById(req.params.id);
    if (!cls) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }
    res.json({ success: true, data: cls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateClass = async (req, res) => {
  try {
    const { TenLopHoc, MaNhanVien, MaDotTuyenSinh, NgayKhaiGiang, TrangThai, NgayBatDau, NgayKetThuc, SiSoToiDa, PhongHoc } = req.body;
    const cls = await Class.getById(req.params.id);
    
    if (!cls) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    await Class.update(req.params.id, {
      TenLopHoc: TenLopHoc || cls.TenLopHoc,
      MaNhanVien: MaNhanVien !== undefined ? MaNhanVien : cls.MaNhanVien,
      MaDotTuyenSinh: MaDotTuyenSinh || cls.MaDotTuyenSinh,
      NgayKhaiGiang: NgayKhaiGiang || cls.NgayKhaiGiang,
      TrangThai: TrangThai !== undefined ? TrangThai : cls.TrangThai,
      NgayBatDau: NgayBatDau || cls.NgayBatDau,
      NgayKetThuc: NgayKetThuc || cls.NgayKetThuc,
      SiSoToiDa: SiSoToiDa !== undefined ? SiSoToiDa : cls.SiSoToiDa,
      PhongHoc: PhongHoc !== undefined ? PhongHoc : cls.PhongHoc
    });

    res.json({ success: true, message: 'Cập nhật lớp học thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteClass = async (req, res) => {
  try {
    const affected = await Class.delete(req.params.id);
    if (affected === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học để xóa' });
    }
    res.json({ success: true, message: 'Xóa lớp học thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getClassRoster = async (req, res) => {
  try {
    const roster = await Class.getRoster(req.params.id);
    res.json({ success: true, data: roster });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassRoster
};
