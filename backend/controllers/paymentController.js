const db = require('../config/db');
const Payment = require('../models/paymentModel');

const getTuitions = async (req, res) => {
  try {
    const { search, TrangThai } = req.query;
    const list = await Payment.getTuitionList({ search, TrangThai });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTuitionDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const tuition = await Payment.getTuitionById(id);
    if (!tuition) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn học phí' });
    }
    const receipts = await Payment.getReceiptsByTuitionId(id);
    res.json({ 
      success: true, 
      data: {
        tuition,
        receipts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const collectTuition = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { MaHocPhi, SoTienThu, HinhThucThanhToan } = req.body;

    if (!MaHocPhi || !SoTienThu || !HinhThucThanhToan) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin thu phí' });
    }

    const parsedAmount = Number(SoTienThu);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Số tiền thu phí phải lớn hơn 0' });
    }

    // 1. Lấy thông tin công nợ hiện tại của học phí
    // Để an toàn trong transaction, ta truy vấn trực tiếp bằng connection
    const sql = `
      SELECT 
        hp.ThanhTien,
        COALESCE(payments.totalPaid, 0) AS DaDong,
        (hp.ThanhTien - COALESCE(payments.totalPaid, 0)) AS ConNo
      FROM hocphi hp
      LEFT JOIN (
        SELECT MaHocPhi, SUM(SoTienThu) AS totalPaid
        FROM phieuthu
        GROUP BY MaHocPhi
      ) payments ON hp.MaHocPhi = payments.MaHocPhi
      WHERE hp.MaHocPhi = ?
      FOR UPDATE
    `;
    const [rows] = await connection.execute(sql, [MaHocPhi]);
    
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn học phí tương ứng' });
    }

    const { ConNo } = rows[0];
    const balanceDue = Number(ConNo);

    if (balanceDue <= 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Hóa đơn học phí này đã được đóng đủ, không cần thu thêm.' });
    }

    if (parsedAmount > balanceDue) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: `Số tiền thu (${parsedAmount.toLocaleString()}đ) vượt quá số nợ còn lại (${balanceDue.toLocaleString()}đ).` 
      });
    }

    // 2. Tạo phiếu thu mới
    const MaPhieuThu = await Payment.createReceipt({
      MaHocPhi,
      SoTienThu: parsedAmount,
      HinhThucThanhToan
    }, connection);

    // 3. Tính toán trạng thái mới
    const remaining = balanceDue - parsedAmount;
    let newStatus = 1; // Đóng dở dang
    if (remaining <= 0) {
      newStatus = 2; // Đã đóng đủ
    }

    // 4. Cập nhật trạng thái bảng học phí
    await Payment.updateTuitionStatus(MaHocPhi, newStatus, connection);

    await connection.commit();
    res.status(201).json({
      success: true,
      message: 'Ghi nhận phiếu thu và cập nhật học phí thành công!',
      data: {
        MaPhieuThu,
        SoTienThu: parsedAmount,
        ConNo: remaining,
        TrangThai: newStatus
      }
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  getTuitions,
  getTuitionDetail,
  collectTuition
};
