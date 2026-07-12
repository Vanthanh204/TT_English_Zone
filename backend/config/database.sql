-- =====================================================
-- TT ENGLISH ZONE
-- Complete MySQL Database Schema (Thesis Version)
-- =====================================================

DROP DATABASE IF EXISTS tt_english_zone;
CREATE DATABASE tt_english_zone
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE tt_english_zone;

-- 1. KhoaHoc (Courses)
CREATE TABLE KhoaHoc(
    MaKhoaHoc VARCHAR(10) PRIMARY KEY,
    TenKhoaHoc VARCHAR(100) NOT NULL
);

-- 2. DotTuyenSinh (Enrollment Batches)
CREATE TABLE DotTuyenSinh(
    MaDotTuyenSinh VARCHAR(10) PRIMARY KEY,
    TenDotTuyenSinh VARCHAR(100) NOT NULL,
    MaKhoaHoc VARCHAR(10) NOT NULL,
    TrangThai TINYINT NOT NULL DEFAULT 1, -- 1: Active, 0: Inactive
    NgayBatDau DATE,
    NgayKetThuc DATE,
    NgayKhaiGiang DATE,
    ChiTieu INT,
    CONSTRAINT FK_DTS_KH FOREIGN KEY(MaKhoaHoc) REFERENCES KhoaHoc(MaKhoaHoc) ON DELETE CASCADE
);

-- 3. NhanVien (Staff / Employees / Teachers / Managers)
CREATE TABLE NhanVien(
    MaNhanVien VARCHAR(10) PRIMARY KEY,
    HoTen VARCHAR(100) NOT NULL,
    ChucVu VARCHAR(50) NOT NULL, -- 'Quản lý', 'Giáo viên', 'Nhân viên tư vấn', 'Kế toán'
    SoDienThoai VARCHAR(15) UNIQUE,
    Email VARCHAR(100) UNIQUE,
    DiaChi VARCHAR(255),
    TrangThai TINYINT DEFAULT 1, -- 1: Đang làm việc, 0: Nghỉ việc
    TenTaiKhoan VARCHAR(50) UNIQUE,
    MatKhau VARCHAR(255),
    NgayVaoLam DATE,
    NgaySinh DATE,
    GioiTinh TINYINT -- 1: Nam, 0: Nữ
);

-- 4. LopHoc (Classes)
CREATE TABLE LopHoc(
    MaLopHoc VARCHAR(10) PRIMARY KEY,
    TenLopHoc VARCHAR(100),
    MaNhanVien VARCHAR(10), -- Giáo viên phụ trách
    MaDotTuyenSinh VARCHAR(10),
    NgayKhaiGiang DATE,
    TrangThai TINYINT DEFAULT 1, -- 1: Sắp mở, 2: Đang dạy, 3: Đã kết thúc, 0: Đã hủy
    NgayBatDau TIME,
    NgayKetThuc TIME,
    SiSoToiDa INT DEFAULT 25,
    SiSoHienTai INT DEFAULT 0,
    PhongHoc VARCHAR(20),
    CONSTRAINT FK_LH_NV FOREIGN KEY(MaNhanVien) REFERENCES NhanVien(MaNhanVien) ON DELETE SET NULL,
    CONSTRAINT FK_LH_DTS FOREIGN KEY(MaDotTuyenSinh) REFERENCES DotTuyenSinh(MaDotTuyenSinh) ON DELETE CASCADE
);

-- 5. Lead (Potential Customers / CRM Leads)
CREATE TABLE Lead(
    MaLead VARCHAR(10) PRIMARY KEY,
    MaDotTuyenSinh VARCHAR(10),
    HoTen VARCHAR(100) NOT NULL,
    SoDienThoai VARCHAR(15) UNIQUE,
    Email VARCHAR(100),
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    TrangThai TINYINT DEFAULT 1, -- 1: Mới, 2: Đã liên hệ, 3: Đã đặt lịch test, 4: Đã test, 5: Chờ đăng ký, 6: Đã đăng ký học, 0: Từ chối
    NgaySinh DATE,
    GioiTinh TINYINT,
    DiaChi VARCHAR(255),
    CONSTRAINT FK_Lead_DTS FOREIGN KEY(MaDotTuyenSinh) REFERENCES DotTuyenSinh(MaDotTuyenSinh) ON DELETE SET NULL
);

