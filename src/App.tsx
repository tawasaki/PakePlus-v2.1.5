
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  User as UserIcon, 
  Settings, 
  ClipboardList, 
  LogOut, 
  Scan, 
  ChevronRight, 
  Trash2, 
  MoveRight,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Layers,
  Box
} from 'lucide-react';
import { User, Pet, UserRole, UserStatus, PetStatus, View } from './types';
import Scanner from './components/Scanner';
import { getPetFeedingAdvice } from './services/geminiService';

// --- BRAND COLORS ---
const COLORS = {
  pink: '#FF7EC5',
  purple: '#6D28D9',
  deepPurple: '#4F1182',
  cyan: '#59A8B6',
  black: '#000000',
  darkGray: '#1F2937'
};

// Custom Logo Component mimicking the Yin-Yang Snake
const BrandLogo = () => (
  <div className="relative w-32 h-32 flex items-center justify-center">
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,126,197,0.4)]">
      <circle cx="100" cy="100" r="90" fill={COLORS.pink} />
      <path 
        d="M 100,10 a 90,90 0 0 1 0,180 a 45,45 0 0 1 0,-90 a 45,45 0 0 0 0,-90" 
        fill={COLORS.black} 
      />
      {/* Eyes */}
      <circle cx="100" cy="55" r="15" fill={COLORS.deepPurple} />
      <rect x="98" y="45" width="4" height="20" rx="2" fill={COLORS.black} />
      <circle cx="100" cy="145" r="15" fill={COLORS.deepPurple} />
      <rect x="98" y="135" width="4" height="20" rx="2" fill={COLORS.pink} />
      {/* Tongue */}
      <path d="M 80,110 Q 70,115 60,110" stroke={COLORS.deepPurple} strokeWidth="3" fill="none" />
    </svg>
  </div>
);

// --- MOCK STORAGE KEYS ---
const USERS_KEY = 'pet_app_users';
const PETS_KEY = 'pet_app_pets';
const CURRENT_USER_KEY = 'pet_app_current_user';

