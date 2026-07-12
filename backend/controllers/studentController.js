const Student = require('../models/studentModel');
const Lead = require('../models/leadModel');
const db = require('../config/db');

const createStudent = async (req, res) => {
  try {
    const { HoTen, SoDienThoai, Email, DiaChi, TrangThai, SDTPhuHuynh, NgaySinh, GioiTinh, NgayDangKy } = req.body;
    
    if (!HoTen || !SoDienThoai || !Email || !NgaySinh || GioiTinh === undefined) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc' });
    }

    const studentId = await Student.create({
      HoTen,
      SoDienThoai,
      Email,
      DiaChi,
      TrangThai,
      SDTPhuHuynh,
      NgaySinh,
      GioiTinh,
      NgayDangKy
    });

    res.status(201).json({ 
      success: true, 
      message: 'Tạo hồ sơ học viên thành công', 
      data: { MaHocVien: studentId } 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Số điện thoại hoặc Email học viên đã tồn tại' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.getAll();
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStudentById = async (req, res) => {
  try {
    const student = await Student.getById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { HoTen, SoDienThoai, Email, DiaChi, TrangThai, SDTPhuHuynh, NgaySinh, GioiTinh } = req.body;
    const student = await Student.getById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
    }

    await Student.update(req.params.id, {
      HoTen: HoTen || student.HoTen,
      SoDienThoai: SoDienThoai || student.SoDienThoai,
      Email: Email || student.Email,
      DiaChi: DiaChi !== undefined ? DiaChi : student.DiaChi,
      TrangThai: TrangThai !== undefined ? TrangThai : student.TrangThai,
      SDTPhuHuynh: SDTPhuHuynh !== undefined ? SDTPhuHuynh : student.SDTPhuHuynh,
      NgaySinh: NgaySinh || student.NgaySinh,
      GioiTinh: GioiTinh !== undefined ? GioiTinh : student.GioiTinh
    });

    res.json({ success: true, message: 'Cập nhật hồ sơ học viên thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const affected = await Student.delete(req.params.id);
    if (affected === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên để xóa' });
    }
    res.json({ success: true, message: 'Xóa học viên thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const convertLeadToStudent = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { leadId } = req.params;

    // 1. Lấy thông tin Lead
    const lead = await Lead.getById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng tiềm năng' });
    }

    // Kiểm tra xem Lead đã đăng ký học chưa hoặc đã là học viên chưa
    if (lead.TrangThai === 6) {
      return res.status(400).json({ success: false, message: 'Khách hàng tiềm năng này đã được chuyển thành học viên trước đó' });
    }

    // 2. Tạo bản ghi học viên
    const studentId = await Student.create({
      MaKhachHangTiemNang: lead.MaKhachHangTiemNang,
      HoTen: lead.HoTen,
      SoDienThoai: lead.SoDienThoai,
      Email: lead.Email,
      DiaChi: lead.DiaChi,
      TrangThai: 1, // Đang học
      SDTPhuHuynh: null,
      NgaySinh: lead.NgaySinh,
      GioiTinh: lead.GioiTinh,
      NgayDangKy: new Date()
    }, connection);

    // 3. Cập nhật trạng thái Lead thành 6 (Đã đăng ký học)
    await connection.execute(
      'UPDATE khachhangtiemnang SET TrangThai = 6 WHERE MaKhachHangTiemNang = ?',
      [leadId]
    );

    await connection.commit();
    res.status(201).json({
      success: true,
      message: 'Chuyển đổi khách hàng thành học viên thành công',
      data: { MaHocVien: studentId }
    });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Số điện thoại hoặc Email học viên đã tồn tại trong danh sách học viên chính thức.' });
    }
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

const getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Security check: Student can only view their own profile
    if (req.user.role === 'Học viên' && req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem thông tin của học viên khác.' });
    }
    
    // 1. Get student metadata
    const student = await Student.getById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
    }

    // 2. Get study history
    const [history] = await db.execute(`
      SELECT dk.MaDangKy, dk.MaLopHoc, dk.TrangThai, dk.NgayDangKy, dk.DiemKetThuc, lh.TenLopHoc, kh.TenKhoaHoc, kh.TrinhDo, kh.HocPhi
      FROM dangkyhoc dk
      JOIN lophoc lh ON dk.MaLopHoc = lh.MaLopHoc
      JOIN khoahoc kh ON dk.MaKhoaHoc = kh.MaKhoaHoc
      WHERE dk.MaHocVien = ?
      ORDER BY dk.NgayDangKy DESC
    `, [id]);

    // 3. Get attendance list
    const [attendance] = await db.execute(`
      SELECT dd.MaLichHoc, dd.TrangThai as AttendanceStatus, lh.BuoiSo, lh.NgayHoc, lh.GioBatDau, lh.GioKetThuc, l.TenLopHoc, l.MaLopHoc
      FROM diemdanh dd
      JOIN lichhoc lh ON dd.MaLichHoc = lh.MaLichHoc
      JOIN lophoc l ON lh.MaLopHoc = l.MaLopHoc
      WHERE dd.MaHocVien = ?
      ORDER BY lh.NgayHoc DESC
    `, [id]);

    // 4. Get placement test score
    const [placementTest] = await db.execute(`
      SELECT kq.Diem, kq.TrinhDo, kq.NgayKiemTra, nv.HoTen as TenGiaoVien
      FROM ketquakiemtra kq
      JOIN hocvien hv ON hv.MaKhachHangTiemNang = kq.MaKhachHangTiemNang
      LEFT JOIN nhanvien nv ON kq.MaNhanVien = nv.MaNhanVien
      WHERE hv.MaHocVien = ?
    `, [id]);

    // 5. Get invoices / billing tuition status
    const [payments] = await db.execute(`
      SELECT hp.MaHocPhi, hp.ThanhTien, hp.HanNop, hp.TrangThai, kh.TenKhoaHoc,
             COALESCE((SELECT SUM(SoTienThu) FROM phieuthu WHERE MaHocPhi = hp.MaHocPhi), 0) as TotalPaid,
             (hp.ThanhTien - COALESCE((SELECT SUM(SoTienThu) FROM phieuthu WHERE MaHocPhi = hp.MaHocPhi), 0)) as ConNo
      FROM hocphi hp
      JOIN khoahoc kh ON hp.MaKhoaHoc = kh.MaKhoaHoc
      WHERE hp.MaHocVien = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        student,
        history,
        attendance,
        placementTest: placementTest[0] || null,
        payments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const bulkConvertLeadsToStudents = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { leadIds } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách mã khách hàng chuyển đổi không hợp lệ' });
    }

    const convertedList = [];
    const errors = [];

    for (const leadId of leadIds) {
      const lead = await Lead.getById(leadId);
      if (!lead) {
        errors.push(`Mã ${leadId}: Không tìm thấy khách hàng`);
        continue;
      }
      if (lead.TrangThai === 6) {
        errors.push(`Mã ${leadId}: Khách hàng ${lead.HoTen} đã được chuyển đổi trước đó`);
        continue;
      }

      try {
        const studentId = await Student.create({
          MaKhachHangTiemNang: lead.MaKhachHangTiemNang,
          HoTen: lead.HoTen,
          SoDienThoai: lead.SoDienThoai,
          Email: lead.Email,
          DiaChi: lead.DiaChi,
          TrangThai: 1, // Đang học
          SDTPhuHuynh: null,
          NgaySinh: lead.NgaySinh,
          GioiTinh: lead.GioiTinh,
          NgayDangKy: new Date()
        }, connection);

        await connection.execute(
          'UPDATE khachhangtiemnang SET TrangThai = 6 WHERE MaKhachHangTiemNang = ?',
          [leadId]
        );

        convertedList.push({ leadId, studentId, name: lead.HoTen });
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          errors.push(`Mã ${leadId}: Số điện thoại/Email của ${lead.HoTen} đã tồn tại ở danh sách học viên chính thức`);
        } else {
          errors.push(`Mã ${leadId}: ${err.message}`);
        }
      }
    }

    if (convertedList.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Không chuyển đổi được bất kỳ khách hàng nào. Lỗi: ' + errors.join('; ')
      });
    }

    await connection.commit();
    res.json({
      success: true,
      message: `Chuyển đổi thành công ${convertedList.length} khách hàng thành học viên!`,
      data: { convertedList, errors }
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  convertLeadToStudent,
  getStudentProfile,
  bulkConvertLeadsToStudents
};