-- 6. HocVien (Students)
CREATE TABLE HocVien(
    MaHocVien VARCHAR(10) PRIMARY KEY,
    MaLead VARCHAR(10) NULL,
    HoTen VARCHAR(100) NOT NULL,
    SoDienThoai VARCHAR(15) UNIQUE,
    Email VARCHAR(100),
    DiaChi VARCHAR(255),
    TrangThai TINYINT DEFAULT 1, -- 1: Đang học, 0: Đã nghỉ, 2: Bảo lưu
    SDTPhuHuynh VARCHAR(15),
    NgayDangKy DATE,
    NgaySinh DATE,
    GioiTinh TINYINT,
    CONSTRAINT FK_HV_Lead FOREIGN KEY(MaLead) REFERENCES Lead(MaLead) ON DELETE SET NULL
);

-- 7. DangKyHoc (Class Enrollment)
CREATE TABLE DangKyHoc(
    MaDangKy VARCHAR(10) PRIMARY KEY,
    MaHocVien VARCHAR(10) NOT NULL,
    MaDotTuyenSinh VARCHAR(10) NOT NULL,
    MaLopHoc VARCHAR(10) NOT NULL,
    TrangThai TINYINT DEFAULT 1, -- 1: Hoạt động, 0: Đã hủy
    NgayDangKy DATE,
    CONSTRAINT FK_DK_HV FOREIGN KEY(MaHocVien) REFERENCES HocVien(MaHocVien) ON DELETE CASCADE,
    CONSTRAINT FK_DK_DTS FOREIGN KEY(MaDotTuyenSinh) REFERENCES DotTuyenSinh(MaDotTuyenSinh),
    CONSTRAINT FK_DK_LH FOREIGN KEY(MaLopHoc) REFERENCES LopHoc(MaLopHoc)
);

-- 8. LichHoc (Schedules)
CREATE TABLE LichHoc(
    MaLichHoc VARCHAR(10) PRIMARY KEY,
    PhongHoc VARCHAR(20),
    NgayHoc DATE,
    BuoiSo INT,
    TrangThai TINYINT DEFAULT 1, -- 1: Bình thường, 0: Nghỉ học / Đã hủy
    GioBatDau TIME,
    GioKetThuc TIME,
    MaLopHoc VARCHAR(10) NOT NULL,
    CONSTRAINT FK_LICH_LH FOREIGN KEY(MaLopHoc) REFERENCES LopHoc(MaLopHoc) ON DELETE CASCADE
);

-- 9. DiemDanh (Attendance)
CREATE TABLE DiemDanh(
    MaDiemDanh VARCHAR(10) PRIMARY KEY,
    MaHocVien VARCHAR(10) NOT NULL,
    MaLichHoc VARCHAR(10) NOT NULL,
    NgayDiemDanh DATE,
    TrangThai TINYINT DEFAULT 1, -- 1: Có mặt, 0: Vắng mặt, 2: Muộn
    CONSTRAINT FK_DD_HV FOREIGN KEY(MaHocVien) REFERENCES HocVien(MaHocVien) ON DELETE CASCADE,
    CONSTRAINT FK_DD_LICH FOREIGN KEY(MaLichHoc) REFERENCES LichHoc(MaLichHoc) ON DELETE CASCADE
);

-- 10. HocPhi (Tuition / Receivables)
CREATE TABLE HocPhi(
    MaHocPhi VARCHAR(10) PRIMARY KEY,
    MaHocVien VARCHAR(10) NOT NULL,
    MaKhoaHoc VARCHAR(10) NOT NULL,
    TongTien DECIMAL(12,2) NOT NULL,
    ThanhTien DECIMAL(12,2) NOT NULL,
    TrangThai TINYINT DEFAULT 0, -- 0: Chưa đóng, 1: Đã đóng đủ, 2: Đang đóng dở dang
    HanThanhToan DATE,
    CONSTRAINT FK_HP_HV FOREIGN KEY(MaHocVien) REFERENCES HocVien(MaHocVien) ON DELETE CASCADE,
    CONSTRAINT FK_HP_KH FOREIGN KEY(MaKhoaHoc) REFERENCES KhoaHoc(MaKhoaHoc)
);

