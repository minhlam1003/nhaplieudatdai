/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  FileSpreadsheet, 
  Trash2, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  Info, 
  LayoutDashboard, 
  Database, 
  FileText,
  Map,
  Settings,
  Save,
  Download,
  Upload,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  FileCheck,
  Hash,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  Eye,
  Users,
  User,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { LAND_FIELDS, FIELD_GROUPS } from './constants';
import { LandData } from './types';
import { cn } from './lib/utils';

type Tab = 'dashboard' | 'entry' | 'browser' | 'settings' | 'users';

interface UserProfile {
  uid: string;
  email: string;
  username?: string;
  password?: string;
  role: 'admin' | 'employee' | 'pending';
  status: 'active' | 'pending' | 'suspended';
  editRangeStart?: string;
  editRangeEnd?: string;
}

interface LoginPageProps {
  onLogin: (email: string, pass: string) => void;
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="bg-white rounded-[32px] shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-10">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
                <Database size={32} />
              </div>
            </div>
            
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Hệ Thống Đăng Nhập</h1>
              <p className="text-slate-500 font-medium text-sm">Vui lòng nhập thông tin để truy cập cơ sở dữ liệu</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Email hoặc Tên đăng nhập
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <User size={18} />
                  </div>
                  <input 
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email hoặc tên người dùng"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Mật Mã Bảo Mật
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <Eye size={18} /> : <AlertCircle size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all focus:ring-4 focus:ring-blue-100"
                >
                  Vào Hệ Thống
                </button>
              </div>
            </form>
          </div>
          
