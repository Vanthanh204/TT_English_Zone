const Staff = require('../models/staffModel');
const bcrypt = require('bcryptjs');
const { uploadToCloudinary } = require('../config/cloudinary');

const createStaff = async (req, res) => {
  try {
    const { HoTen, ChucVu, SoDienThoai, Email, DiaChi, TrangThai, TenTaiKhoan, MatKhau, NgayVaoLam, NgaySinh, GioiTinh } = req.body;
    
    if (!HoTen || !SoDienThoai || !Email || !ChucVu || !TenTaiKhoan || !MatKhau || !NgaySinh || GioiTinh === undefined) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc' });
    }

    // 1. Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(MatKhau, 10);

    // 2. Upload files to Cloudinary if supplied
    let AnhDaiDienUrl = null;
    let LyLichUrl = null;
    let ChungChiUrl = null;

    if (req.files) {
      if (req.files.AnhDaiDien && req.files.AnhDaiDien[0]) {
        const file = req.files.AnhDaiDien[0];
        const uploadResult = await uploadToCloudinary(file, 'avatars', 'image');
        AnhDaiDienUrl = uploadResult.secure_url;
      }
      if (req.files.LyLich && req.files.LyLich[0]) {
        const file = req.files.LyLich[0];
        const uploadResult = await uploadToCloudinary(file, 'cv', 'raw');
        LyLichUrl = uploadResult.secure_url;
      }
      if (req.files.ChungChi && req.files.ChungChi[0]) {
        const file = req.files.ChungChi[0];
        const uploadResult = await uploadToCloudinary(file, 'certificates', 'raw');
        ChungChiUrl = uploadResult.secure_url;
      }
    }

    // 3. Create record in DB
    const staffId = await Staff.create({
      HoTen,
      ChucVu,
      SoDienThoai,
      Email,
      DiaChi,
      TrangThai: TrangThai !== undefined ? Number(TrangThai) : 1,
      TenTaiKhoan,
      MatKhau: hashedPassword,
      NgayVaoLam,
      NgaySinh,
      GioiTinh: Number(GioiTinh),
      AnhDaiDien: AnhDaiDienUrl,
      LyLich: LyLichUrl,
      ChungChi: ChungChiUrl
    });

    res.status(201).json({ 
      success: true, 
      message: 'Tạo tài khoản nhân sự thành công', 
      data: { MaNhanVien: staffId } 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Số điện thoại, Email hoặc Tên tài khoản đã tồn tại' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.getAll();
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.getById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân sự' });
    }
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { HoTen, ChucVu, SoDienThoai, Email, DiaChi, TrangThai, NgaySinh, GioiTinh } = req.body;

    const staff = await Staff.getById(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân sự' });
    }

    // Prepare update payload
    const updatePayload = {
      HoTen: HoTen || staff.HoTen,
      ChucVu: ChucVu || staff.ChucVu,
      SoDienThoai: SoDienThoai || staff.SoDienThoai,
      Email: Email || staff.Email,
      DiaChi: DiaChi !== undefined ? DiaChi : staff.DiaChi,
      TrangThai: TrangThai !== undefined ? Number(TrangThai) : staff.TrangThai,
      NgaySinh: NgaySinh || staff.NgaySinh,
      GioiTinh: GioiTinh !== undefined ? Number(GioiTinh) : staff.GioiTinh
    };

    // Upload new files if supplied
    if (req.files) {
      if (req.files.AnhDaiDien && req.files.AnhDaiDien[0]) {
        const file = req.files.AnhDaiDien[0];
        const uploadResult = await uploadToCloudinary(file, 'avatars', 'image');
        updatePayload.AnhDaiDien = uploadResult.secure_url;
      }
      if (req.files.LyLich && req.files.LyLich[0]) {
        const file = req.files.LyLich[0];
        const uploadResult = await uploadToCloudinary(file, 'cv', 'raw');
        updatePayload.LyLich = uploadResult.secure_url;
      }
      if (req.files.ChungChi && req.files.ChungChi[0]) {
        const file = req.files.ChungChi[0];
        const uploadResult = await uploadToCloudinary(file, 'certificates', 'raw');
        updatePayload.ChungChi = uploadResult.secure_url;
      }
    }

    await Staff.update(id, updatePayload);

    res.json({ success: true, message: 'Cập nhật tài khoản nhân sự thành công' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Số điện thoại hoặc Email đã bị trùng với tài khoản khác' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const affected = await Staff.delete(id);
    if (affected === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân sự để xóa' });
    }
    res.json({ success: true, message: 'Xóa tài khoản nhân sự thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff
};