const App: React.FC = () => {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('LOGIN');
  const [users, setUsers] = useState<User[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  // Auth Form State
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Pet Form State
  const [petForm, setPetForm] = useState<Partial<Pet>>({
    species: '',
    gene: '',
    weight: 0,
    feedingTime: '',
    cabinetId: ''
  });

  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    const storedUsers = localStorage.getItem(USERS_KEY);
    const storedPets = localStorage.getItem(PETS_KEY);
    const loggedUser = localStorage.getItem(CURRENT_USER_KEY);

    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      const admin: User = { id: 'admin-1', username: 'admin', password: '123', role: UserRole.ADMIN, status: UserStatus.ACTIVE };
      localStorage.setItem(USERS_KEY, JSON.stringify([admin]));
      setUsers([admin]);
    }

    if (storedPets) setPets(JSON.parse(storedPets));
    if (loggedUser) {
      const user = JSON.parse(loggedUser);
      setCurrentUser(user);
      setCurrentView('DASHBOARD');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(PETS_KEY, JSON.stringify(pets));
  }, [pets]);

  // --- HANDLERS ---
  const handleLogin = () => {
    const user = users.find(u => u.username === authUsername && u.password === authPassword);
    if (!user) {
      setAuthError('用户名或密码错误');
      return;
    }
    if (user.status === UserStatus.BLOCKED) {
      setAuthError('账号已被屏蔽，请联系管理员');
      return;
    }
    setCurrentUser(user);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    setCurrentView('DASHBOARD');
    setAuthError('');
  };

  const handleRegister = () => {
    if (users.some(u => u.username === authUsername)) {
      setAuthError('用户名已存在');
      return;
    }
    const newUser: User = {
      id: `u-${Date.now()}`,
      username: authUsername,
      password: authPassword,
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    };
    setUsers([...users, newUser]);
    setAuthError('注册成功，请登录');
    setCurrentView('LOGIN');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    setCurrentView('LOGIN');
    setAuthUsername('');
    setAuthPassword('');
  };

  const handleAddPet = () => {
    if (!petForm.species || !petForm.cabinetId) {
      alert('请填写必要信息 (物种, 柜号)');
      return;
    }
    const newId = `PET-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBarcode = `BC-${Date.now().toString().slice(-8)}`;
    const newPet: Pet = {
      id: newId,
      barcode: newBarcode,
      species: petForm.species || '',
      gene: petForm.gene || '',
      weight: Number(petForm.weight) || 0,
      feedingTime: petForm.feedingTime || new Date().toISOString().split('T')[0],
      cabinetId: petForm.cabinetId || '',
      status: PetStatus.IN_STOCK,
      createdAt: Date.now()
    };
    setPets([newPet, ...pets]);
    setPetForm({ species: '', gene: '', weight: 0, feedingTime: '', cabinetId: '' });
    setCurrentView('INVENTORY');
  };

  const movePet = (id: string, newStatus: PetStatus) => {
    setPets(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    if (selectedPet?.id === id) {
        setSelectedPet(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const deletePet = (id: string) => {
    if (confirm('确认删除该宠物记录？')) {
      setPets(prev => prev.filter(p => p.id !== id));
      setCurrentView('INVENTORY');
    }
  };

  const toggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id && u.role !== UserRole.ADMIN) {
        return { ...u, status: u.status === UserStatus.ACTIVE ? UserStatus.BLOCKED : UserStatus.ACTIVE };
      }
      return u;
    }));
  };

  const handleScanSuccess = (code: string) => {
    setIsScanning(false);
    const pet = pets.find(p => p.barcode === code || p.id === code);
    if (pet) {
      setSelectedPet(pet);
      setCurrentView('PET_DETAIL');
    } else {
      alert(`未找到匹配的宠物: ${code}`);
    }
  };

  const fetchAiAdvice = async (pet: Pet) => {
    setIsLoadingAdvice(true);
    const advice = await getPetFeedingAdvice(pet);
    setAiAdvice(advice);
    setIsLoadingAdvice(false);
  };

  useEffect(() => {
    if (currentView === 'PET_DETAIL' && selectedPet) {
        setAiAdvice('');
        fetchAiAdvice(selectedPet);
    }
  }, [currentView, selectedPet]);

  const filteredPets = useMemo(() => {
    return pets.filter(p => 
      p.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.gene.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pets, searchQuery]);

  const inStockPets = useMemo(() => pets.filter(p => p.status === PetStatus.IN_STOCK), [pets]);
  const soldPets = useMemo(() => pets.filter(p => p.status === PetStatus.SOLD), [pets]);

  // --- RENDER ---
  if (currentView === 'LOGIN' || currentView === 'REGISTER') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black">
        <div className="w-full max-w-md bg-zinc-900/50 rounded-[2.5rem] border border-zinc-800 p-10 backdrop-blur-sm">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <BrandLogo />
            </div>
            <div className="flex justify-center items-baseline space-x-1 mb-2">
              <h1 className="text-4xl font-black text-cyan-400">INK</h1>
              <h1 className="text-4xl font-black text-purple-600">YARD</h1>
            </div>
            <h2 className="text-lg font-bold text-pink-400 tracking-widest">鸳鸯管家</h2>
            <p className="text-zinc-500 mt-2 text-sm">专业、智能、高效的宠物管理系统</p>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <input 
                type="text" 
                className="w-full bg-zinc-800/50 text-white px-6 py-4 rounded-2xl border border-zinc-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder-zinc-600"
                placeholder="用户名"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
              />
            </div>
            <div className="relative">
              <input 
                type="password" 
                className="w-full bg-zinc-800/50 text-white px-6 py-4 rounded-2xl border border-zinc-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder-zinc-600"
                placeholder="密码"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>
            
            {authError && <p className="text-red-500 text-sm text-center font-medium">{authError}</p>}

            {currentView === 'LOGIN' ? (
              <>
                <button 
                  onClick={handleLogin}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-purple-900/40 active:scale-[0.98] transition-all"
                >
                  立即登录
                </button>
                <p className="text-center text-zinc-500 text-sm">
                  没有账号? <button onClick={() => setCurrentView('REGISTER')} className="text-pink-400 font-bold hover:underline">立即注册</button>
                </p>
              </>
            ) : (
              <>
                <button 
                  onClick={handleRegister}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-pink-900/40 active:scale-[0.98] transition-all"
                >
                  完成注册
                </button>
                <p className="text-center text-zinc-500 text-sm">
                  已有账号? <button onClick={() => setCurrentView('LOGIN')} className="text-cyan-400 font-bold hover:underline">返回登录</button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <header className="bg-white px-6 pt-12 pb-6 shadow-sm border-b border-zinc-100 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
               <h2 className="text-xl font-black text-zinc-800">
                {currentView === 'DASHBOARD' && '工作台'}
                {currentView === 'INVENTORY' && '入库登记'}
                {currentView === 'SEARCH' && '综合查询'}
                {currentView === 'USER_MANAGEMENT' && '权限中心'}
                {currentView === 'PET_DETAIL' && '档案详情'}
              </h2>
            </div>
            <p className="text-zinc-400 text-xs font-medium">{currentUser?.username} · {currentUser?.role === UserRole.ADMIN ? '系统管理员' : '普通职员'}</p>
          </div>
          <button onClick={handleLogout} className="p-2.5 bg-zinc-100 rounded-xl text-zinc-500 active:bg-zinc-200">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-6 pt-6">
        
        {/* DASHBOARD VIEW */}
        {currentView === 'DASHBOARD' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-zinc-100 flex flex-col items-center">
                <span className="text-3xl font-black text-purple-600">{inStockPets.length}</span>
                <span className="text-zinc-400 text-[10px] font-bold tracking-widest mt-1">IN STOCK / 在库</span>
              </div>
              <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-zinc-100 flex flex-col items-center">
                <span className="text-3xl font-black text-pink-500">{soldPets.length}</span>
                <span className="text-zinc-400 text-[10px] font-bold tracking-widest mt-1">SOLD / 已售</span>
              </div>
            </div>

            <div className="bg-black p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-1">HELLO.</h3>
                    <p className="text-zinc-400 text-xs font-medium mb-4 uppercase tracking-tighter">
                      Today {inStockPets.filter(p => p.feedingTime === new Date().toISOString().split('T')[0]).length} units need feeding.
                    </p>
                    <button 
                        onClick={() => setCurrentView('SEARCH')}
                        className="px-6 py-2.5 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-xl text-xs font-black"
                    >
                        GO MANAGE
                    </button>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-40 scale-150 rotate-12">
                   <BrandLogo />
                </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-black text-zinc-800 text-sm tracking-widest px-1 uppercase">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsScanning(true)}
                  className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl border border-zinc-100 shadow-sm active:scale-95 transition-all"
                >
                  <Scan className="text-cyan-500 mb-2" size={32} />
                  <span className="text-xs font-black text-zinc-600">快速扫码</span>
                </button>
                <button 
                  onClick={() => setCurrentView('INVENTORY')}
                  className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl border border-zinc-100 shadow-sm active:scale-95 transition-all"
                >
                  <Plus className="text-pink-500 mb-2" size={32} />
                  <span className="text-xs font-black text-zinc-600">添加入库</span>
                </button>
              </div>
            </div>

            {currentUser?.role === UserRole.ADMIN && (
              <div 
                onClick={() => setCurrentView('USER_MANAGEMENT')}
                className="bg-white p-5 rounded-3xl border border-zinc-100 flex items-center justify-between shadow-sm active:bg-zinc-50 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                    <Settings size={22} />
                  </div>
                  <div>
                    <span className="font-black text-zinc-800 block">权限管理中心</span>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Access Control</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-zinc-300" />
              </div>
            )}
          </div>
        )}

        {/* INVENTORY VIEW */}
        {currentView === 'INVENTORY' && (
          <div className="space-y-6">
            <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-zinc-100">
              <h3 className="font-black text-zinc-800 text-lg mb-5 flex items-center uppercase tracking-widest">
                <Plus size={20} className="mr-2 text-pink-500" /> Registration / 登记
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    placeholder="物种" 
                    className="p-4 bg-zinc-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-cyan-400 text-sm font-bold"
                    value={petForm.species}
                    onChange={(e) => setPetForm({...petForm, species: e.target.value})}
                  />
                  <input 
                    placeholder="基因/品种" 
                    className="p-4 bg-zinc-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-cyan-400 text-sm font-bold"
                    value={petForm.gene}
                    onChange={(e) => setPetForm({...petForm, gene: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    placeholder="体重 (kg)" 
                    className="p-4 bg-zinc-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-purple-400 text-sm font-bold"
                    value={petForm.weight || ''}
                    onChange={(e) => setPetForm({...petForm, weight: Number(e.target.value)})}
                  />
                  <input 
                    placeholder="柜号" 
                    className="p-4 bg-zinc-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-purple-400 text-sm font-bold"
                    value={petForm.cabinetId}
                    onChange={(e) => setPetForm({...petForm, cabinetId: e.target.value})}
                  />
                </div>
                <div className="relative">
                   <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18}/>
                   <input 
                    type="date"
                    className="w-full p-4 bg-zinc-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-pink-400 text-sm font-bold"
                    value={petForm.feedingTime}
                    onChange={(e) => setPetForm({...petForm, feedingTime: e.target.value})}
                  />
                </div>
                <button 
                  onClick={handleAddPet}
                  className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-zinc-200"
                >
                  CONFIRM ADD / 确认添加
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h4 className="font-black text-zinc-800 text-sm uppercase tracking-widest">Recent / 最近入库</h4>
                <span className="text-[10px] font-black text-white bg-pink-500 px-2.5 py-1 rounded-full">{inStockPets.length}</span>
              </div>
              <div className="space-y-3">
                {inStockPets.slice(0, 5).map(pet => (
                  <div 
                    key={pet.id} 
                    onClick={() => { setSelectedPet(pet); setCurrentView('PET_DETAIL'); }}
                    className="bg-white p-5 rounded-[2rem] border border-zinc-100 flex items-center justify-between shadow-sm active:bg-zinc-50"
                  >
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-800">
                           <BrandLogo />
                        </div>
                        <div>
                            <p className="font-black text-zinc-800">{pet.species}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{pet.id} · CABINET {pet.cabinetId}</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-zinc-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SEARCH VIEW */}
        {currentView === 'SEARCH' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={22} />
              <input 
                autoFocus
                type="text" 
                className="w-full pl-14 pr-6 py-5 rounded-[2rem] bg-white border-none shadow-sm outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                placeholder="搜索 ID、条码、物种关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <h4 className="font-black text-zinc-800 text-sm tracking-widest px-2 uppercase">Results ({filteredPets.length})</h4>
              {filteredPets.map(pet => (
                <div 
                  key={pet.id} 
                  onClick={() => { setSelectedPet(pet); setCurrentView('PET_DETAIL'); }}
                  className="bg-white p-5 rounded-[2rem] border border-zinc-100 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      pet.status === PetStatus.IN_STOCK ? 'bg-purple-100 text-purple-600' :
                      pet.status === PetStatus.SOLD ? 'bg-cyan-100 text-cyan-600' : 'bg-red-100 text-red-600'
                    }`}>
                      <ClipboardList size={22} />
                    </div>
                    <div>
                      <p className="font-black text-zinc-800">{pet.species}</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">{pet.status} · {pet.barcode}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-zinc-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PET DETAIL VIEW */}
        {currentView === 'PET_DETAIL' && selectedPet && (
          <div className="space-y-6">
            <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-zinc-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-pink-50 rounded-bl-full -z-0 opacity-40"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest mb-3 inline-block ${
                                selectedPet.status === PetStatus.IN_STOCK ? 'bg-purple-100 text-purple-700' :
                                selectedPet.status === PetStatus.SOLD ? 'bg-cyan-100 text-cyan-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {selectedPet.status}
                            </span>
                            <h3 className="text-4xl font-black text-zinc-800 tracking-tighter">{selectedPet.species}</h3>
                            <p className="text-zinc-400 font-bold uppercase text-sm mt-1">{selectedPet.gene}</p>
                        </div>
                        <div className="bg-zinc-50 p-3 rounded-2xl text-center border border-zinc-100">
                            <Scan size={24} className="mx-auto mb-1 text-zinc-800" />
                            <p className="text-[10px] font-black font-mono tracking-tighter">{selectedPet.barcode}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-zinc-50 p-5 rounded-3xl">
                            <p className="text-[10px] font-black text-zinc-400 mb-1 uppercase tracking-widest flex items-center"><Calendar size={12} className="mr-1"/> Feeding</p>
                            <p className="font-black text-zinc-800">{selectedPet.feedingTime}</p>
                        </div>
                        <div className="bg-zinc-50 p-5 rounded-3xl">
                            <p className="text-[10px] font-black text-zinc-400 mb-1 uppercase tracking-widest flex items-center"><Box size={12} className="mr-1"/> Cabinet</p>
                            <p className="font-black text-zinc-800">{selectedPet.cabinetId}</p>
                        </div>
                        <div className="bg-zinc-50 p-5 rounded-3xl">
                            <p className="text-[10px] font-black text-zinc-400 mb-1 uppercase tracking-widest flex items-center"><Layers size={12} className="mr-1"/> Weight</p>
                            <p className="font-black text-zinc-800">{selectedPet.weight} KG</p>
                        </div>
                        <div className="bg-zinc-50 p-5 rounded-3xl">
                            <p className="text-[10px] font-black text-zinc-400 mb-1 uppercase tracking-widest">ID</p>
                            <p className="font-black text-zinc-800">{selectedPet.id}</p>
                        </div>
                    </div>

                    <div className="bg-pink-50 rounded-[2rem] p-6 border border-pink-100">
                        <h4 className="text-xs font-black text-pink-700 mb-3 flex items-center uppercase tracking-widest">
                            <Settings size={14} className="mr-2 animate-spin-slow" /> AI Expert Advice
                        </h4>
                        {isLoadingAdvice ? (
                            <div className="flex space-x-1.5">
                                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        ) : (
                            <p className="text-sm text-pink-900 font-medium leading-relaxed">{aiAdvice || 'Analying data...'}</p>
                        )}
                    </div>
                </div>
            </div>

            {selectedPet.status === PetStatus.IN_STOCK && (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => movePet(selectedPet.id, PetStatus.SOLD)}
                  className="flex items-center justify-center py-5 bg-cyan-500 text-white rounded-3xl font-black shadow-lg shadow-cyan-100 active:scale-95 transition-all"
                >
                  <MoveRight size={20} className="mr-2" /> 标记已售
                </button>
                <button 
                  onClick={() => movePet(selectedPet.id, PetStatus.DECEASED)}
                  className="flex items-center justify-center py-5 bg-purple-700 text-white rounded-3xl font-black shadow-lg shadow-purple-900/20 active:scale-95 transition-all"
                >
                  <Trash2 size={20} className="mr-2" /> 标记死亡
                </button>
              </div>
            )}

            <button 
              onClick={() => deletePet(selectedPet.id)}
              className="w-full py-5 bg-zinc-200 text-zinc-500 rounded-3xl font-black active:scale-95 transition-all"
            >
              DELETE RECORD / 删除档案
            </button>
          </div>
        )}

        {/* USER MANAGEMENT VIEW */}
        {currentView === 'USER_MANAGEMENT' && currentUser?.role === UserRole.ADMIN && (
          <div className="space-y-6">
            <div className="bg-black p-6 rounded-[2rem] flex items-start space-x-4">
              <ShieldAlert className="text-cyan-400 shrink-0" size={24} />
              <p className="text-sm text-zinc-400 font-medium leading-snug">ADMIN PRIVILEGE: You can block or unblock user access from here. Blocked users will be immediately logged out.</p>
            </div>
            
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="bg-white p-5 rounded-[2rem] border border-zinc-100 flex items-center justify-between shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-600' : 'bg-zinc-100 text-zinc-400'}`}>
                      <UserIcon size={24} />
                    </div>
                    <div>
                      <p className="font-black text-zinc-800">{user.username}</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{user.role}</p>
                    </div>
                  </div>
                  
                  {user.role !== UserRole.ADMIN && (
                    <button 
                      onClick={() => toggleUserStatus(user.id)}
                      className={`flex items-center px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        user.status === UserStatus.ACTIVE 
                        ? 'bg-zinc-800 text-white' 
                        : 'bg-pink-500 text-white shadow-lg shadow-pink-200'
                      }`}
                    >
                      {user.status === UserStatus.ACTIVE ? 'BLOCK' : 'RESTORE'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-zinc-100 px-6 py-4 flex justify-between items-center z-40 safe-area-bottom">
        <button 
          onClick={() => setCurrentView('DASHBOARD')}
          className={`flex flex-col items-center space-y-1.5 ${currentView === 'DASHBOARD' ? 'text-black' : 'text-zinc-300'}`}
        >
          <Layers size={22} className={currentView === 'DASHBOARD' ? 'fill-black' : ''}/>
          <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
        </button>
        <button 
          onClick={() => setCurrentView('INVENTORY')}
          className={`flex flex-col items-center space-y-1.5 ${currentView === 'INVENTORY' ? 'text-pink-500' : 'text-zinc-300'}`}
        >
          <Box size={22} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Add</span>
        </button>
        
        <div className="relative -top-8">
          <button 
            onClick={() => setIsScanning(true)}
            className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white shadow-2xl shadow-zinc-400 active:scale-90 transition-transform p-1 border-4 border-white"
          >
             <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 via-pink-500 to-purple-600 flex items-center justify-center">
                <Scan size={30} strokeWidth={3} />
             </div>
          </button>
        </div>

        <button 
          onClick={() => setCurrentView('SEARCH')}
          className={`flex flex-col items-center space-y-1.5 ${currentView === 'SEARCH' ? 'text-cyan-600' : 'text-zinc-300'}`}
        >
          <Search size={22} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Find</span>
        </button>
        <button 
          onClick={() => setCurrentView('USER_MANAGEMENT')}
          className={`flex flex-col items-center space-y-1.5 ${currentView === 'USER_MANAGEMENT' ? 'text-purple-600' : 'text-zinc-300'}`}
        >
          <UserIcon size={22} />
          <span className="text-[10px] font-black uppercase tracking-tighter">User</span>
        </button>
      </nav>

      {/* Barcode Scanner Modal */}
      {isScanning && (
        <Scanner 
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScanning(false)}
        />
      )}
    </div>
  );
};

export default App;
