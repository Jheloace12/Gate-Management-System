
import React, { useState, useEffect } from 'react';
import { User, UserRole, GatePass, PassStatus, PassType } from './types';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import RequestPass from './pages/RequestPass';
import PassList from './pages/PassList';
import SecurityPortal from './pages/SecurityPortal';
import HistoryReports from './pages/HistoryReports';
import { validatePassPurpose } from './services/geminiService';

const DEFAULT_ADMIN: User = {
    id: 'admin-001',
    name: 'System Administrator',
    email: 'admin@securepass.com',
    role: UserRole.ADMIN
};

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Initialize registered users with the default admin if none exist
    const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
        const savedUsers = localStorage.getItem('registeredUsers');
        if (savedUsers) {
            const parsed = JSON.parse(savedUsers) as User[];
            // Check if admin already exists to avoid duplicates
            if (!parsed.some(u => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase())) {
                return [DEFAULT_ADMIN, ...parsed];
            }
            return parsed;
        }
        return [DEFAULT_ADMIN];
    });

    const [activeTab, setActiveTab] = useState('dashboard');
    const [passes, setPasses] = useState<GatePass[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize data from localStorage
    useEffect(() => {
        const savedPasses = localStorage.getItem('gatepasses');
        if (savedPasses) {
            setPasses(JSON.parse(savedPasses));
        }

        const savedSession = localStorage.getItem('currentUser');
        if (savedSession) {
            setCurrentUser(JSON.parse(savedSession));
        }
    }, []);

    // Persist passes
    useEffect(() => {
        localStorage.setItem('gatepasses', JSON.stringify(passes));
    }, [passes]);

    // Persist users
    useEffect(() => {
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    }, [registeredUsers]);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        if (user.role === UserRole.SECURITY) {
            setActiveTab('security');
        } else if (user.role === UserRole.ADMIN) {
            setActiveTab('dashboard');
        } else {
            setActiveTab('dashboard');
        }
    };

    const handleRegister = (newUser: User) => {
        setRegisteredUsers(prev => [...prev, newUser]);
        // Auto-login after registration
        handleLogin(newUser);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
    };

    const createPass = async (data: any) => {
        setIsLoading(true);
        try {
            const aiResult = await validatePassPurpose(data.purpose, data.type);

            const newPass: GatePass = {
                id: `GP-${Math.floor(1000 + Math.random() * 9000)}`,
                visitorId: currentUser?.id || 'guest',
                visitorName: currentUser?.name || data.visitorName,
                visitorEmail: currentUser?.email || data.visitorEmail,
                purpose: data.purpose,
                department: data.department || 'Main Reception',
                type: data.type as PassType,
                status: PassStatus.PENDING,
                requestedAt: Date.now(),
                validDate: data.validDate,
                photoUrl: data.photoUrl,
                aiVerification: aiResult.reasoning
            };

            setPasses(prev => [newPass, ...prev]);
            setActiveTab(currentUser?.role === UserRole.VISITOR ? 'my-passes' : 'all-passes');
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const updatePassStatus = (id: string, status: PassStatus) => {
        setPasses(prev => prev.map(p => {
            if (p.id === id) {
                const updates: Partial<GatePass> = { status };
                if (status === PassStatus.CHECKED_IN) updates.checkInTime = Date.now();
                if (status === PassStatus.CHECKED_OUT) updates.checkOutTime = Date.now();
                return { ...p, ...updates };
            }
            return p;
        }));
    };

    if (!currentUser) {
        return (
            <AuthPage
                onLogin={handleLogin}
                onRegister={handleRegister}
                registeredUsers={registeredUsers}
            />
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard passes={passes} user={currentUser} />;
            case 'request':
                return <RequestPass onSubmit={createPass} isLoading={isLoading} />;
            case 'my-passes':
                return <PassList passes={passes.filter(p => p.visitorId === currentUser.id)} onStatusChange={updatePassStatus} role={currentUser.role} />;
            case 'all-passes':
                return <PassList passes={passes} onStatusChange={updatePassStatus} role={currentUser.role} />;
            case 'security':
                return <SecurityPortal passes={passes} onUpdateStatus={updatePassStatus} />;
            case 'history':
                return <HistoryReports passes={passes} />;
            case 'visitors':
                const visitorsOnly = registeredUsers.filter(u => u.role === UserRole.VISITOR);
                return (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Registered Visitors</h2>
                            <span className="text-sm text-slate-500">{visitorsOnly.length} total</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="pb-4 font-semibold text-slate-600">Name</th>
                                        <th className="pb-4 font-semibold text-slate-600">Email</th>
                                        <th className="pb-4 font-semibold text-slate-600">Role</th>
                                        <th className="pb-4 font-semibold text-slate-600">Passes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {visitorsOnly.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-slate-400 italic">
                                                No visitors registered yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        visitorsOnly.map(visitor => (
                                            <tr key={visitor.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-4 font-medium">{visitor.name}</td>
                                                <td className="py-4 text-slate-500">{visitor.email}</td>
                                                <td className="py-4"><span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase">{visitor.role}</span></td>
                                                <td className="py-4">
                                                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                                                        {passes.filter(p => p.visitorEmail === visitor.email).length}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default:
                return <Dashboard passes={passes} user={currentUser} />;
        }
    };

    return (
        <Layout
            user={currentUser}
            onLogout={handleLogout}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
        >
            {renderContent()}
        </Layout>
    );
};

export default App;
