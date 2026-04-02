import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Timer, 
  Sparkles, 
  Settings, 
  LogOut, 
  User, 
  Plus, 
  Search, 
  Bell,
  TrendingUp,
  Brain,
  Clock,
  Calendar,
  ChevronRight,
  Menu,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  where, 
  handleFirestoreError,
  OperationType,
  User as FirebaseUser
} from './firebase';
import { cn } from './lib/utils';
import { UserProfile, StudySession, Task, StudyInsight } from './types';
import { StudyTimer } from './components/StudyTimer';
import { TaskCard } from './components/TaskCard';
import Markdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'timer' | 'insights'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [insights, setInsights] = useState<StudyInsight[]>([]);
  
  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsLoading(false);
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Profile & Data Listeners
  useEffect(() => {
    if (!user) return;

    // Profile Listener
    const profileUnsub = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as UserProfile);
      } else {
        // Create initial profile
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Scholar',
          photoURL: user.photoURL || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          preferences: {
            theme: 'light',
            studyReminders: true
          }
        };
        setDoc(doc(db, 'users', user.uid), newProfile).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`));
      }
      setIsLoading(false);
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${user.uid}`));

    // Tasks Listener
    const tasksUnsub = onSnapshot(query(collection(db, `users/${user.uid}/tasks`)), (snapshot) => {
      setTasks(snapshot.docs.map(d => d.data() as Task));
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${user.uid}/tasks`));

    // Sessions Listener
    const sessionsUnsub = onSnapshot(query(collection(db, `users/${user.uid}/sessions`)), (snapshot) => {
      setSessions(snapshot.docs.map(d => d.data() as StudySession));
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${user.uid}/sessions`));

    // Insights Listener
    const insightsUnsub = onSnapshot(query(collection(db, `users/${user.uid}/insights`)), (snapshot) => {
      setInsights(snapshot.docs.map(d => d.data() as StudyInsight));
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${user.uid}/insights`));

    return () => {
      profileUnsub();
      tasksUnsub();
      sessionsUnsub();
      insightsUnsub();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const addTask = async (title: string, subject: string) => {
    if (!user) return;
    const taskId = crypto.randomUUID();
    const newTask: Task = {
      id: taskId,
      userId: user.uid,
      title,
      subject,
      priority: 'medium',
      status: 'todo',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, `users/${user.uid}/tasks`, taskId), newTask);
  };

  const toggleTask = async (taskId: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    await setDoc(doc(db, `users/${user.uid}/tasks`, taskId), { ...task, status: newStatus });
  };

  const generateInsight = async () => {
    if (!user) return;
    try {
      const prompt = `Based on these study sessions: ${JSON.stringify(sessions.slice(-5))} and tasks: ${JSON.stringify(tasks)}, provide a short, motivating study insight for the user. Focus on productivity and balance. Format as markdown.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      const insightId = crypto.randomUUID();
      const newInsight: StudyInsight = {
        id: insightId,
        userId: user.uid,
        date: new Date().toISOString(),
        content: response.text || "Keep up the great work!",
        type: 'productivity'
      };
      await setDoc(doc(db, `users/${user.uid}/insights`, insightId), newInsight);
    } catch (error) {
      console.error("AI Insight generation failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-brand-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-brand-500/20">
              <Brain className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">StudyOS</h1>
            <p className="text-slate-500 text-lg">Your intelligent companion for academic excellence.</p>
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-4 px-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 font-semibold text-slate-700"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
            Continue with Google
          </button>
          <p className="text-xs text-slate-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    );
  }

  const stats = [
    { label: 'Study Hours', value: '12.5', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Tasks Done', value: tasks.filter(t => t.status === 'completed').length, icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Focus Score', value: '8.4', icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Streak', value: '5 Days', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform duration-300 transform lg:translate-x-0 lg:static",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">StudyOS</span>
          </div>

          <nav className="flex-1 space-y-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
              { id: 'timer', icon: Timer, label: 'Study Timer' },
              { id: 'insights', icon: Sparkles, label: 'AI Insights' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all",
                  activeTab === item.id 
                    ? "bg-brand-50 text-brand-600" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-3 px-2">
              <img 
                src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`} 
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                alt="Profile"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{profile?.displayName}</p>
                <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <header className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-white border border-slate-200"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold tracking-tight capitalize">{activeTab}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all w-64"
              />
            </div>
            <button className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-brand-500 transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="px-8 pb-12">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, i) => (
                    <div key={i} className="glass p-6 rounded-3xl space-y-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                        <stat.icon className={cn("w-6 h-6", stat.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Tasks */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Upcoming Tasks</h3>
                      <button 
                        onClick={() => setActiveTab('tasks')}
                        className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                      >
                        View All <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {tasks.filter(t => t.status !== 'completed').slice(0, 3).map(task => (
                        <TaskCard key={task.id} task={task} onToggle={toggleTask} />
                      ))}
                      {tasks.filter(t => t.status !== 'completed').length === 0 && (
                        <div className="p-12 text-center glass rounded-3xl">
                          <CheckSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                          <p className="text-slate-400 font-medium">All caught up! Time to study?</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Timer */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold">Quick Timer</h3>
                    <StudyTimer className="w-full" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <button className="px-6 py-2 bg-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2">
                      <Plus className="w-5 h-5" /> New Task
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {tasks.map(task => (
                    <TaskCard key={task.id} task={task} onToggle={toggleTask} />
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'timer' && (
              <motion.div
                key="timer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-center py-12"
              >
                <StudyTimer className="max-w-xl w-full" />
              </motion.div>
            )}

            {activeTab === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 max-w-md">Get AI-powered insights based on your study patterns and task completion.</p>
                  <button 
                    onClick={generateInsight}
                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
                  >
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Generate New Insight
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {insights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(insight => (
                    <div key={insight.id} className="glass p-8 rounded-3xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold capitalize">{insight.type} Insight</p>
                            <p className="text-xs text-slate-400">{new Date(insight.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="markdown-body">
                        <Markdown>{insight.content}</Markdown>
                      </div>
                    </div>
                  ))}
                  {insights.length === 0 && (
                    <div className="p-20 text-center glass rounded-3xl">
                      <Sparkles className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                      <h4 className="text-xl font-bold text-slate-900 mb-2">No insights yet</h4>
                      <p className="text-slate-400 max-w-xs mx-auto">Complete some study sessions and tasks to get personalized AI advice.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
