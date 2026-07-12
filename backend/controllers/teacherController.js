const Teacher = require('../models/teacherModel');
const bcrypt = require('bcryptjs');

const createTeacher = async (req, res) => {
  try {
    const { HoTen, SoDienThoai, Email, DiaChi, TrangThai, TenTaiKhoan, MatKhau, NgayVaoLam, NgaySinh, GioiTinh } = req.body;
    
    if (!HoTen || !SoDienThoai || !Email || !TenTaiKhoan || !MatKhau || !NgaySinh || GioiTinh === undefined) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc' });
    }

    // Mã hóa mật khẩu giáo viên bằng bcrypt
    const hashedPassword = await bcrypt.hash(MatKhau, 10);

    const teacherId = await Teacher.create({
      HoTen,
      SoDienThoai,
      Email,
      DiaChi,
      TrangThai,
      TenTaiKhoan,
      MatKhau: hashedPassword,
      NgayVaoLam,
      NgaySinh,
      GioiTinh
    });

    res.status(201).json({ 
      success: true, 
      message: 'Tạo tài khoản giáo viên thành công', 
      data: { MaNhanVien: teacherId } 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Số điện thoại, Email hoặc Tên tài khoản đã tồn tại' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.getAll();
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createTeacher, getAllTeachers };