-- 11. PhieuThu (Receipts)
CREATE TABLE PhieuThu(
    MaPhieuThu VARCHAR(10) PRIMARY KEY,
    MaHocPhi VARCHAR(10) NOT NULL,
    SoTienThu DECIMAL(12,2) NOT NULL,
    NgayThu DATE,
    HinhThucThanhToan VARCHAR(50), -- 'Tiền mặt', 'Chuyển khoản'
    CONSTRAINT FK_PT_HP FOREIGN KEY(MaHocPhi) REFERENCES HocPhi(MaHocPhi) ON DELETE CASCADE
);

-- 12. KetQuaKiemTra (Placement / Exam Results)
CREATE TABLE KetQuaKiemTra(
    MaKetQuaKiemTra VARCHAR(10) PRIMARY KEY,
    MaLead VARCHAR(10) NOT NULL,
    MaNhanVien VARCHAR(10) NOT NULL, -- Giáo viên chấm
    Diem DECIMAL(5,2),
    TrinhDo VARCHAR(50),
    NgayKiemTra DATE,
    CONSTRAINT FK_KQ_Lead FOREIGN KEY(MaLead) REFERENCES Lead(MaLead) ON DELETE CASCADE,
    CONSTRAINT FK_KQ_NV FOREIGN KEY(MaNhanVien) REFERENCES NhanVien(MaNhanVien)
);

-- =====================================================
-- SEED DATA (MOCK DATA)
-- =====================================================

-- KhoaHoc
INSERT INTO KhoaHoc VALUES
('KH001','Tiếng Anh Mất Gốc'),
('KH002','Tiếng Anh Giao Tiếp Cơ Bản'),
('KH003','TOEIC 450+'),
('KH004','TOEIC 650+'),
('KH005','IELTS Foundation');

-- DotTuyenSinh
INSERT INTO DotTuyenSinh VALUES
('DTS001','Đợt tuyển sinh 08/2026','KH001',1,'2026-08-01','2026-08-25','2026-09-01',60),
('DTS002','Đợt tuyển sinh 08/2026','KH002',1,'2026-08-01','2026-08-25','2026-09-01',50),
('DTS003','Đợt tuyển sinh 09/2026','KH003',1,'2026-09-01','2026-09-25','2026-10-01',40);

-- NhanVien
-- Mật khẩu demo: $2a$10$tZre0e19K16q1gO8Z35vFe4v74/O8.B9mF0Kq/W5Yw/rKz8Ua1bEq (bcrypt hash of 'admin123')
INSERT INTO NhanVien VALUES
('NV001','Nguyễn Văn An','Quản lý','0901111111','an@ttenglish.vn','TP.HCM',1,'admin','$2a$10$tZre0e19K16q1gO8Z35vFe4v74/O8.B9mF0Kq/W5Yw/rKz8Ua1bEq','2025-01-01','1990-05-10',1),
('NV002','Trần Thu Hà','Giáo viên','0902222222','ha@ttenglish.vn','TP.HCM',1,'gvha','$2a$10$tZre0e19K16q1gO8Z35vFe4v74/O8.B9mF0Kq/W5Yw/rKz8Ua1bEq','2025-02-01','1995-08-15',0),
('NV003','Lê Minh Khôi','Giáo viên','0903333333','khoi@ttenglish.vn','TP.HCM',1,'gvkhoi','$2a$10$tZre0e19K16q1gO8Z35vFe4v74/O8.B9mF0Kq/W5Yw/rKz8Ua1bEq','2025-03-01','1993-11-20',1),
('NV004','Nguyễn Thị Thuỷ','Nhân viên tư vấn','0904444444','thuy@ttenglish.vn','TP.HCM',1,'nvthuy','$2a$10$tZre0e19K16q1gO8Z35vFe4v74/O8.B9mF0Kq/W5Yw/rKz8Ua1bEq','2025-04-01','1997-06-25',0);

-- LopHoc
INSERT INTO LopHoc VALUES
('LH001','BASIC-01','NV002','DTS001','2026-09-01',1,'18:00:00','19:30:00',25,0,'Phòng 101'),
('LH002','COMM-01','NV003','DTS002','2026-09-01',1,'19:45:00','21:15:00',25,0,'Phòng 102'),
('LH003','TOEIC450-01','NV002','DTS003','2026-10-01',1,'18:00:00','19:30:00',30,0,'Phòng 201');
