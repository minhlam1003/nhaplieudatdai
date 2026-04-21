/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Edit2,
  Eye,
  Users,
  LogOut,
  LogIn,
  UserPlus,
  User,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  where, 
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
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
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [data, setData] = useState<LandData[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('manual-session');
    return saved ? JSON.parse(saved) : null;
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [isManualAdmin, setIsManualAdmin] = useState(() => {
    return !!localStorage.getItem('manual-session');
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
  const [currentEntry, setCurrentEntry] = useState<Partial<LandData>>({});
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: keyof LandData; direction: 'asc' | 'desc' } | null>(null);
  const [notifications, setNotifications] = useState<{id: string, type: 'success' | 'error', message: string}[]>([]);
  const [settingsActiveGroup, setSettingsActiveGroup] = useState(0);
  const [viewingEntryId, setViewingEntryId] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Global defaults for all fields
  const [globalDefaults, setGlobalDefaults] = useState<Partial<LandData>>(() => {
    const saved = localStorage.getItem('global-defaults');
    return saved ? JSON.parse(saved) : {
      maDinhDanh: 'CQ-01',
      loaiDuLieu: 'Dữ liệu lĩnh vực đất đai'
    };
  });

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        if (!user.isAnonymous) {
          setIsManualAdmin(false);
          localStorage.removeItem('manual-session');
        }
        // Fetch profile
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setUserProfile(profileSnap.data() as UserProfile);
        } else if (!user.isAnonymous) {
          // Check if user was pre-added by email
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', user.email));
          const preAddedSnap = await getDocs(q);
          
          if (!preAddedSnap.empty) {
            const preAddedDoc = preAddedSnap.docs[0];
            const data = preAddedDoc.data();
            const initialProfile: UserProfile = {
              uid: user.uid,
              email: data.email,
              role: data.role,
              status: data.status
            };
            
            // Migrate to UID-based document
            await setDoc(profileRef, initialProfile);
            await deleteDoc(preAddedDoc.ref);
            setUserProfile(initialProfile);
          } else {
            // Create initial profile
            const initialProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              role: user.email === 'lamxtrai2k1@gmail.com' ? 'admin' : 'pending',
              status: user.email === 'lamxtrai2k1@gmail.com' ? 'active' : 'pending'
            };
            await setDoc(profileRef, initialProfile);
            setUserProfile(initialProfile);
          }
        }
      } else {
        setCurrentUser(null);
        if (!isManualAdmin) {
          setUserProfile(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [isManualAdmin]);

  // Real-time data listener
  useEffect(() => {
    if ((!userProfile || userProfile.status !== 'active') && !isManualAdmin) {
      setData([]);
      return;
    }

    if (isManualAdmin && !currentUser) {
      setData([
        {
          id: 'demo-123',
          maDinhDanh: 'CQ-01',
          tenPhong: 'Phòng Hành chính gốc',
          maHoSoLuuTru: 'HS-2023-001',
          nhanDe: 'Hồ sơ thử nghiệm giao diện',
          loaiDuLieu: 'Dữ liệu lĩnh vực đất đai',
          hoTenChuSuDung: 'Nguyễn Văn A',
          createdAt: Date.now()
        } as LandData
      ]);
      return;
    }

    const recordsRef = collection(db, 'records');
    let q;
    
    if (userProfile.role === 'admin') {
      q = query(recordsRef, orderBy('createdAt', 'desc'));
    } else {
      q = query(recordsRef, where('assignedUid', '==', userProfile.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LandData[];
      setData(records);
    });

    return () => unsubscribe();
  }, [userProfile]);

  // Real-time users listener (Admin only)
  useEffect(() => {
    if (userProfile?.role !== 'admin') {
      setAllUsers([]);
      return;
    }

    if (isManualAdmin && !currentUser) {
      setAllUsers([
        { uid: 'manual-admin', email: 'admin@system.local', role: 'admin', status: 'active' },
        { uid: 'demo-1', email: 'nhanvien1@example.com', role: 'employee', status: 'active' }
      ]);
      return;
    }

    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as UserProfile[];
      setAllUsers(users);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setIsManualAdmin(false);
    } catch (error: any) {
      // Don't show error if user cancelled or if there's already a pending popup
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.log('Login attempt cancelled or pending.');
      } else {
        console.error('Login failed', error);
        addNotification('error', 'Đăng nhập thất bại.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure we have an anonymous user if not signed in
    let targetUid = currentUser?.uid;
    if (!currentUser) {
      try {
        const { signInAnonymously } = await import('firebase/auth');
        const cred = await signInAnonymously(auth);
        targetUid = cred.user.uid;
      } catch (err: any) {
        console.error('Anonymous auth failed', err);
        if (err.code === 'auth/admin-restricted-operation') {
          addNotification('error', 'Lỗi: Tính năng đăng nhập ẩn danh chưa được bật trong Firebase Console.');
          // Fallback to local session if absolutely necessary for demo, but cloud sync will fail
        }
      }
    }

    // Check hardcoded admin
    if (loginForm.username === 'admin' && loginForm.password === 'admin') {
      const actualUid = targetUid || 'unknown'; // MUST use the real Firebase UID
      const profile: UserProfile = {
        uid: actualUid,
        email: 'admin@system.local',
        username: 'admin',
        password: 'admin',
        role: 'admin',
        status: 'active'
      };

      // Ensure manual admin has a document in Firestore to satisfy security rules
      if (actualUid !== 'unknown') {
        try {
          await setDoc(doc(db, 'users', actualUid), profile);
          addNotification('success', 'Đã đồng bộ quyền Quản trị viên lên Cloud.');
        } catch (err: any) {
          console.error('Failed to sync admin profile to Firestore', err);
          if (err.code === 'permission-denied') {
            addNotification('error', 'Lỗi bảo mật: Không thể kích hoạt quyền Quản trị trên Cloud. Vui lòng kiểm tra lại Rules.');
          } else {
            addNotification('error', 'Cảnh báo: Không thể đồng bộ quyền quản trị lên Cloud.');
          }
        }
      }

      setIsManualAdmin(true);
      setUserProfile(profile);
      localStorage.setItem('manual-session', JSON.stringify(profile));
      addNotification('success', 'Đăng nhập quản trị viên hệ thống thành công');
      return;
    }

    // Check Firestore for custom accounts
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', loginForm.username));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const userDoc = querySnap.docs[0];
        const userData = userDoc.data() as UserProfile;
        
        if (userData.password === loginForm.password) {
          if (userData.status !== 'active') {
            addNotification('error', 'Tài khoản của bạn đã bị khóa hoặc đang chờ duyệt.');
            return;
          }

          // Update the user document with the current anonymous UID to satisfy security rules
          if (targetUid && userData.uid !== targetUid) {
             await updateDoc(doc(db, 'users', userDoc.id), { uid: targetUid });
             userData.uid = targetUid;
          }

          setIsManualAdmin(true);
          setUserProfile(userData);
          localStorage.setItem('manual-session', JSON.stringify(userData));
          addNotification('success', `Chào mừng trở lại, ${userData.username || userData.email}`);
          return;
        }
      }
      
      addNotification('error', 'Tài khoản hoặc mật khẩu không chính xác.');
    } catch (error) {
      console.error('Login error:', error);
      addNotification('error', 'Đã xảy ra lỗi khi đăng nhập.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsManualAdmin(false);
    setUserProfile(null);
    localStorage.removeItem('manual-session');
    setLoginForm({ username: '', password: '' });
    setActiveTab('dashboard');
  };

  const [newUser, setNewUser] = useState({ 
    email: '', 
    username: '', 
    password: '', 
    role: 'employee' as UserProfile['role'] 
  });

  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const handleCreateUser = async () => {
    if (isCreatingUser) return;
    if (!newUser.email && !newUser.username) {
      addNotification('error', 'Vui lòng cung cấp Email hoặc Tên đăng nhập.');
      return;
    }

    // Basic validation for username (used as document ID)
    if (newUser.username && !/^[a-zA-Z0-9_\-]+$/.test(newUser.username)) {
      addNotification('error', 'Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới hoặc gạch nối.');
      return;
    }

    setIsCreatingUser(true);
    try {
      // Check duplicate in local state first for speed
      const existingEmail = newUser.email ? allUsers.find(u => u.email === newUser.email) : null;
      const existingUser = newUser.username ? allUsers.find(u => u.username === newUser.username) : null;
      
      if (existingEmail || existingUser) {
        addNotification('error', 'Người dùng này đã tồn tại trong hệ thống.');
        return;
      }

      const uid = newUser.username || `google-${Math.random().toString(36).substr(2, 9)}`;

      const userPayload = {
        email: newUser.email || '',
        username: newUser.username || '',
        password: newUser.password || '',
        role: newUser.role,
        status: 'active',
        uid: uid,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', uid), userPayload);
      
      setNewUser({ email: '', username: '', password: '', role: 'employee' });
      addNotification('success', 'Đã thêm tài khoản mới thành công.');
    } catch (error: any) {
      console.error('Create user error details:', error);
      let errorMessage = 'Không thể tạo người dùng.';
      if (error.code === 'permission-denied') {
        errorMessage = 'Lỗi bảo mật: Bạn không có quyền quản trị cấp cao để thực hiện thao tác này.';
      }
      addNotification('error', errorMessage);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      addNotification('success', 'Đã xóa tài khoản nhân viên.');
    } catch (error) {
      console.error('Delete user error:', error);
      addNotification('error', 'Lỗi khi xóa nhân viên.');
    }
  };

  const handleUpdateUserStatus = async (uid: string, role: UserProfile['role'], status: UserProfile['status']) => {
    if (!uid) return;
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role, status });
      addNotification('success', 'Cập nhật phân quyền thành công.');
    } catch (error) {
      console.error('Update status error:', error);
      addNotification('error', 'Không thể cập nhật. Kiểm tra quyền của bạn.');
    }
  };

  const handleAssignRecord = async (recordId: string, assignedUid: string | null) => {
    if (!recordId) return;
    try {
      const recordRef = doc(db, 'records', recordId);
      await updateDoc(recordRef, { assignedUid });
      addNotification('success', 'Đã phân chia hồ sơ thành công.');
    } catch (error) {
      console.error('Assign error:', error);
      addNotification('error', 'Lỗi phân chia hồ sơ.');
    }
  };

  // Save global defaults
  useEffect(() => {
    localStorage.setItem('global-defaults', JSON.stringify(globalDefaults));
  }, [globalDefaults]);

  // Initialize entry with defaults when moving to entry tab (only for new entries)
  useEffect(() => {
    if (activeTab === 'entry' && !currentEntry.id) {
      setCurrentEntry(prev => ({ ...globalDefaults, ...prev }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const addNotification = useCallback((type: 'success' | 'error', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const handleInputChange = (key: keyof LandData, value: any) => {
    setCurrentEntry(prev => ({ ...prev, [key]: value }));
  };

  const handleDefaultChange = (key: keyof LandData, value: any) => {
    setGlobalDefaults(prev => ({ ...prev, [key]: value }));
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const recordsRef = collection(db, 'records');
        const promises = jsonData.map(row => {
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

          return addDoc(recordsRef, {
            ...entry,
            createdBy: currentUser?.uid,
            assignedUid: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        });

        await Promise.all(promises);
        addNotification('success', `Đã nhập thành công ${jsonData.length} hồ sơ!`);
      } catch (error) {
        console.error('Import failed', error);
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
        const recordRef = doc(db, 'records', String(currentEntry.id));
        const { id, ...saveData } = currentEntry;
        await updateDoc(recordRef, {
          ...saveData,
          updatedAt: serverTimestamp()
        });
        addNotification('success', 'Đã cập nhật hồ sơ thành công!');
      } else {
        const recordsRef = collection(db, 'records');
        await addDoc(recordsRef, {
          ...currentEntry,
          createdBy: currentUser?.uid,
          assignedUid: userProfile?.role === 'employee' ? currentUser?.uid : (currentEntry.assignedUid || null),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        addNotification('success', 'Đã lưu hồ sơ thành công!');
      }

      setCurrentEntry({});
      setActiveGroupIndex(0);
      setActiveTab('browser');
    } catch (error) {
      console.error('Save failed', error);
      addNotification('error', 'Không thể lưu hồ sơ.');
    }
  };

  const handleEditEntry = (item: LandData) => {
    setCurrentEntry({ ...item });
    setActiveTab('entry');
    setActiveGroupIndex(0);
  };

  const handleDeleteEntry = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa hồ sơ này?')) {
      try {
        await deleteDoc(doc(db, 'records', id));
        addNotification('success', 'Đã xóa hồ sơ thành công.');
      } catch (error) {
        addNotification('error', 'Không thể xóa hồ sơ.');
      }
    }
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

  const filteredData = useMemo(() => {
    let result = data.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        item.hoTenChuSuDung?.toLowerCase().includes(q) ||
        item.maHoSoLuuTru?.toLowerCase().includes(q) ||
        item.tieuDeHoSo?.toLowerCase().includes(q) ||
        item.nhanDe?.toLowerCase().includes(q) ||
        item.soGiayChungNhan?.toLowerCase().includes(q)
      );
    });

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aValue = (a as any)[sortConfig.key];
        const bValue = (b as any)[sortConfig.key];

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

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
  }, [data, searchQuery, sortConfig]);

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

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    // Capture count BEFORE clearing selection to avoid stale closure bug
    const idsToDelete = Array.from(selectedIds);
    const count = idsToDelete.length;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${count} hồ sơ đã chọn?`)) return;
    try {
      await Promise.all(idsToDelete.map(id => deleteDoc(doc(db, 'records', String(id)))));
      setSelectedIds(new Set());
      addNotification('success', `Đã xóa thành công ${count} hồ sơ!`);
    } catch (error) {
      addNotification('error', 'Xóa hàng loạt thất bại.');
    }
  };

  // Close detail view with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewingEntryId) {
        setViewingEntryId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingEntryId]);

  const activeFields = LAND_FIELDS.filter(f => f.group === FIELD_GROUPS[activeGroupIndex]);
  const settingsFields = LAND_FIELDS.filter(f => f.group === FIELD_GROUPS[settingsActiveGroup]);

  // Calculate entry progress
  const filledFieldsCount = Object.keys(currentEntry).filter(k => currentEntry[k as keyof LandData]).length;
  const totalFieldsCount = LAND_FIELDS.length;
  const progressPercent = Math.round((filledFieldsCount / totalFieldsCount) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {authLoading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Đang khởi tạo hệ thống...</p>
          </div>
        </div>
      )}
      {/* Login Overlay */}
      {!currentUser && !isManualAdmin && !authLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-50/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-blue-100 border border-gray-100 overflow-hidden"
          >
            <div className="p-10 space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-200 mb-6 group hover:rotate-6 transition-transform">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Hệ thống Đất Đai</h2>
                <p className="text-sm font-medium text-gray-500">Đăng nhập để vào kho dữ liệu lưu trữ</p>
              </div>

              <form onSubmit={handleManualLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tài khoản</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                      placeholder="Tên đăng nhập hoặc Email..."
                      value={loginForm.username}
                      onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="password" 
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                      placeholder="Mật khẩu..."
                      value={loginForm.password}
                      onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                  <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                  Đăng nhập hệ thống
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="bg-white px-4 text-gray-400">Hoặc sử dụng</span>
                </div>
              </div>

              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className={cn(
                  "w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-3 active:scale-[0.98]",
                  isLoggingIn ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                )}
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                ) : (
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                )}
                {isLoggingIn ? 'Đang xử lý...' : 'Đăng nhập với Google'}
              </button>
            </div>
            
            <footer className="p-6 bg-gray-50 border-t border-gray-100 text-center space-y-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Trung tâm lưu trữ địa chính v2.4.1</p>
              <p className="text-[10px] text-gray-300">Nhấn Enter để đăng nhập nhanh</p>
            </footer>
          </motion.div>
        </div>
      )}

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
                "p-4 rounded-xl shadow-lg flex items-center gap-3 min-w-[300px] max-w-sm border",
                n.type === 'success' ? "bg-white border-green-100 text-gray-800" : "bg-red-50 border-red-100 text-red-800"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                n.type === 'success' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              )}>
                {n.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              </div>
              <span className="text-sm font-semibold flex-1">{n.message}</span>
              <button
                onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
                className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
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
                className="px-6 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 flex items-center gap-2"
              >
                <Save size={15} />
                Lưu Dữ Liệu
              </button>
            )}
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

              {userProfile?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    activeTab === 'users' ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Users size={18} />
                  <span className="flex-1 text-left">Nhân viên hệ thống</span>
                  {allUsers.filter(u => u.status === 'pending').length > 0 && (
                    <span className="bg-orange-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                      {allUsers.filter(u => u.status === 'pending').length}
                    </span>
                  )}
                </button>
              )}
            </nav>

            {/* Status Card (Minimalism Style) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái hệ thống</h2>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                    <span>Hồ sơ đã nhập</span>
                    <span className="text-gray-900">{data.length}</span>
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
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200/50">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                            {(userProfile?.username || userProfile?.email || '?').substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">
                                {userProfile?.username || userProfile?.email}
                            </p>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">
                                {userProfile?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 text-red-500 rounded-lg text-xs font-bold hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
                    >
                        <LogOut size={14} />
                        Đăng xuất
                    </button>
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
                      <h3 className="text-3xl font-bold text-gray-900">{data.length}</h3>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                      <div className="p-2.5 bg-green-50 w-fit rounded-xl text-green-600 mb-4">
                        <FileCheck size={20} />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Dữ liệu hoàn thiện</p>
                      <h3 className="text-3xl font-bold text-gray-900">
                        {data.filter(item => item.hoTenChuSuDung && item.maHoSoLuuTru && item.soGiayChungNhan).length}
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">Có đủ mã, tên chủ & GCN</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 text-blue-600 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                           Thực hiện nhanh
                        </p>
                        <button 
                          onClick={() => {
                            setCurrentEntry({ ...globalDefaults });
                            setActiveTab('entry');
                            setActiveGroupIndex(0);
                          }}
                          className="text-sm font-bold text-gray-800 hover:text-blue-600 flex items-center gap-2 transition-colors mb-3"
                        >
                          Tạo hồ sơ số hóa mới <ChevronRight size={14} />
                        </button>
                        {data.filter(item => !item.soGiayChungNhan).length > 0 && (
                          <p className="text-[10px] text-orange-500 font-bold">
                            ⚠ {data.filter(item => !item.soGiayChungNhan).length} hồ sơ chưa có số GCN
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                       <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Hồ sơ mới cập nhật</h3>
                       <button onClick={() => setActiveTab('browser')} className="text-xs font-bold text-blue-600 hover:underline">Xem tất cả</button>
                    </div>
                    {data.length > 0 ? (
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
                            {data.slice(0, 5).map(item => (
                              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 text-xs font-semibold text-blue-600 font-mono">{item.maHoSoLuuTru || '---'}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-700">{item.hoTenChuSuDung}</td>
                                <td className="px-6 py-4 text-xs text-gray-400">
                                  {item.createdAt 
                                    ? new Date(typeof item.createdAt === 'object' ? (item.createdAt as any).toDate?.() ?? item.createdAt : item.createdAt).toLocaleDateString('vi-VN')
                                    : '---'}
                                </td>
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

              {activeTab === 'settings' && (
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
                                 index === settingsActiveGroup 
                                     ? "bg-white shadow-sm border border-gray-100 text-blue-600 font-bold" 
                                     : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                             )}
                           >
                                <div className={cn(
                                    "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0",
                                    index === settingsActiveGroup ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                                )}>
                                    {index + 1}
                                </div>
                                <span className="text-xs leading-tight">{group}</span>
                           </button>
                        ))}
                      </div>
                    </div>

                    {/* Settings Content */}
                    <div className="flex-1 p-8 flex flex-col bg-white">
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
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">
                              {currentEntry.id 
                                ? `✏ Đang chỉnh sửa: ${currentEntry.maHoSoLuuTru || currentEntry.id}`
                                : `Phiếu ghi định danh: #REC-${Math.floor(Date.now()/1000000)}`}
                            </p>
                         </div>
                         <div className="flex items-center gap-2">
                            {currentEntry.id && (
                              <button
                                onClick={() => {
                                  setCurrentEntry({});
                                  setActiveGroupIndex(0);
                                  setActiveTab('browser');
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                Hủy chỉnh sửa
                              </button>
                            )}
                            <div className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-bold tracking-widest uppercase">
                              Nhóm {activeGroupIndex + 1}/{FIELD_GROUPS.length}
                            </div>
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
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-24 resize-none"
                                  value={(currentEntry as any)[field.key] || field.defaultValue || ''}
                                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                                  placeholder={`Ví dụ: ${field.example || '...'}`}
                                />
                              ) : field.type === 'select' ? (
                                <select
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
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
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
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

              {userProfile?.role === 'admin' && activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8 max-w-7xl mx-auto"
                >
                  <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Nhân viên hệ thống</h2>
                      <p className="text-sm text-gray-500 font-medium mt-1">Quản lý tài khoản, phân quyền và trạng thái làm việc</p>
                    </div>

                    <div className="flex flex-col gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xl shadow-blue-50/50 w-full md:w-auto">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <UserPlus size={18} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Tạo tài khoản mới</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tên đăng nhập *</label>
                          <input 
                            type="text"
                            placeholder="VD: nhanvien_01"
                            value={newUser.username}
                            onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Mật khẩu khởi tạo *</label>
                          <input 
                            type="password" 
                            placeholder="Nhập mật khẩu..."
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-1.5 w-full">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Email (Tùy chọn)</label>
                          <input 
                            type="email"
                            placeholder="nhanvien@gmail.com"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5 w-full md:w-48">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Vai trò</label>
                          <select 
                            value={newUser.role}
                            onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none cursor-pointer hover:border-gray-300 transition-all appearance-none"
                          >
                            <option value="employee">Nhân viên</option>
                            <option value="admin">Quản trị viên</option>
                          </select>
                        </div>
                        <button 
                          onClick={handleCreateUser}
                          disabled={isCreatingUser}
                          className={cn(
                            "w-full md:w-auto flex items-center justify-center gap-2 px-8 py-2.5 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95",
                            isCreatingUser 
                              ? "bg-blue-400 cursor-not-allowed" 
                              : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                          )}
                        >
                          {isCreatingUser ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Plus size={18} />
                          )}
                          {isCreatingUser ? 'Đang tạo...' : 'Tạo tài khoản'}
                        </button>
                      </div>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Tổng nhân sự</p>
                      <h3 className="text-3xl font-bold text-gray-900">{allUsers.length}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Quản trị viên</p>
                      <h3 className="text-3xl font-bold text-blue-600">{allUsers.filter(u => u.role === 'admin').length}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Đang chờ duyệt</p>
                      <h3 className="text-3xl font-bold text-orange-500">{allUsers.filter(u => u.role === 'pending').length}</h3>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Tên / Email</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Vai trò</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Trạng thái</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs">
                          {allUsers.map((user) => (
                            <tr key={user.uid} className={cn("hover:bg-gray-50/50 transition-colors", user.status === 'pending' && "bg-orange-50/40")}>
                              <td className="px-6 py-4 font-medium text-gray-900">
                                <div>{user.username || user.email}</div>
                                {user.username && user.email && <div className="text-[10px] text-gray-400 mt-0.5">{user.email}</div>}
                              </td>
                              <td className="px-6 py-4">
                                <select 
                                  value={user.role}
                                  onChange={(e) => handleUpdateUserStatus(user.uid, e.target.value as any, user.status)}
                                  className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-bold font-sans outline-none border transition-all",
                                    user.role === 'admin' ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-gray-50 text-gray-600 border-gray-100"
                                  )}
                                >
                                  <option value="admin">Quản trị viên</option>
                                  <option value="employee">Cán bộ nhập liệu</option>
                                  <option value="pending">Chờ phân quyền</option>
                                </select>
                              </td>
                              <td className="px-6 py-4">
                                <select 
                                  value={user.status}
                                  onChange={(e) => handleUpdateUserStatus(user.uid, user.role, e.target.value as any)}
                                  className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-bold font-sans outline-none border transition-all",
                                    user.status === 'active' ? "bg-green-50 text-green-600 border-green-100" 
                                    : user.status === 'pending' ? "bg-orange-50 text-orange-600 border-orange-100"
                                    : "bg-red-50 text-red-600 border-red-100"
                                  ) }
                                >
                                  <option value="active">Đang hoạt động</option>
                                  <option value="suspended">Đã khóa</option>
                                  <option value="pending">Đang chờ</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {user.status === 'pending' && (
                                    <button
                                      onClick={() => handleUpdateUserStatus(user.uid, user.role === 'pending' ? 'employee' : user.role, 'active')}
                                      className="px-3 py-1 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition-colors"
                                      title="Duyệt tài khoản"
                                    >
                                      Duyệt
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      if (confirm('Xóa tài khoản nhân viên này khỏi hệ thống?')) {
                                        handleDeleteUser(user.uid);
                                      }
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Xóa tài khoản"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                        <p className="text-sm text-gray-500 font-medium mt-1">
                          {searchQuery
                            ? `Tìm thấy ${filteredData.length} / ${data.length} hồ sơ`
                            : `Tra cứu nhanh hồ sơ qua hệ thống mã số hóa lưu trữ`}
                        </p>
                      </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="text"
                              placeholder="Nhập tên chủ, GCN hoặc mã hồ sơ..."
                              className="bg-white border border-gray-200 rounded-xl pl-11 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all w-full md:w-80 font-medium"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                              <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                          
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

                          <button 
                            onClick={exportToExcel}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all"
                          >
                            <Download size={16} className="text-green-600" />
                            <span>Xuất Excel{searchQuery ? ` (${filteredData.length})` : ''}</span>
                          </button>

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
                                  <ArrowUpDown size={12} className={cn(sortConfig?.key === 'maHoSoLuuTru' ? "text-blue-500" : "text-gray-300")} />
                                </div>
                              </th>
                              <th 
                                className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-blue-500 transition-colors"
                                onClick={() => toggleSort('nhanDe')}
                              >
                                <div className="flex items-center gap-1.5">
                                  Nhan Đề
                                  <ArrowUpDown size={12} className={cn(sortConfig?.key === 'nhanDe' ? "text-blue-500" : "text-gray-300")} />
                                </div>
                              </th>
                              <th 
                                className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-blue-500 transition-colors"
                                onClick={() => toggleSort('hoTenChuSuDung')}
                              >
                                <div className="flex items-center gap-1.5">
                                  Chủ Sở Hữu
                                  <ArrowUpDown size={12} className={cn(sortConfig?.key === 'hoTenChuSuDung' ? "text-blue-500" : "text-gray-300")} />
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
                                  <ArrowUpDown size={12} className={cn(sortConfig?.key === 'createdAt' ? "text-blue-500" : "text-gray-300")} />
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
                                    {item.createdAt 
                                      ? new Date(typeof item.createdAt === 'object' ? (item.createdAt as any).toDate?.() ?? item.createdAt : item.createdAt).toLocaleDateString('vi-VN')
                                      : '---'}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button 
                                        onClick={() => setViewingEntryId(item.id)}
                                        className="p-2 text-gray-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Xem chi tiết"
                                      >
                                        <Eye size={16} />
                                      </button>
                                      <button 
                                        onClick={() => handleEditEntry(item)}
                                        className="p-2 text-gray-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Chỉnh sửa hồ sơ"
                                      >
                                        <Edit2 size={16} />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteEntry(item.id)}
                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Xóa hồ sơ"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={8} className="p-16 text-center">
                                  <div className="inline-flex items-center justify-center p-5 bg-gray-50 rounded-full text-gray-300 mb-4">
                                    <Search size={32} />
                                  </div>
                                  {searchQuery ? (
                                    <>
                                      <p className="text-sm text-gray-400 font-medium">Không tìm thấy kết quả cho "<span className="font-bold text-gray-600">{searchQuery}</span>"</p>
                                      <button onClick={() => setSearchQuery('')} className="mt-3 text-xs text-blue-500 hover:underline font-bold">Xóa bộ lọc</button>
                                    </>
                                  ) : (
                                    <p className="text-sm text-gray-400 italic font-medium">Chưa có hồ sơ nào trong hệ thống</p>
                                  )}
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
      </div>
    </div>
  );
}

