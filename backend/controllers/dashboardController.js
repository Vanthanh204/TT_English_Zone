const db = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    // 1. Tổng số học viên
    const [[{ totalStudents }]] = await db.execute('SELECT COUNT(*) as totalStudents FROM hocvien');
    const [[{ activeStudents }]] = await db.execute('SELECT COUNT(*) as activeStudents FROM hocvien WHERE TrangThai = 1');

    // 2. Tổng số leads (khách hàng tiềm năng)
    const [[{ totalLeads }]] = await db.execute('SELECT COUNT(*) as totalLeads FROM khachhangtiemnang');

    // 3. Số lượng lớp học đang mở
    const [[{ activeClasses }]] = await db.execute('SELECT COUNT(*) as activeClasses FROM lophoc WHERE TrangThai = 1 OR TrangThai = 2');

    // 4. Doanh thu học phí (Tổng tiền đã thu và chưa thu)
    const [tuitionSummary] = await db.execute(`
      SELECT 
        SUM(CASE WHEN TrangThai = 1 THEN ThanhTien ELSE 0 END) as revenueCollected,
        SUM(CASE WHEN TrangThai = 0 THEN ThanhTien ELSE 0 END) as revenuePending,
        SUM(ThanhTien) as revenueTotal
      FROM hocphi
    `);
    const revenue = tuitionSummary[0] || { revenueCollected: 0, revenuePending: 0, revenueTotal: 0 };

    // 5. Thống kê số học viên trong mỗi lớp (Top 5 lớp đông nhất)
    const [classSizes] = await db.execute(`
      SELECT TenLopHoc, SiSoHienTai, SiSoToiDa 
      FROM lophoc 
      WHERE TrangThai IN (1, 2)
      ORDER BY SiSoHienTai DESC 
      LIMIT 6
    `);

    // 6. Thống kê phễu trạng thái lead
    const [leadFunnel] = await db.execute(`
      SELECT TrangThai, COUNT(*) as count 
      FROM khachhangtiemnang 
      GROUP BY TrangThai
    `);

    // 7. Thống kê học viên mới đăng ký trong 6 tháng qua
    const [monthlyEnrollment] = await db.execute(`
      SELECT DATE_FORMAT(NgayDangKy, '%m/%Y') as month, COUNT(*) as count
      FROM hocvien
      WHERE NgayDangKy >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(NgayDangKy, '%m/%Y')
      ORDER BY MIN(NgayDangKy) ASC
    `);

    // 8. Lịch hẹn test đầu vào sắp tới
    const [upcomingTests] = await db.execute(`
      SELECT l.MaKhachHangTiemNang, l.HoTen, l.LichHenTest, l.HinhThucTest, nv.HoTen as TenNhanVienPhuTrach
      FROM khachhangtiemnang l
      LEFT JOIN nhanvien nv ON l.MaNhanVienPhuTrach = nv.MaNhanVien
      WHERE l.TrangThai = 3 AND l.LichHenTest IS NOT NULL
      ORDER BY l.LichHenTest ASC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        summary: {
          totalStudents,
          activeStudents,
          totalLeads,
          activeClasses,
          revenueCollected: Number(revenue.revenueCollected || 0),
          revenuePending: Number(revenue.revenuePending || 0),
          revenueTotal: Number(revenue.revenueTotal || 0)
        },
        classSizes,
        leadFunnel,
        monthlyEnrollment,
        upcomingTests
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats
};
