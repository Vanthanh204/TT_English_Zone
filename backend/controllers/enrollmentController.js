const Enrollment = require('../models/enrollmentModel');
const Class = require('../models/classModel');
const Student = require('../models/studentModel');
const db = require('../config/db');

const registerClass = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { MaHocVien, MaLopHoc } = req.body;

    if (!MaHocVien || !MaLopHoc) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin Học viên và Lớp học' });
    }

    // 1. Kiểm tra lớp học tồn tại và sĩ số
    const cls = await Class.getById(MaLopHoc);
    if (!cls) {
      return res.status(404).json({ success: false, message: 'Lớp học không tồn tại' });
    }

    if (cls.SiSoHienTai >= cls.SiSoToiDa) {
      return res.status(400).json({ success: false, message: `Lớp học đã đầy (Sĩ số hiện tại: ${cls.SiSoHienTai}/${cls.SiSoToiDa})` });
    }

    // 2. Kiểm tra học viên tồn tại
    const student = await Student.getById(MaHocVien);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Học viên không tồn tại' });
    }

    // 3. Kiểm tra xem học viên đã được xếp vào lớp này chưa
    const isEnrolled = await Enrollment.checkExists(MaHocVien, MaLopHoc);
    if (isEnrolled) {
      return res.status(400).json({ success: false, message: 'Học viên này đã đăng ký học lớp này trước đó' });
    }

    // 4. Lấy thông tin khóa học và học phí liên kết qua Đợt tuyển sinh của lớp học
    const [courseDetails] = await connection.execute(
      `SELECT k.MaKhoaHoc, k.HocPhi 
       FROM lophoc l 
       JOIN dottuyensinh d ON l.MaDotTuyenSinh = d.MaDotTuyenSinh 
       JOIN khoahoc k ON d.MaKhoaHoc = k.MaKhoaHoc 
       WHERE l.MaLopHoc = ?`,
      [MaLopHoc]
    );

    if (courseDetails.length === 0) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy thông tin khóa học và học phí liên kết cho lớp này' });
    }
    const { MaKhoaHoc, HocPhi } = courseDetails[0];

    // 5. Thực hiện xếp lớp
    const enrollmentId = await Enrollment.create({
      MaHocVien,
      MaDotTuyenSinh: cls.MaDotTuyenSinh,
      MaKhoaHoc,
      MaLopHoc,
      NgayDangKy: new Date()
    }, connection);

    // 6. Tăng sĩ số lớp học lên 1
    await connection.execute(
      'UPDATE lophoc SET SiSoHienTai = SiSoHienTai + 1 WHERE MaLopHoc = ?',
      [MaLopHoc]
    );

    // 7. Tự động sinh MaHocPhi tiếp theo (ví dụ HP001)
    const MaHocPhi = await db.generateNextId('hocphi', 'MaHocPhi', 'HP');
    
    // Hạn thanh toán mặc định là ngày khai giảng của lớp
    const HanThanhToan = cls.NgayKhaiGiang || new Date();

    // 8. Tạo bản ghi học phí
    await connection.execute(
      `INSERT INTO hocphi (MaHocPhi, MaHocVien, MaDangKy, TongTien, ThanhTien, TrangThai, HanThanhToan) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        MaHocPhi,
        MaHocVien,
        enrollmentId, // MaDangKy
        HocPhi, // TongTien
        HocPhi, // ThanhTien
        0, // 0: Chưa đóng
        HanThanhToan
      ]
    );

    await connection.commit();
    res.status(201).json({
      success: true,
      message: 'Xếp lớp học viên thành công và phát sinh hóa đơn học phí tương ứng',
      data: { 
        MaDangKy: enrollmentId,
        MaHocPhi: MaHocPhi,
        HocPhi: HocPhi
      }
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

const updateEnrollmentGrade = async (req, res) => {
  try {
    const { id } = req.params; // MaDangKy
    const { DiemKetThuc, TrangThai } = req.body;

    if (DiemKetThuc === undefined && TrangThai === undefined) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp điểm số hoặc trạng thái để cập nhật' });
    }

    const updates = [];
    const params = [];

    if (DiemKetThuc !== undefined) {
      updates.push('DiemKetThuc = ?');
      params.push(DiemKetThuc === '' || DiemKetThuc === null ? null : DiemKetThuc);
    }
    if (TrangThai !== undefined) {
      updates.push('TrangThai = ?');
      params.push(TrangThai);
    }

    params.push(id);

    await db.execute(
      `UPDATE dangkyhoc SET ${updates.join(', ')} WHERE MaDangKy = ?`,
      params
    );

    res.json({ success: true, message: 'Cập nhật kết quả học tập thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerClass,
  updateEnrollmentGrade
};
