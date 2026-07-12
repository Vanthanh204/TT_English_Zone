import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

interface TuitionRecord {
  MaHocPhi: string;
  MaHocVien: string;
  TenHocVien: string;
  SoDienThoai: string;
  MaDangKy: string;
  TenLopHoc: string;
  TenKhoaHoc: string;
  TongTien: string | number;
  ThanhTien: string | number;
  DaDong: string | number;
  ConNo: string | number;
  TrangThai: number; // 0: Chưa đóng, 1: Đóng dở dang, 2: Đã đóng đủ
  HanThanhToan: string;
}

interface ReceiptItem {
  MaPhieuThu: string;
  MaHocPhi: string;
  SoTienThu: string | number;
  NgayThu: string;
  HinhThucThanhToan: string;
}

const ManagePayments: React.FC = () => {
  const { token } = useAuth();
  const [tuitions, setTuitions] = useState<TuitionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Collect modal states
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [targetTuition, setTargetTuition] = useState<TuitionRecord | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Chuyển khoản');
  const [collectError, setCollectError] = useState('');

  // Detail modal states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTuition, setDetailTuition] = useState<TuitionRecord | null>(null);
  const [receiptList, setReceiptList] = useState<ReceiptItem[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [selectedPrintReceipt, setSelectedPrintReceipt] = useState<ReceiptItem | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activePaymentMenuId, setActivePaymentMenuId] = useState<string | null>(null);

  const fetchTuitions = async () => {
    setLoading(true);
    setError('');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get('http://localhost:5000/api/payments/tuition', {
        headers,
        params: {
          search: search || undefined,
          TrangThai: statusFilter !== '' ? statusFilter : undefined
        }
      });
      if (response.data && response.data.success) {
        setTuitions(response.data.data);
      }
    } catch (err: any) {
      setError('Lỗi khi tải danh sách công nợ học phí: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTuitions();
    }
  }, [token, search, statusFilter]);

  const handleOpenCollect = (record: TuitionRecord) => {
    setTargetTuition(record);
    // Gợi ý số tiền thu bằng số nợ còn lại
    setCollectAmount(Number(record.ConNo));
    setPaymentMethod('Chuyển khoản');
    setCollectError('');
    setIsCollectOpen(true);
  };

  const handleSaveCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTuition) return;
    setCollectError('');
    setSuccess('');

    if (collectAmount <= 0) {
      setCollectError('Số tiền thu phải lớn hơn 0.');
      return;
    }

    const maxDue = Number(targetTuition.ConNo);
    if (collectAmount > maxDue) {
      setCollectError(`Số tiền thu vượt quá số nợ còn lại (${maxDue.toLocaleString()}đ).`);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const payload = {
      MaHocPhi: targetTuition.MaHocPhi,
      SoTienThu: collectAmount,
      HinhThucThanhToan: paymentMethod
    };

    try {
      const response = await axios.post('http://localhost:5000/api/payments/receipt', payload, { headers });
      if (response.data.success) {
        setSuccess(`Ghi nhận biên lai ${response.data.data.MaPhieuThu} thành công.`);
        setIsCollectOpen(false);
        fetchTuitions();
      }
    } catch (err: any) {
      setCollectError(err.response?.data?.message || 'Có lỗi xảy ra khi lập phiếu thu.');
    }
  };

  const handleOpenDetail = async (record: TuitionRecord) => {
    setDetailTuition(record);
    setReceiptList([]);
    setSelectedPrintReceipt(null);
    setIsDetailOpen(true);
    setLoadingReceipts(true);

    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`http://localhost:5000/api/payments/tuition/${record.MaHocPhi}`, { headers });
      if (response.data && response.data.success) {
        setReceiptList(response.data.data.receipts);
      }
    } catch (err: any) {
      setError('Lỗi khi tải lịch sử đóng phí: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingReceipts(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    const num = Number(val);
    if (isNaN(num)) return '0 đ';
    return num.toLocaleString('vi-VN') + ' đ';
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Tính các con số tổng quan cho thẻ đầu trang
  const totalTuition = tuitions.reduce((acc, curr) => acc + Number(curr.ThanhTien), 0);
  const totalCollected = tuitions.reduce((acc, curr) => acc + Number(curr.DaDong), 0);
  const totalPending = tuitions.reduce((acc, curr) => acc + Number(curr.ConNo), 0);

  // Chuyển số thành chữ (tiếng Việt cơ bản cho in biên lai)
  const numberToWords = (num: number): string => {
    if (num === 0) return 'Không đồng';
    const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const places = ['', 'nghìn', 'triệu', 'tỷ'];
    
    let words = '';
    let count = 0;
    
    let temp = Math.round(num);
    while (temp > 0) {
      const chunk = temp % 1000;
      if (chunk > 0) {
        const chunkWords = readThreeDigits(chunk, units);
        words = chunkWords + ' ' + places[count] + ' ' + words;
      }
      temp = Math.floor(temp / 1000);
      count++;
    }
    
    return (words.trim().charAt(0).toUpperCase() + words.trim().slice(1) + ' đồng chẵn').normalize('NFC');
  };

  const readThreeDigits = (num: number, units: string[]): string => {
    const hundreds = Math.floor(num / 100);
    const tens = Math.floor((num % 100) / 10);
    const ones = num % 10;
    
    let res = '';
    if (hundreds > 0) {
      res += units[hundreds] + ' trăm ';
    }
    if (tens > 1) {
      res += units[tens] + ' mươi ';
      if (ones === 1) res += 'mốt';
      else if (ones === 5) res += 'lăm';
      else if (ones > 0) res += units[ones];
    } else if (tens === 1) {
      res += 'mười ';
      if (ones === 5) res += 'lăm';
      else if (ones > 0) res += units[ones];
    } else {
      if (hundreds > 0 && ones > 0) res += 'lẻ ';
      if (ones > 0) {
        if (ones === 5) res += 'lăm';
        else res += units[ones];
      }
    }
    return res.trim();
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Học Phí & Hóa Đơn</h1>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <input 
            type="text" 
            placeholder="Tìm theo tên học viên, lớp..."
            className="p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-semibold bg-gray-50 text-gray-800 cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">-- Tất cả trạng thái --</option>
            <option value="0">Chưa đóng</option>
            <option value="1">Đang đóng dở</option>
            <option value="2">Đã đóng đủ</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-sm">
          {success}
        </div>
      )}

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Tổng học phí phát sinh</span>
            <p className="text-2xl font-black text-gray-800 mt-1">{formatCurrency(totalTuition)}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">calculate</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Tổng số tiền đã thu</span>
            <p className="text-2xl font-black text-green-600 mt-1">{formatCurrency(totalCollected)}</p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">savings</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Công nợ chờ thu</span>
            <p className="text-2xl font-black text-red-500 mt-1">{formatCurrency(totalPending)}</p>
          </div>
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">receipt_long</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex justify-center py-20 bg-white rounded-xl shadow-xs border border-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : tuitions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-100 shadow-xs">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">money_off</span>
          <h3 className="text-lg font-bold text-gray-700 mb-1">Không tìm thấy thông tin công nợ học phí</h3>
          <p className="text-sm text-gray-400">Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-x-auto relative">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hóa đơn</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Học viên</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Lớp học</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Khóa học</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Học phí gốc</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Đã đóng</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Còn nợ</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hạn đóng</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tuitions.map((item) => (
                <tr key={item.MaHocPhi} className="hover:bg-gray-50 group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.MaHocPhi}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                    <div>{item.TenHocVien}</div>
                    <div className="text-[10px] text-gray-400">{item.SoDienThoai}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold">{item.TenLopHoc}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.TenKhoaHoc}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{formatCurrency(item.ThanhTien)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">{formatCurrency(item.DaDong)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 font-bold">{formatCurrency(item.ConNo)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-semibold">{formatDateDisplay(item.HanThanhToan)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.TrangThai === 2 ? (
                      <span className="px-2.5 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full bg-green-100 text-green-800">Đã đóng đủ</span>
                    ) : item.TrangThai === 1 ? (
                      <span className="px-2.5 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full bg-amber-100 text-amber-800">Đóng dở dang</span>
                    ) : (
                      <span className="px-2.5 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full bg-red-100 text-red-800">Chưa đóng</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 sticky right-0 bg-white group-hover:bg-gray-50 transition z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] overflow-visible">
                    <div className="relative flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePaymentMenuId(activePaymentMenuId === item.MaHocPhi ? null : item.MaHocPhi);
                        }}
                        className="w-8 h-8 rounded-full border border-gray-200 hover:border-indigo-500 bg-white hover:bg-indigo-50 flex items-center justify-center text-gray-500 hover:text-indigo-600 shadow-sm transition cursor-pointer"
                        title="Tùy chọn"
                      >
                        <span className="material-symbols-outlined text-lg">settings</span>
                      </button>

                      {activePaymentMenuId === item.MaHocPhi && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActivePaymentMenuId(null)}></div>
                          <div className="absolute right-full mr-2 -top-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-30 animate-fade-in text-left">
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenCollect(item);
                                setActivePaymentMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={item.TrangThai === 2}
                            >
                              <span className="material-symbols-outlined text-sm">payments</span>
                              Thu học phí
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleOpenDetail(item);
                                setActivePaymentMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">history</span>
                              Lịch sử đóng phí
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Collect Tuition Fee */}
      {isCollectOpen && targetTuition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-1 text-gray-800">Thu Học Phí Học Viên</h2>
            <p className="text-xs text-gray-400 mb-4">Nhập thông tin thanh toán tiền học phí cho hóa đơn {targetTuition.MaHocPhi}.</p>
            
            {collectError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs mb-4">
                {collectError}
              </div>
            )}

            <form onSubmit={handleSaveCollect}>
              <div className="space-y-4 mb-6 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg space-y-1.5 border border-gray-100">
                  <div className="flex justify-between"><span className="text-gray-400">Học viên:</span><span className="font-bold text-gray-700">{targetTuition.TenHocVien}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Lớp học:</span><span className="font-semibold text-gray-600">{targetTuition.TenLopHoc}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Tổng học phí:</span><span className="font-bold text-gray-700">{formatCurrency(targetTuition.ThanhTien)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Đã đóng:</span><span className="font-bold text-green-600">{formatCurrency(targetTuition.DaDong)}</span></div>
                  <div className="flex justify-between border-t border-gray-200/50 pt-1.5 font-bold">
                    <span className="text-red-500">Số nợ còn lại:</span>
                    <span className="text-red-500">{formatCurrency(targetTuition.ConNo)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Số tiền muốn thu (đ) *</label>
                  <input 
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(Number(e.target.value))}
                    max={Number(targetTuition.ConNo)}
                    min={1}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Hình thức thanh toán *</label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-gray-800 cursor-pointer"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="Chuyển khoản">Chuyển khoản ngân hàng</option>
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Thẻ tín dụng">Thẻ tín dụng (POS)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsCollectOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition text-sm"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-sm transition text-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm font-black">check_circle</span>
                  Lưu giao dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tuition Detail & Receipts History */}
      {isDetailOpen && detailTuition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Chi Tiết Hóa Đơn & Lịch Sử Đóng Phí</h2>
                <p className="text-xs text-gray-400">Mã hóa đơn: {detailTuition.MaHocPhi} - Học viên: {detailTuition.TenHocVien}</p>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="text-gray-400 hover:text-gray-600 flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Print Area when selected a specific receipt */}
            {selectedPrintReceipt ? (
              <div className="bg-amber-50/20 p-6 border-2 border-dashed border-amber-300 rounded-xl space-y-6 relative mb-6">
                <button
                  onClick={() => setSelectedPrintReceipt(null)}
                  className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-bold py-1 px-2.5 rounded-lg transition"
                >
                  Đóng biên lai
                </button>
                
                {/* Print Layout */}
                <style>{`
                  @media print {
                    body * {
                      visibility: hidden;
                    }
                    #receipt-print-section, #receipt-print-section * {
                      visibility: visible;
                    }
                    #receipt-print-section {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                      border: none !important;
                      box-shadow: none !important;
                      padding: 20px !important;
                      margin: 0 !important;
                      font-family: Arial, Helvetica, sans-serif !important;
                      color: #000 !important;
                    }
                  }
                `}</style>
                <div className="bg-white p-8 border border-gray-200 shadow-sm max-w-2xl mx-auto rounded-lg font-sans text-gray-800" id="receipt-print-section">
                  <div className="text-center space-y-1 pb-4 border-b border-gray-300">
                    <h3 className="text-base font-bold tracking-wider uppercase">TT ENGLISH ZONE</h3>
                    <p className="text-[10px] text-gray-500 italic">Địa chỉ: 123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh</p>
                    <p className="text-[10px] text-gray-500">Hotline: 0909 123 456 - Website: ttenglishzone.edu.vn</p>
                  </div>

                  <div className="text-center py-6">
                    <h2 className="text-xl font-black tracking-wide">BIÊN LAI THU TIỀN HỌC PHÍ</h2>
                    <p className="text-[10px] text-gray-400 font-semibold mt-1">Số phiếu: {selectedPrintReceipt.MaPhieuThu}</p>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed">
                    <div className="flex"><span className="w-32 text-gray-500">Họ và tên học viên:</span><span className="font-bold underline">{detailTuition.TenHocVien}</span></div>
                    <div className="flex"><span className="w-32 text-gray-500">Mã học viên:</span><span className="font-semibold">{detailTuition.MaHocVien}</span></div>
                    <div className="flex"><span className="w-32 text-gray-500">Lớp đăng ký học:</span><span className="font-semibold">{detailTuition.TenLopHoc} ({detailTuition.TenKhoaHoc})</span></div>
                    <div className="flex"><span className="w-32 text-gray-500">Số tiền nộp phí:</span><span className="font-bold">{formatCurrency(selectedPrintReceipt.SoTienThu)}</span></div>
                    <div className="flex"><span className="w-32 text-gray-500">Viết bằng chữ:</span><span className="italic underline">{numberToWords(Number(selectedPrintReceipt.SoTienThu))}</span></div>
                    <div className="flex"><span className="w-32 text-gray-500">Hình thức đóng:</span><span className="font-semibold">{selectedPrintReceipt.HinhThucThanhToan}</span></div>
                    <div className="flex"><span className="w-32 text-gray-500">Ngày giao dịch:</span><span>{formatDateDisplay(selectedPrintReceipt.NgayThu)}</span></div>
                  </div>

                  <div className="grid grid-cols-2 text-center mt-10 text-xs">
                    <div>
                      <p className="font-bold">Người nộp tiền</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">(Ký, ghi rõ họ tên)</p>
                      <div className="h-16"></div>
                      <p className="underline">{detailTuition.TenHocVien}</p>
                    </div>
                    <div>
                      <p className="font-bold">Người thu tiền (Thủ quỹ)</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">(Ký, đóng dấu)</p>
                      <div className="h-16"></div>
                      <p className="underline font-bold">Kế toán trung tâm</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button 
                    onClick={() => window.print()}
                    className="bg-[#0040a1] hover:bg-[#0056d2] text-white font-bold py-1.5 px-4 rounded-lg text-xs transition flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">print</span>
                    In Biên Lai Này
                  </button>
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div><span className="text-gray-400 block mb-0.5">Khóa học:</span><span className="font-bold text-gray-700">{detailTuition.TenKhoaHoc}</span></div>
                <div><span className="text-gray-400 block mb-0.5">Học phí:</span><span className="font-bold text-gray-700">{formatCurrency(detailTuition.ThanhTien)}</span></div>
                <div><span className="text-gray-400 block mb-0.5">Đã thu lũy kế:</span><span className="font-bold text-green-600">{formatCurrency(detailTuition.DaDong)}</span></div>
                <div><span className="text-gray-400 block mb-0.5">Nợ hiện tại:</span><span className="font-bold text-red-500">{formatCurrency(detailTuition.ConNo)}</span></div>
              </div>

              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mt-6">Lịch Sử Phiếu Thu Giao Dịch</h3>

              {loadingReceipts ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : receiptList.length === 0 ? (
                <div className="text-center py-8 text-gray-400 italic text-xs bg-gray-50 rounded-lg">
                  Học viên chưa phát sinh bất kỳ biên lai thu tiền nào.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase">Mã phiếu</th>
                        <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase">Ngày thu</th>
                        <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase">Số tiền đã nộp</th>
                        <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase">Hình thức</th>
                        <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase">In ấn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 bg-white">
                      {receiptList.map((r) => (
                        <tr key={r.MaPhieuThu} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-bold text-gray-900">{r.MaPhieuThu}</td>
                          <td className="px-4 py-3 text-gray-500 font-semibold">{formatDateDisplay(r.NgayThu)}</td>
                          <td className="px-4 py-3 text-green-600 font-bold">{formatCurrency(r.SoTienThu)}</td>
                          <td className="px-4 py-3 text-gray-600 font-medium">{r.HinhThucThanhToan}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedPrintReceipt(r)}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1 px-2.5 rounded text-[10px] transition"
                            >
                              Xem & In
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePayments;
