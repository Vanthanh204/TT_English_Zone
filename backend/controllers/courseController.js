const Course = require('../models/courseModel');

const createCourse = async (req, res) => {
  try {
    const { TenKhoaHoc, HocPhi, SoBuoiHoc, ThoiLuong, TrinhDo, TrangThai } = req.body;
    
    if (!TenKhoaHoc || HocPhi === undefined || !SoBuoiHoc || !ThoiLuong || !TrinhDo) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    const courseId = await Course.create({ 
      TenKhoaHoc, 
      HocPhi, 
      SoBuoiHoc, 
      ThoiLuong, 
      TrinhDo, 
      TrangThai 
    });

    res.status(201).json({ 
      success: true, 
      message: 'Tạo khóa học thành công', 
      data: { MaKhoaHoc: courseId } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.getAll();
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await Course.getById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
    }
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { TenKhoaHoc, HocPhi, SoBuoiHoc, ThoiLuong, TrinhDo, TrangThai } = req.body;
    const course = await Course.getById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
    }

    await Course.update(req.params.id, { 
      TenKhoaHoc: TenKhoaHoc || course.TenKhoaHoc, 
      HocPhi: HocPhi !== undefined ? HocPhi : course.HocPhi, 
      SoBuoiHoc: SoBuoiHoc || course.SoBuoiHoc, 
      ThoiLuong: ThoiLuong || course.ThoiLuong, 
      TrinhDo: TrinhDo || course.TrinhDo, 
      TrangThai: TrangThai !== undefined ? TrangThai : course.TrangThai 
    });

    res.json({ success: true, message: 'Cập nhật khóa học thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const affected = await Course.delete(req.params.id);
    if (affected === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học để xóa' });
    }
    res.json({ success: true, message: 'Xóa khóa học thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  createCourse, 
  getAllCourses, 
  getCourseById, 
  updateCourse, 
  deleteCourse 
};
