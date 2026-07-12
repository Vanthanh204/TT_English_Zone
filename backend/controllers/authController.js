const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Student = require('../models/studentModel');

const formatDateToDDMMYYYY = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    const matches = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (matches) {
      return `${matches[3]}${matches[2]}${matches[1]}`;
    }
  }
  if (dateVal instanceof Date) {
    const year = dateVal.getFullYear();
    const month = String(dateVal.getMonth() + 1).padStart(2, '0');
    const day = String(dateVal.getDate()).padStart(2, '0');
    return `${day}${month}${year}`;
  }
  try {
    const isoStr = new Date(dateVal).toISOString().split('T')[0];
    const [y, m, d] = isoStr.split('-');
    return `${d}${m}${y}`;
  } catch (e) {
    return '';
  }
};

const register = async (req, res) => {
  try {
    const { username, password, email, role, full_name, phone } = req.body;
    
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Tên tài khoản đã tồn tại' });
    }

    const maNV = await User.create({ 
      TenTaiKhoan: username, 
      MatKhau: password, 
      Email: email, 
      ChucVu: role || 'Nhân viên', 
      HoTen: full_name, 
      SoDienThoai: phone 
    });

    res.status(201).json({ message: 'Đăng ký nhân viên thành công', MaNhanVien: maNV });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 1. Tìm tài khoản trong bảng NhanVien
    let user = await User.findByUsername(username);
    let isStudent = false;

    if (!user) {
      // 2. Nếu không tìm thấy, tìm trong bảng hocvien theo Email
      user = await Student.findByEmail(username);
      if (!user) {
        return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
      }
      isStudent = true;
    }

    // 3. Ràng buộc trạng thái hoạt động (TrangThai = 0 là chặn đăng nhập)
    if (user.TrangThai === 0) {
      return res.status(403).json({ 
        message: isStudent 
          ? 'Tài khoản học viên đã ngưng hoạt động hoặc đã nghỉ học' 
          : 'Tài khoản nhân sự đã ngưng hoạt động hoặc đã nghỉ việc' 
      });
    }

    let isMatch = false;
    if (isStudent) {
      // Mật khẩu học viên là: Mã học viên + ngày sinh (định dạng DDMMYYYY)
      const formattedDob = formatDateToDDMMYYYY(user.NgaySinh);
      const expectedPassword = `${user.MaHocVien}${formattedDob}`;
      isMatch = (password.toLowerCase() === expectedPassword.toLowerCase());
    } else {
      // Mật khẩu nhân viên
      if (user.MatKhau.startsWith('$2') && user.MatKhau.length === 60) {
        isMatch = await bcrypt.compare(password, user.MatKhau);
      } else {
        isMatch = (password === user.MatKhau);
      }
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    // Tạo token và payload dựa trên đối tượng đăng nhập
    const tokenPayload = isStudent 
      ? { id: user.MaHocVien, username: user.Email, role: 'Học viên' }
      : { id: user.MaNhanVien, username: user.TenTaiKhoan, role: user.ChucVu };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const userPayload = isStudent
      ? {
          id: user.MaHocVien,
          username: user.Email,
          email: user.Email,
          role: 'Học viên',
          full_name: user.HoTen
        }
      : {
          id: user.MaNhanVien,
          username: user.TenTaiKhoan,
          email: user.Email,
          role: user.ChucVu,
          full_name: user.HoTen
        };

    res.json({
      token,
      user: userPayload
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login };