          <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-center">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
               <FileCheck size={12} />
               Secure Database Access Management
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('app-current-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [data, setData] = useState<LandData[]>(() => {
    const saved = localStorage.getItem('app-data');
    return saved ? JSON.parse(saved) : [];
  });
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('app-users');
    let users: UserProfile[] = saved ? JSON.parse(saved) : [
      { 
        uid: 'system-admin', 
        email: 'admin@system.local', 
        username: 'Administrator', 
        password: 'admin', 
        role: 'admin', 
        status: 'active' 
      }
    ];
    
    // Migration: Ensure system-admin has a password if it's missing from old data
    const systemAdmin = users.find(u => u.uid === 'system-admin');
    if (systemAdmin && !systemAdmin.password) {
      systemAdmin.password = 'admin';
    }
    
    return users;
  });
  
  // Save current user whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('app-current-user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('app-current-user');
    }
  }, [currentUser]);
  
  // Save data whenever it changes
  useEffect(() => {
    localStorage.setItem('app-data', JSON.stringify(data));
  }, [data]);

  // Save users whenever they change
  useEffect(() => {
    localStorage.setItem('app-users', JSON.stringify(allUsers));
    
    // Sink currentUser state if it's in the list of modified users
    if (currentUser) {
      const updatedProfile = allUsers.find(u => u.uid === currentUser.uid);
      if (updatedProfile && JSON.stringify(updatedProfile) !== JSON.stringify(currentUser)) {
        setCurrentUser(updatedProfile);
      }
    }
  }, [allUsers, currentUser]);

  // Ensure default admin always has a password (safety check for existing sessions)
  useEffect(() => {
    const adminIndex = allUsers.findIndex(u => u.uid === 'system-admin');
    if (adminIndex !== -1 && !allUsers[adminIndex].password) {
      setAllUsers(prev => prev.map(u => u.uid === 'system-admin' ? { ...u, password: 'admin' } : u));
    }
  }, [allUsers]);

  const [currentEntry, setCurrentEntry] = useState<Partial<LandData>>({});
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: keyof LandData; direction: 'asc' | 'desc' } | null>(null);
  const [notifications, setNotifications] = useState<{id: string, type: 'success' | 'error', message: string}[]>([]);
  const [settingsActiveGroup, setSettingsActiveGroup] = useState(0);
  const [viewingEntryId, setViewingEntryId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  // Global defaults for all fields
  const [globalDefaults, setGlobalDefaults] = useState<Partial<LandData>>(() => {
    const saved = localStorage.getItem('global-defaults');
    return saved ? JSON.parse(saved) : {
      maDinhDanh: 'CQ-01',
      loaiDuLieu: 'Dữ liệu lĩnh vực đất đai'
    };
  });

  const permittedData = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin') return data;
    
    // For employees, filter by nhanDe range visibility
    return data.filter(item => {
      // Robust numeric extraction for nhanDe
      const rawNhanDe = String(item.nhanDe || '').trim();
      // Extract numeric part from the string (e.g. "ND-45419/BC" -> "45419")
      const numericMatch = rawNhanDe.match(/(\d+)/);
      const nhanDeValue = numericMatch ? parseInt(numericMatch[1]) : NaN;
      
      if (isNaN(nhanDeValue)) return false;
      
      const start = currentUser.editRangeStart ? parseInt(String(currentUser.editRangeStart).replace(/\D/g, '')) : null;
      const end = currentUser.editRangeEnd ? parseInt(String(currentUser.editRangeEnd).replace(/\D/g, '')) : null;
      
      if (start !== null && !isNaN(start) && nhanDeValue < start) return false;
      if (end !== null && !isNaN(end) && nhanDeValue > end) return false;
      
      return true;
    });
  }, [data, currentUser]);

  const filteredData = useMemo(() => {
    let result = permittedData.filter(item => {
      const query = searchQuery.toLowerCase();
      return (
        String(item.hoTenChuSuDung || '').toLowerCase().includes(query) ||
        String(item.maHoSoLuuTru || '').toLowerCase().includes(query) ||
        String(item.nhanDe || '').toLowerCase().includes(query) ||
        String(item.tieuDeHoSo || '').toLowerCase().includes(query) ||
        String(item.soGiayChungNhan || '').toLowerCase().includes(query)
      );
    });

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aValue = (a as any)[sortConfig.key];
        const bValue = (b as any)[sortConfig.key];

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        // Special handling for nhanDe numeric sorting
        if (sortConfig.key === 'nhanDe') {
          const aMatch = String(aValue).match(/(\d+)/);
          const bMatch = String(bValue).match(/(\d+)/);
          if (aMatch && bMatch) {
            const aNum = parseInt(aMatch[1]);
            const bNum = parseInt(bMatch[1]);
            if (aNum !== bNum) {
              return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
            }
          }
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue, 'vi') 
            : bValue.localeCompare(aValue, 'vi');
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [permittedData, searchQuery, sortConfig]);

  const stats = useMemo(() => {
    const completed = permittedData.filter(item => item.maHoSoLuuTru && item.hoTenChuSuDung && item.soGiayChungNhan).length;
    const missingGCN = permittedData.filter(item => !item.soGiayChungNhan).length;
    return { completed, missingGCN };
  }, [permittedData]);

  // Real-time data listener removed, replaced by localStorage state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewingEntryId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync document title with browser results
  useEffect(() => {
    if (activeTab === 'browser' && searchQuery) {
      document.title = `Tìm thấy ${filteredData.length} / ${permittedData.length} hồ sơ`;
    } else {
      document.title = 'Hệ Thống Quản Lý Đất Đai';
    }
  }, [activeTab, searchQuery, filteredData.length, data.length]);

  const formatDate = (date: any) => {
    if (!date) return '---';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Lỗi ngày';
    }
  };

  // Real-time users listener removed, replaced by localStorage state
  const [newUser, setNewUser] = useState({ 
    email: '', 
    username: '', 
    password: '', 
    role: 'employee' as UserProfile['role'],
    editRangeStart: '',
    editRangeEnd: ''
  });

  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const handleCreateUser = async () => {
    if (isCreatingUser) return;
    if (!newUser.email && !newUser.username) {
      addNotification('error', 'Vui lòng cung cấp Email hoặc Tên đăng nhập.');
      return;
    }

    setIsCreatingUser(true);
    try {
      const existingEmail = newUser.email ? allUsers.find(u => u.email === newUser.email) : null;
      const existingUser = newUser.username ? allUsers.find(u => u.username === newUser.username) : null;
      
      if (existingEmail || existingUser) {
        addNotification('error', 'Người dùng này đã tồn tại trong hệ thống.');
        setIsCreatingUser(false);
        return;
      }

      const uid = newUser.username || `user-${Math.random().toString(36).substr(2, 9)}`;

      const userPayload: UserProfile = {
        email: newUser.email || '',
        username: newUser.username || '',
        password: newUser.password || '',
        role: newUser.role,
        status: 'active',
        uid: uid,
        editRangeStart: newUser.editRangeStart,
        editRangeEnd: newUser.editRangeEnd
      };

      setAllUsers(prev => [...prev, userPayload]);
      setNewUser({ email: '', username: '', password: '', role: 'employee', editRangeStart: '', editRangeEnd: '' });
      addNotification('success', 'Đã thêm tài khoản mới thành công.');
    } catch (error: any) {
      addNotification('error', 'Không thể tạo người dùng.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = (uid: string) => {
    if (!uid) return;
    if (uid === 'system-admin') {
      addNotification('error', 'Không thể xóa tài khoản hệ thống mặc định.');
      return;
    }
    
    setConfirmDelete({
      isOpen: true,
      title: 'Xác nhận xóa nhân sự',
      message: 'Tài khoản này sẽ bị loại bỏ vĩnh viễn khỏi hệ thống. Quý khách có chắc chắn?',
      onConfirm: () => {
        const uidStr = String(uid);
        setAllUsers(prev => {
          const initialCount = prev.length;
          const filtered = prev.filter(u => String(u.uid) !== uidStr);
          if (filtered.length < initialCount) {
            addNotification('success', 'Đã xóa tài khoản nhân viên thành công.');
          } else {
            addNotification('error', 'Không tìm thấy tài khoản để xóa.');
          }
          return filtered;
        });
        setConfirmDelete(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUpdateUser = async (uid: string, updates: Partial<UserProfile>) => {
    if (!uid) return;
    setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...updates } : u));
    addNotification('success', 'Cập nhật phân quyền thành công.');
  };

  const handleAssignRecord = async (recordId: string, assignedUid: string | null) => {
    if (!recordId) return;
    setData(prev => prev.map(r => r.id === recordId ? { ...r, assignedUid } : r));
    addNotification('success', 'Đã phân chia hồ sơ thành công.');
  };

  // Save global defaults
  useEffect(() => {
    localStorage.setItem('global-defaults', JSON.stringify(globalDefaults));
  }, [globalDefaults]);

  // Initialize entry with defaults when moving to entry tab
  useEffect(() => {
    // Only set defaults if currentEntry is empty (not just missing ID)
    if (activeTab === 'entry' && Object.keys(currentEntry).length === 0) {
      setCurrentEntry({ ...globalDefaults });
    }
  }, [activeTab, currentEntry, globalDefaults]);

  const addNotification = React.useCallback((type: 'success' | 'error', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleLogin = (identifier: string, pass: string) => {
    const cleanId = identifier.trim().toLowerCase();
    const user = allUsers.find(u => 
      (u.email.toLowerCase() === cleanId || u.username?.toLowerCase() === cleanId) && 
      u.password === pass
    );
    if (user) {
      if (user.status !== 'active') {
        addNotification('error', 'Tài khoản của bạn đang bị khóa hoặc chưa được phê duyệt.');
        return;
      }
      setCurrentUser(user);
      addNotification('success', `Chào mừng trở lại, ${user.username || user.email}!`);
    } else {
      addNotification('error', 'Email hoặc mật khẩu không chính xác.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    addNotification('success', 'Đã đăng xuất khỏi hệ thống.');
  };

  const handleInputChange = (key: keyof LandData, value: any) => {
    setCurrentEntry(prev => ({ ...prev, [key]: value }));
  };

  const handleDefaultChange = (key: keyof LandData, value: any) => {
    setGlobalDefaults(prev => ({ ...prev, [key]: value }));
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentUser?.role !== 'admin') {
      addNotification('error', 'Bạn không có quyền nhập dữ liệu vào hệ thống.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const bstr = event.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        addNotification('error', 'File Excel không có dữ liệu!');
        return;
      }

      const fieldMap: Record<string, keyof LandData> = {
        'nhan đề': 'nhanDe',
        'hộp số': 'hopSo',
        'tiêu đề hồ sơ': 'tieuDeHoSo',
        'ngày bắt đầu': 'thoiGianBatDau',
        'ngày kết thúc': 'thoiGianKetThuc',
        'số tờ': 'soLuongTo',
        'nhan de': 'nhanDe',
        'so to': 'soLuongTo',
        'ngay bat dau': 'thoiGianBatDau',
        'ngay ket thuc': 'thoiGianKetThuc'
      };

      try {
        const newRecords = jsonData.map(row => {
          const entry: any = { ...globalDefaults };
          Object.keys(row).forEach(header => {
            const normalizedHeader = header.toLowerCase().trim();
            const fieldKey = fieldMap[normalizedHeader];
            if (fieldKey) {
              let value = row[header];
              if (['thoiGianBatDau', 'thoiGianKetThuc'].includes(fieldKey) && typeof value === 'number') {
                const date = XLSX.SSF.parse_date_code(value);
                value = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
              }
              entry[fieldKey] = value;
            }
          });

          return {
            ...entry,
            id: `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            isImported: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as LandData;
        });

        setData(prev => [...newRecords, ...prev]);
        addNotification('success', `Đã nhập thành công ${jsonData.length} hồ sơ!`);
      } catch (error) {
        addNotification('error', 'Nhập dữ liệu thất bại.');
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveEntry = async () => {
    if (!currentEntry.hoTenChuSuDung) {
      addNotification('error', 'Vui lòng nhập ít nhất Họ tên chủ sử dụng!');
      return;
    }

    try {
      if (currentEntry.id) {
        setData(prev => prev.map(r => r.id === currentEntry.id ? { 
          ...r, 
          ...currentEntry, 
          updatedAt: new Date().toISOString() 
        } : r));
        addNotification('success', 'Đã cập nhật hồ sơ thành công!');
      } else {
        const newEntry = {
          ...currentEntry,
          id: `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as LandData;
        setData(prev => [newEntry, ...prev]);
        addNotification('success', 'Đã lưu hồ sơ thành công!');
      }

      setCurrentEntry({});
      setActiveGroupIndex(0);
      setActiveTab('browser');
    } catch (error: any) {
      addNotification('error', 'Không thể lưu hồ sơ.');
    }
  };

  const canUserEditRecord = (user: UserProfile | null, record: LandData) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'employee') {
      // 1. Cannot edit data imported from Excel
      if (record.isImported) return false;

      // 2. Must be within assigned nhanDe range
      const rawNhanDe = String(record.nhanDe || '').trim();
      const numericMatch = rawNhanDe.match(/(\d+)/);
      const nhanDeValue = numericMatch ? parseInt(numericMatch[1]) : NaN;
      
      if (isNaN(nhanDeValue)) return false; 
      
      const start = user.editRangeStart ? parseInt(String(user.editRangeStart).replace(/\D/g, '')) : null;
      const end = user.editRangeEnd ? parseInt(String(user.editRangeEnd).replace(/\D/g, '')) : null;
      
      if (start !== null && !isNaN(start) && nhanDeValue < start) return false;
      if (end !== null && !isNaN(end) && nhanDeValue > end) return false;
      
      return true;
    }
    return false;
  };

  const handleEditEntry = (item: LandData) => {
    if (!canUserEditRecord(currentUser, item)) {
      addNotification('error', 'Bạn không có quyền chỉnh sửa hồ sơ nằm ngoài dải nhan đề được cấp.');
      return;
    }
    setCurrentEntry({ ...item });
    setActiveTab('entry');
    setActiveGroupIndex(0);
  };

  const handleDeleteEntry = (id: string) => {
    if (currentUser?.role !== 'admin') {
      addNotification('error', 'Bạn không có quyền xóa dữ liệu khỏi hệ thống.');
      return;
    }
    if (!id) return;
    setConfirmDelete({
      isOpen: true,
      title: 'Xác nhận xóa hồ sơ',
      message: 'Hồ sơ này sẽ bị xóa khỏi kho lưu trữ. Bạn có chắc chắn muốn thực hiện?',
      onConfirm: () => {
        const idStr = String(id);
        setData(prev => {
          const initialCount = prev.length;
          const filtered = prev.filter(r => String(r.id) !== idStr);
          if (filtered.length < initialCount) {
            addNotification('success', 'Đã xóa hồ sơ thành công.');
          } else {
            addNotification('error', 'Không tìm thấy hồ sơ để xóa.');
          }
          return filtered;
        });
        setConfirmDelete(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      addNotification('error', 'Không có dữ liệu để xuất!');
      return;
    }

    const exportData = data.map(item => {
      const row: any = {};
      LAND_FIELDS.forEach(field => {
        row[field.label] = (item as any)[field.key] || '';
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
    
    XLSX.writeFile(workbook, `HoSoDatDai_${new Date().toISOString().split('T')[0]}.xlsx`);
    addNotification('success', 'Đã xuất file Excel thành công.');
  };

  const nextGroup = () => {
    if (activeGroupIndex < FIELD_GROUPS.length - 1) {
      setActiveGroupIndex(activeGroupIndex + 1);
    } else {
      handleSaveEntry();
    }
  };

  const prevGroup = () => {
    if (activeGroupIndex > 0) {
      setActiveGroupIndex(activeGroupIndex - 1);
    }
  };

  const toggleSort = (key: keyof LandData) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length && filteredData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(item => item.id)));
    }
  };

  const handleBatchDelete = () => {
    if (currentUser?.role !== 'admin') {
      addNotification('error', 'Bạn không có quyền thực hiện thao tác xóa hàng loạt.');
      return;
    }
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;

    setConfirmDelete({
      isOpen: true,
      title: 'Xóa hàng loạt hồ sơ',
      message: `Bạn đang chọn xóa vĩnh viễn ${count} hồ sơ. Thao tác này không thể hoàn tác. Quý khách có chắc chắn?`,
      onConfirm: () => {
        const idsToDelete = new Set(Array.from(selectedIds).map(id => String(id)));
        
        setData(prev => {
          const initialCount = prev.length;
          const filtered = prev.filter(r => !idsToDelete.has(String(r.id)));
          const deletedCount = initialCount - filtered.length;
          
          if (deletedCount > 0) {
            addNotification('success', `Đã xóa thành công ${deletedCount} hồ sơ!`);
          } else {
            addNotification('error', 'Không có hồ sơ nào bị xóa.');
          }
          return filtered;
        });
        
        setSelectedIds(new Set());
        setConfirmDelete(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const activeFields = LAND_FIELDS.filter(f => f.group === FIELD_GROUPS[activeGroupIndex]);
  const settingsFields = LAND_FIELDS.filter(f => f.group === FIELD_GROUPS[settingsActiveGroup]);

  // Calculate entry progress
  const filledFieldsCount = Object.keys(currentEntry).filter(k => currentEntry[k as keyof LandData]).length;
  const totalFieldsCount = LAND_FIELDS.length;
  const progressPercent = Math.round((filledFieldsCount / totalFieldsCount) * 100);

  if (!currentUser) {
    return (
      <>
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
          <AnimatePresence>
            {notifications.map(n => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className={cn(
                  "p-4 rounded-xl shadow-lg flex items-center gap-3 min-w-[300px] border",
                  n.type === 'success' ? "bg-white border-green-100 text-gray-800" : "bg-red-50 border-red-100 text-red-800"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  n.type === 'success' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                )}>
                  {n.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold tracking-tight">{n.message}</p>
                </div>
                <button 
                  onClick={() => removeNotification(n.id)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Notifications */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={cn(
                "p-4 rounded-xl shadow-lg flex items-center gap-3 min-w-[300px] border",
                n.type === 'success' ? "bg-white border-green-100 text-gray-800" : "bg-red-50 border-red-100 text-red-800"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                n.type === 'success' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              )}>
                {n.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              </div>
              <span className="text-sm font-semibold flex-1">{n.message}</span>
              <button 
                onClick={() => removeNotification(n.id)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Connection Status Banner */}
      <div className={cn(
        "fixed bottom-4 left-4 z-[90] px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-2 border uppercase tracking-wider bg-white/90 border-emerald-100 text-emerald-600"
      )}>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-500" />
        Hệ thống Hoạt động
      </div>

      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Hệ Thống Quản Lý Dữ Liệu Đất Đai</h1>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Phần mềm nhập liệu tập trung v2.4</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Xuất Excel (.xlsx)</span>
            </button>
            {activeTab === 'entry' && (
              <button
                onClick={handleSaveEntry}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 shadow-blue-100 transition-all"
              >
                Lưu Dữ Liệu
              </button>
            )}

            <div className="h-8 w-px bg-gray-200 mx-2" />
            
            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                 <div className="text-[11px] font-black text-gray-900 leading-none uppercase">{currentUser?.username || currentUser?.email}</div>
                 <div className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter mt-1">
                   {currentUser?.role === 'admin' ? 'Quản trị viên' : 'Cán bộ nghiệp vụ'}
                 </div>
               </div>
               <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm leading-none">
                 <User size={18} />
               </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-72 bg-white border-r border-gray-200 flex flex-col p-6 space-y-6 overflow-y-auto">
            {/* Nav */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === 'dashboard' ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <LayoutDashboard size={18} />
                Tổng quan hệ thống
              </button>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    setCurrentEntry({ ...globalDefaults });
                    setActiveTab('entry');
                    setActiveGroupIndex(0);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    activeTab === 'entry' ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Plus size={18} />
                  Tạo hồ sơ mới
                </button>
              )}
              <button
                onClick={() => setActiveTab('browser')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === 'browser' ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Database size={18} />
                Kho dữ liệu tổng
              </button>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    activeTab === 'settings' ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Settings size={18} />
                  Cấu hình hệ thống
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full mt-4 flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
              >
                <X size={18} />
                Đăng xuất tài khoản
              </button>
            </nav>

            {/* Status Card (Minimalism Style) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái hệ thống</h2>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                    <span>Hồ sơ đã nhập</span>
                    <span className="text-gray-900">{permittedData.length}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                    <span>Tiến độ nhập hiện tại</span>
                    <span className="text-gray-900">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-orange-400 h-1.5 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100 flex gap-3">
                  <div className="text-blue-500 mt-0.5"><Info size={14} /></div>
                  <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                    Hệ thống tự động lưu trữ dữ liệu vào bộ nhớ đệm trình duyệt sau mỗi thao tác.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-3">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm uppercase">
                            AD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">
                                Administrator
                            </p>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">
                                Hệ thống quản trị
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={12} className="text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Phiên làm việc</span>
                    </div>
                    <p className="text-[11px] text-gray-600 font-medium">Khởi tạo lúc: {new Date().toLocaleTimeString('vi-VN')}</p>
                </div>
            </div>
          </aside>

          {/* Main Body */}
          <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-8 max-w-6xl mx-auto"
                >
                  <header className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Tổng quan quản lý</h2>
                    <p className="text-sm text-gray-500 mt-1">Theo dõi tiến độ số hóa và quản lý hồ sơ tập trung</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                      <div className="p-2.5 bg-blue-50 w-fit rounded-xl text-blue-600 mb-4">
                        <Database size={20} />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Tổng hồ sơ lưu trữ</p>
                      <h3 className="text-3xl font-bold text-gray-900">{permittedData.length}</h3>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                      <div className="p-2.5 bg-green-50 w-fit rounded-xl text-green-600 mb-4">
                        <FileCheck size={20} />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Dữ liệu hoàn thiện</p>
                      <h3 className="text-3xl font-bold text-gray-900">{stats.completed}</h3>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                      <div className="p-2.5 bg-orange-50 w-fit rounded-xl text-orange-600 mb-4">
                        <AlertCircle size={20} />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Chưa có số GCN</p>
                      <h3 className="text-3xl font-bold text-gray-900">{stats.missingGCN}</h3>
                    </div>
                  </div>

                  <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                       <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Hồ sơ mới cập nhật</h3>
                       <button onClick={() => setActiveTab('browser')} className="text-xs font-bold text-blue-600 hover:underline">Xem tất cả</button>
                    </div>
                    {permittedData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50/50">
                              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Mã lưu trữ</th>
                              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Chủ sở hữu</th>
                              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Ngày tạo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {permittedData.slice(0, 5).map(item => (
                              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 text-xs font-semibold text-blue-600 font-mono">{item.maHoSoLuuTru || '---'}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-700">{item.hoTenChuSuDung}</td>
                                <td className="px-6 py-4 text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center p-4 bg-gray-50 rounded-full text-gray-300 mb-4">
                          <Database size={24} />
                        </div>
                        <p className="text-sm text-gray-400 italic font-medium">Hệ thống chưa có dữ liệu hồ sơ nào</p>
                      </div>
                    )}
                  </section>
                </motion.div>
              )}

              {activeTab === 'settings' && currentUser?.role === 'admin' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8 max-w-6xl mx-auto"
                >
                  <header className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Cấu hình hệ thống</h2>
                    <p className="text-sm text-gray-500 mt-1">Thiết lập bộ giá trị mặc định cho tất cả hồ sơ mới truy xuất vào hệ thống</p>
                  </header>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                    {/* Settings Sidebar */}
                    <div className="w-full md:w-64 bg-gray-50/50 border-r border-gray-100 p-6 flex flex-col">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Nhóm cấu hình</h3>
                      <div className="space-y-2">
                        {FIELD_GROUPS.map((group, index) => (
                           <button
                             key={index}
                             onClick={() => setSettingsActiveGroup(index)}
                             className={cn(
                                 "w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all",
                                 (index === settingsActiveGroup && settingsActiveGroup !== 99) 
                                     ? "bg-white shadow-sm border border-gray-100 text-blue-600 font-bold" 
                                     : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                             )}
                           >
                                <div className={cn(
                                    "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0",
                                    (index === settingsActiveGroup && settingsActiveGroup !== 99) ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                                )}>
                                    {index + 1}
                                </div>
                                <span className="text-xs leading-tight">{group}</span>
                           </button>
                        ))}

                        {currentUser?.role === 'admin' && (
                          <div className="pt-4 mt-4 border-t border-gray-200">
                             <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Quản trị</h3>
                             <button
                               onClick={() => setSettingsActiveGroup(99)}
                               className={cn(
                                   "w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all relative",
                                   settingsActiveGroup === 99 
                                       ? "bg-white shadow-sm border border-gray-100 text-blue-600 font-bold" 
                                       : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                               )}
                             >
                                <div className={cn(
                                    "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                                    settingsActiveGroup === 99 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                                )}>
                                    <Users size={12} />
                                </div>
                                <span className="text-xs font-bold transition-all">Nhân sự hệ thống</span>
                                {allUsers.filter(u => u.status === 'pending' || u.role === 'pending').length > 0 && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-sm">
                                    {allUsers.filter(u => u.status === 'pending' || u.role === 'pending').length}
                                  </span>
                                )}
                             </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Settings Content */}
                    <div className="flex-1 p-8 flex flex-col bg-white">
                       {settingsActiveGroup === 99 ? (
                         <div className="flex-1 flex flex-col animate-in fade-in duration-500">
                           <header className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
                             <div>
                               <h3 className="text-xl font-bold text-gray-800 tracking-tight">Quản lý nhân sự</h3>
                               <p className="text-xs text-gray-500 mt-1">Phân quyền, duyệt tài khoản và quản trị danh sách nhân viên</p>
                             </div>
                           </header>

                           <div className="flex-1 overflow-y-auto pr-2">
                             {/* Create User Mini-Form */}
                             <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-8">
                               <div className="flex items-center gap-2 mb-4">
                                 <Plus className="text-blue-600" size={16} />
                                 <h4 className="text-xs font-bold text-gray-900 uppercase">Tạo tài khoản cán bộ</h4>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-3">
                                 <input 
                                   placeholder="Tên hiển thị"
                                   className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                   value={newUser.username}
                                   onChange={e => setNewUser({...newUser, username: e.target.value})}
                                 />
                                 <input 
                                   placeholder="Email / Đăng nhập"
                                   className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                   value={newUser.email}
                                   onChange={e => setNewUser({...newUser, email: e.target.value})}
                                 />
                                 <input 
                                   type="password"
                                   placeholder="Mật khẩu"
                                   className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                   value={newUser.password}
                                   onChange={e => setNewUser({...newUser, password: e.target.value})}
                                 />
                                 <select 
                                   className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none cursor-pointer"
                                   value={newUser.role}
                                   onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                                 >
                                   <option value="employee">Cán bộ</option>
                                   <option value="admin">Quản trị viên</option>
                                 </select>

                                 <input 
                                   placeholder="Từ nhan đề"
                                   className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                   value={newUser.editRangeStart}
                                   disabled={newUser.role !== 'employee'}
                                   onChange={e => setNewUser({...newUser, editRangeStart: e.target.value})}
                                 />
                                 <input 
                                   placeholder="Đến nhan đề"
                                   className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                   value={newUser.editRangeEnd}
                                   disabled={newUser.role !== 'employee'}
                                   onChange={e => setNewUser({...newUser, editRangeEnd: e.target.value})}
                                 />

                                 <button 
                                   onClick={handleCreateUser}
                                   disabled={isCreatingUser}
                                   className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                 >
                                   {isCreatingUser ? 'Đang tạo...' : 'Tạo'}
                                 </button>
                               </div>
                             </div>

                             {/* Stats Grid */}
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
                               <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cán bộ</div>
                                 <div className="text-2xl font-black text-gray-900">{allUsers.filter(u => u.role === 'employee').length}</div>
                               </div>
                               <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Admin</div>
                                 <div className="text-2xl font-black text-blue-600">{allUsers.filter(u => u.role === 'admin').length}</div>
                               </div>
                               <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Chờ duyệt</div>
                                 <div className="text-2xl font-black text-orange-500">{allUsers.filter(u => u.role === 'pending' || u.status === 'pending').length}</div>
                               </div>
                             </div>

                             {/* User Table Header */}
                             <div className="bg-gray-50 p-3 rounded-t-xl border-x border-t border-gray-100 grid grid-cols-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                               <div className="pl-3">Nhân sự</div>
                               <div>Phân quyền</div>
                               <div>Dải nhan đề sửa</div>
                               <div>Trạng thái</div>
                               <div className="text-right pr-3">Thao tác</div>
                             </div>
                             <div className="border border-gray-100 rounded-b-xl overflow-hidden divide-y divide-gray-50">
                               {allUsers.map(user => (
                                 <div key={user.uid} className={cn(
                                   "p-3 grid grid-cols-5 items-center bg-white hover:bg-gray-50/50 transition-colors",
                                   (user.status === 'pending' || user.role === 'pending') && "bg-orange-50/20"
                                 )}>
                                   <div className="pl-3">
                                     <div className="text-xs font-bold text-gray-900">{user.username || '---'}</div>
                                     <div className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">{user.email}</div>
                                   </div>
                                   <div>
                                     <select 
                                       value={user.role}
                                       onChange={(e) => handleUpdateUser(user.uid, { role: e.target.value as any })}
                                       className="bg-transparent text-[10px] font-bold text-gray-600 border-none focus:ring-0 cursor-pointer"
                                     >
                                       <option value="admin">Quản trị viên</option>
                                       <option value="employee">Cán bộ</option>
                                       <option value="pending">Chờ xử lý</option>
                                     </select>
                                   </div>
                                   <div className="flex items-center gap-1">
                                      {user.role === 'employee' ? (
                                        <>
                                          <input 
                                            type="text"
                                            placeholder="Từ"
                                            className="w-16 px-1 py-0.5 border border-gray-200 rounded text-[10px] font-mono outline-none focus:border-blue-500"
                                            value={user.editRangeStart || ''}
                                            onChange={(e) => handleUpdateUser(user.uid, { editRangeStart: e.target.value })}
                                          />
                                          <span className="text-gray-300">-</span>
                                          <input 
                                            type="text"
                                            placeholder="Đến"
                                            className="w-16 px-1 py-0.5 border border-gray-200 rounded text-[10px] font-mono outline-none focus:border-blue-500"
                                            value={user.editRangeEnd || ''}
                                            onChange={(e) => handleUpdateUser(user.uid, { editRangeEnd: e.target.value })}
                                          />
                                        </>
                                      ) : (
                                        <span className="text-[9px] text-gray-300 italic">Tất cả (Chỉnh sửa)</span>
                                      )}
                                   </div>
                                   <div>
                                     <div 
                                       onClick={() => handleUpdateUser(user.uid, { status: user.status === 'active' ? 'suspended' : 'active' })}
                                       className={cn(
                                         "inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase cursor-pointer transition-all",
                                         user.status === 'active' ? "bg-green-100 text-green-600 hover:bg-red-50 hover:text-red-600" : "bg-red-100 text-red-600 hover:bg-green-50 hover:text-green-600"
                                       )}
                                     >
                                       {user.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                                     </div>
                                   </div>
                                   <div className="text-right pr-3">
                                      <button 
                                        onClick={() => handleDeleteUser(user.uid)}
                                        className="text-gray-300 hover:text-red-500 p-1"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         </div>
                       ) : (
                         <>
                           <header className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
                              <div>
                                 <h3 className="text-xl font-bold text-gray-800 tracking-tight">{FIELD_GROUPS[settingsActiveGroup]}</h3>
                                 <p className="text-xs text-gray-500 mt-1">Cấu hình giá trị mặc định cho nhóm này</p>
                              </div>
                              <div className="flex gap-2">
                                 <button
                                   onClick={() => {
                                     setGlobalDefaults({});
                                     addNotification('success', 'Đã xóa tất cả cấu hình mặc định.');
                                   }}
                                   className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                 >
                                   Xóa tất cả
                                 </button>
                              </div>
                           </header>

                           <div className="flex-1 overflow-y-auto pr-2">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                                 {settingsFields.map(field => (
                                   <div key={field.key} className={cn("space-y-1.5", (field.type === 'textarea' || field.key === 'hoTenChuSuDung') && "md:col-span-2")}>
                                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                                       {field.label}
                                     </label>
                                     
                                     {field.type === 'select' ? (
                                       <select
                                         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all font-medium"
                                         value={(globalDefaults as any)[field.key] || ''}
                                         onChange={(e) => handleDefaultChange(field.key, e.target.value)}
                                       >
                                         <option value="">(Không có mặc định)</option>
                                         {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                       </select>
                                     ) : field.type === 'textarea' ? (
                                        <textarea
                                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all h-20 resize-none font-medium"
                                          value={(globalDefaults as any)[field.key] || ''}
                                          onChange={(e) => handleDefaultChange(field.key, e.target.value)}
                                          placeholder="---"
                                        />
                                     ) : (
                                       <input
                                         type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                                         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all font-medium"
                                         value={(globalDefaults as any)[field.key] || ''}
                                         onChange={(e) => handleDefaultChange(field.key, e.target.value)}
                                         placeholder="---"
                                       />
                                     )}
                                   </div>
                                 ))}
                              </div>
                           </div>
                         </>
                       )}

                       <footer className="mt-auto pt-6 border-t border-gray-50 flex justify-end gap-3">
                          <button
                            onClick={() => setActiveTab('dashboard')}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all font-sans"
                          >
                            Hủy bỏ
                          </button>
                          <button
                            onClick={() => {
                              addNotification('success', 'Đã lưu cấu hình mặc định hệ thống!');
                              setActiveTab('dashboard');
                            }}
                            className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
                          >
                            <Save size={16} />
                            <span>Lưu tất cả cấu hình</span>
                          </button>
                       </footer>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'entry' && (
                <motion.div
                  key="entry"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 max-w-5xl mx-auto"
                >
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row h-full min-h-[600px]">
                    {/* Progress Sidebar */}
                    <div className="w-full md:w-64 bg-gray-50/50 border-r border-gray-100 p-6 flex flex-col">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Trình tự nhập liệu</h3>
                      <div className="space-y-3">
                        {FIELD_GROUPS.map((group, index) => (
                           <button
                            key={index}
                            onClick={() => setActiveGroupIndex(index)}
                            className={cn(
                                "w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all",
                                index === activeGroupIndex 
                                    ? "bg-white shadow-sm border border-gray-100 text-blue-600 font-bold" 
                                    : index < activeGroupIndex
                                        ? "text-blue-400 font-medium"
                                        : "text-gray-400 font-medium"
                            )}
                           >
                                <div className={cn(
                                    "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0",
                                    index === activeGroupIndex ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                                )}>
                                    {index + 1}
                                </div>
                                <span className={cn("text-xs leading-tight truncate")}>{group}</span>
                           </button>
                        ))}
                      </div>

                      <div className="mt-auto pt-8">
                         <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                             <h4 className="text-[10px] font-bold text-blue-800 uppercase mb-2">Ghi chú</h4>
                             <p className="text-[10px] text-blue-600/80 leading-relaxed font-medium">Sử dụng phím Tab để di chuyển nhanh. Nhập chính xác mã lưu trữ để tra cứu.</p>
                         </div>
                      </div>
                    </div>

                    {/* Entry Form */}
                    <div className="flex-1 p-8 flex flex-col">
                      <header className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
                         <div>
                            <h2 className="text-xl font-bold text-gray-800 tracking-tight">{FIELD_GROUPS[activeGroupIndex]}</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">Phiếu ghi định danh: #REC-{Math.floor(Date.now()/1000000)}</p>
                         </div>
                         <div className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-bold tracking-widest uppercase">
                            Nhóm {activeGroupIndex + 1}/{FIELD_GROUPS.length}
                         </div>
                      </header>

                      <div className="flex-1 overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                          {activeFields.map(field => (
                            <div key={field.key} className={cn("space-y-1.5", (field.type === 'textarea' || field.key === 'hoTenChuSuDung') && "md:col-span-2")}>
                              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                {field.label}
                                {field.defaultValue && <span className="text-blue-500">*</span>}
                              </label>
                              
                              {field.type === 'textarea' ? (
                                <textarea
                                  disabled={
                                    currentUser?.role === 'employee' && 
                                    !!currentEntry.id && 
                                    (activeGroupIndex === 0 || activeGroupIndex === 1 || activeGroupIndex === 2)
                                  }
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-24 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                                  value={(currentEntry as any)[field.key] || field.defaultValue || ''}
                                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                                  placeholder={`Ví dụ: ${field.example || '...'}`}
                                />
                              ) : field.type === 'select' ? (
                                <select
                                  disabled={
                                    currentUser?.role === 'employee' && 
                                    !!currentEntry.id && 
                                    (activeGroupIndex === 0 || activeGroupIndex === 1 || activeGroupIndex === 2)
                                  }
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                                  value={(currentEntry as any)[field.key] || field.defaultValue || ''}
                                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                                >
                                  <option value="" disabled>-- Chọn {field.label.toLowerCase()} --</option>
                                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : (
                                <div className="relative group">
                                  <input
                                    type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                                    disabled={
                                      currentUser?.role === 'employee' && 
                                      !!currentEntry.id && 
                                      (activeGroupIndex === 0 || activeGroupIndex === 1 || activeGroupIndex === 2)
                                    }
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                                    value={(currentEntry as any)[field.key] || field.defaultValue || ''}
                                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                                    placeholder={field.example ? `VD: ${field.example}` : 'Nhập thông tin...'}
                                  />
                                  {field.description && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                       <Info size={14} className="text-gray-300" />
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <p className="text-[10px] text-gray-500 font-medium">
                                {field.description || 'Thông tin cần thiết theo biểu mẫu quy định.'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <footer className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                         <span className="text-[10px] text-gray-400 italic flex items-center gap-1">
                            <AlertCircle size={10} /> Lưu ý: Các trường đánh dấu sao là thông tin phân loại chính.
                         </span>

                         <div className="flex gap-3">
                            {currentEntry.id && (
                              <button
                                onClick={() => {
                                  setCurrentEntry({ ...globalDefaults });
                                  setActiveGroupIndex(0);
                                }}
                                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all border-dashed"
                              >
                                Hủy sửa ({currentEntry.maHoSoLuuTru || 'HS'})
                              </button>
                            )}
                            <button
                                onClick={prevGroup}
                                disabled={activeGroupIndex === 0}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                                    activeGroupIndex === 0 ? "opacity-0 invisible" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                )}
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={nextGroup}
                                className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
                            >
                                {activeGroupIndex === FIELD_GROUPS.length - 1 ? 'Hoàn tất & Lưu' : 'Tiếp theo'}
                            </button>
                         </div>
                      </footer>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'browser' && (
                <motion.div
                  key="browser"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8 relative"
                >
                  <div className="max-w-7xl mx-auto">
                    <AnimatePresence>
                      {viewingEntryId && (
                        <>
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewingEntryId(null)}
                            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60]"
                          />
                          <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[70] flex flex-col"
                          >
                            {(() => {
                              const entry = data.find(d => d.id === viewingEntryId);
                              if (!entry) return null;
                              return (
                                <>
                                  <header className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                    <div>
                                      <h3 className="text-xl font-bold text-gray-800 tracking-tight">Chi tiết hồ sơ</h3>
                                      <p className="text-xs text-gray-400 font-mono mt-1 uppercase tracking-wider">{entry.maHoSoLuuTru || entry.id}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => {
                                          setViewingEntryId(null);
                                          handleEditEntry(entry);
                                        }}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        title="Chỉnh sửa hồ sơ"
                                      >
                                        <Edit2 size={20} />
                                      </button>
                                      <button 
                                        onClick={() => setViewingEntryId(null)}
                                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
                                      >
                                        <X size={20} />
                                      </button>
                                    </div>
                                  </header>
                                  
                                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                                    {FIELD_GROUPS.map((group, gIdx) => {
                                      const groupFields = LAND_FIELDS.filter(f => f.group === group);
                                      return (
                                        <section key={group} className="space-y-4">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-xs font-bold">
                                              {gIdx + 1}
                                            </div>
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{group}</h4>
                                          </div>
                                          
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                                            {groupFields.map(field => (
                                              <div key={field.key} className={cn("space-y-1", field.type === 'textarea' && "sm:col-span-2")}>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{field.label}</span>
                                                <div className="text-sm text-gray-700 font-medium leading-relaxed">
                                                  {(entry as any)[field.key] || <span className="text-gray-300 italic text-xs font-normal">Chưa nhập dữ liệu</span>}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </section>
                                      );
                                    })}
                                  </div>
                                  
                                  <footer className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                                    <button 
                                      onClick={() => setViewingEntryId(null)}
                                      className="px-8 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-200 hover:bg-black transition-all"
                                    >
                                      Đóng
                                    </button>
                                  </footer>
                                </>
                              );
                            })()}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Cơ sở dữ liệu tập trung</h2>
                        <p className="text-sm text-gray-500 font-medium mt-1">Tra cứu nhanh hồ sơ qua hệ thống mã số hóa lưu trữ</p>
                      </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                            <input
                              type="text"
                              placeholder="Tìm tên chủ, GCN hoặc mã mã hồ sơ..."
                              className="bg-white border border-gray-100 rounded-xl pl-11 pr-12 py-2.5 text-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all w-full md:w-80 font-medium shadow-sm"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                              <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 p-1"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                          {searchQuery && (
                            <div className="hidden lg:flex items-center text-[10px] font-black text-blue-600 bg-blue-50 px-3 rounded-xl uppercase tracking-widest whitespace-nowrap">
                               Tìm thấy {filteredData.length} / {permittedData.length} hồ sơ
                            </div>
                          )}
                          
                          {currentUser?.role === 'admin' && (
                            <label className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all cursor-pointer">
                              <Upload size={16} className="text-blue-500" />
                              <span>Nhập Excel</span>
                              <input
                                type="file"
                                accept=".xlsx, .xls"
                                className="hidden"
                                onChange={handleImportExcel}
                              />
                            </label>
                          )}

                          {currentUser?.role === 'admin' && (
                            <button 
                              onClick={() => {
                                setCurrentEntry({ ...globalDefaults });
                                setActiveTab('entry');
                                setActiveGroupIndex(0);
                              }}
                              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all font-sans"
                            >
                              <Plus size={16} />
                              <span>Tạo mới</span>
                            </button>
                          )}
                        </div>
                    </header>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
                      {/* Batch Actions Bar */}
                      <AnimatePresence>
                        {selectedIds.size > 0 && (
                          <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/10"
                          >
                            <div className="flex items-center gap-3 pr-6 border-r border-white/20">
                              <div className="bg-blue-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                                {selectedIds.size}
                              </div>
                              <span className="text-sm font-bold tracking-tight">Hồ sơ được chọn</span>
                            </div>
                            
                            {currentUser?.role === 'admin' && (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={handleBatchDelete}
                                  className="flex items-center gap-2 px-4 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-all"
                                >
                                  <Trash2 size={14} />
                                  <span>Xóa nhanh</span>
                                </button>
                                
                                <button 
                                  onClick={() => setSelectedIds(new Set())}
                                  className="px-4 py-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                                >
                                  Hủy chọn
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50/50">
                              <th className="px-6 py-4 w-12">
                                <div className="flex items-center justify-center">
                                  <input 
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                    checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                                    onChange={toggleSelectAll}
                                  />
                                </div>
                              </th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">STT</th>
                              <th 
                                className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-blue-500 transition-colors"
                                onClick={() => toggleSort('maHoSoLuuTru')}
                              >
                                <div className="flex items-center gap-1.5">
                                  Mã Hồ Sơ
                                  {sortConfig?.key === 'maHoSoLuuTru' ? (
                                    sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />
                                  ) : (
                                    <ArrowUpDown size={12} className="text-gray-300" />
                                  )}
                                </div>
                              </th>
                              <th 
                                className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-blue-500 transition-colors"
                                onClick={() => toggleSort('nhanDe')}
                              >
                                <div className="flex items-center gap-1.5">
                                  Nhan Đề
                                  {sortConfig?.key === 'nhanDe' ? (
                                    sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />
                                  ) : (
                                    <ArrowUpDown size={12} className="text-gray-300" />
                                  )}
                                </div>
                              </th>
                              <th 
                                className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-blue-500 transition-colors"
                                onClick={() => toggleSort('hoTenChuSuDung')}
                              >
                                <div className="flex items-center gap-1.5">
                                  Chủ Sở Hữu
                                  {sortConfig?.key === 'hoTenChuSuDung' ? (
                                    sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />
                                  ) : (
                                    <ArrowUpDown size={12} className="text-gray-300" />
                                  )}
                                </div>
                              </th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Số GCN</th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 font-sans">Thông Tin Khác</th>
                              <th 
                                className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-blue-500 transition-colors"
                                onClick={() => toggleSort('createdAt')}
                              >
                                <div className="flex items-center gap-1.5">
                                  Ngày Nhập
                                  {sortConfig?.key === 'createdAt' ? (
                                    sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />
                                  ) : (
                                    <ArrowUpDown size={12} className="text-gray-300" />
                                  )}
                                </div>
                              </th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Tác vụ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {filteredData.length > 0 ? (
                              filteredData.map((item, idx) => (
                                <tr 
                                  key={item.id} 
                                  className={cn(
                                    "hover:bg-gray-50/50 transition-colors group",
                                    selectedIds.has(item.id) && "bg-blue-50/30"
                                  )}
                                >
                                  <td className="px-6 py-4 w-12 text-center">
                                    <input 
                                      type="checkbox"
                                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                      checked={selectedIds.has(item.id)}
                                      onChange={() => toggleSelectOne(item.id)}
                                    />
                                  </td>
                                  <td className="px-6 py-4 font-mono text-[10px] text-gray-400">{idx + 1}</td>
                                  <td className="px-6 py-4">
                                    <div className="font-mono font-bold text-blue-600">{item.maHoSoLuuTru || '---'}</div>
                                    <div className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">{item.maDinhDanh}</div>
                                  </td>
                                  <td className="px-6 py-4 max-w-[180px]">
                                    <div className="text-xs font-semibold text-gray-700 truncate" title={item.nhanDe}>
                                      {item.nhanDe || <span className="text-gray-300 italic">Không có</span>}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 font-bold text-gray-800">{item.hoTenChuSuDung}</td>
                                  <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 rounded-md text-[10px] font-mono font-bold text-gray-600 border border-gray-200">
                                      {item.soGiayChungNhan || 'KHÔNG CÓ'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 max-w-[200px] text-xs text-gray-500 font-medium truncate italic">
                                    {item.loaiHoSo || 'Chưa phân loại'}
                                  </td>
                                  <td className="px-6 py-4 text-gray-400 text-[11px] font-medium">
                                    {formatDate(item.createdAt)}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button 
                                        onClick={() => setViewingEntryId(item.id)}
                                        className="p-2 text-gray-300 hover:text-blue-500 transition-colors"
                                        title="Xem chi tiết"
                                      >
                                        <Eye size={16} />
                                      </button>
                                      {canUserEditRecord(currentUser, item) ? (
                                        <button 
                                          onClick={() => handleEditEntry(item)}
                                          className="p-2 text-gray-300 hover:text-blue-500 transition-colors"
                                          title="Chỉnh sửa hồ sơ"
                                        >
                                          <Edit2 size={16} />
                                        </button>
                                      ) : (
                                        <div className="p-2 text-gray-100 cursor-not-allowed" title="Ngoài dải nhan đề được cấp quyền">
                                          <Lock size={14} />
                                        </div>
                                      )}
                                      {currentUser?.role === 'admin' && (
                                        <button 
                                          onClick={() => handleDeleteEntry(item.id)}
                                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                          title="Xóa hồ sơ"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={8} className="p-20 text-center">
                                  <div className="inline-flex items-center justify-center p-6 bg-gray-50 rounded-full text-gray-200 mb-6 scale-110">
                                    {searchQuery ? <Search size={40} /> : <Database size={40} />}
                                  </div>
                                  <p className="text-gray-900 font-bold mb-1">{searchQuery ? 'Không tìm thấy hồ sơ phù hợp' : 'Chưa có hồ sơ được số hóa'}</p>
                                  <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                                    {searchQuery ? 'Vui lòng thử lại với từ khóa khác hoặc xóa bộ lọc tìm kiếm.' : 'Bắt đầu quá trình lưu trữ bằng cách tạo hồ sơ mới hoặc nhập dữ liệu từ Excel.'}
                                  </p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {confirmDelete.isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
              >
                <div className="p-8">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6">
                    <Trash2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmDelete.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed tabular-nums">{confirmDelete.message}</p>
                </div>
                <div className="p-6 bg-gray-50 flex gap-3">
                  <button 
                    onClick={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={confirmDelete.onConfirm}
                    className="flex-1 px-4 py-3 bg-red-600 rounded-xl text-xs font-bold text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-all cursor-pointer"
                  >
                    Xác nhận xóa
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

