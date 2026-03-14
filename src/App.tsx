import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogIn, 
  MessageSquare, 
  LayoutDashboard,
  Plus, 
  Send, 
  Paperclip, 
  ChevronLeft, 
  User as UserIcon, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Search,
  MoreVertical,
  Settings,
  X,
  Check,
  UserPlus,
  Bell
} from 'lucide-react';
import { api } from './api';
import type { User, Ticket, Message, TicketFilters, Agent } from './types';

type AppView = 'login' | 'dashboard' | 'list' | 'chat' | 'profile' | 'settings';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [lastNotifiedId, setLastNotifiedId] = useState<number>(0);

  useEffect(() => {
    if (user) {
      api.getAgents(user.token).then(setAgents).catch(err => {
        console.error('Failed to fetch agents:', err);
        setError(err.message);
      });

      // Polling for new messages to trigger notifications
      const pollInterval = setInterval(async () => {
        const isEnabled = localStorage.getItem('grt_notifications') !== 'false';
        if (!isEnabled) return;

        try {
          const tickets = await api.getTickets(user.token, { orderby: 'updatedAt', order: 'DESC' });
          const unreadTickets = tickets.filter(t => {
            const lastSeenMap = JSON.parse(localStorage.getItem('last_seen_messages') || '{}');
            const lastSeen = lastSeenMap[t.id] || 0;
            return t.last_message_id && t.last_message_id > lastSeen;
          });

          for (const ticket of unreadTickets) {
            if (ticket.last_message_id && ticket.last_message_id > lastNotifiedId) {
              // Show notification
              if (Notification.permission === 'granted') {
                new Notification(`New Message: ${ticket.title}`, {
                  body: ticket.description,
                  icon: '/favicon.ico'
                });
                setLastNotifiedId(ticket.last_message_id);
              }
            }
          }
        } catch (e) {
          console.error('Polling error:', e);
        }
      }, 10000); // Check every 10 seconds

      return () => clearInterval(pollInterval);
    }
  }, [user, lastNotifiedId]);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    const email = localStorage.getItem('user_email');
    const name = localStorage.getItem('user_name');
    
    if (token && email && name) {
      api.validateToken(token).then(isValid => {
        if (isValid) {
          setUser({ token, user_email: email, user_display_name: name });
          setCurrentView('list');
        } else {
          // If token is invalid, we don't necessarily want to show an error immediately
          // but we should clear the stale session.
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user_email');
          localStorage.removeItem('user_name');
        }
      }).catch(err => {
        console.error('Session validation error:', err);
        // If it's a network error during auto-login, we might want to inform the user
        if (err.message.includes('Network Error')) {
          setError(err.message);
        }
      });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const loginMethod = formData.get('login_method') as string;
    
    try {
      let loggedInUser: User;

      if (loginMethod === 'token') {
        const token = formData.get('api_token') as string;
        if (!token) throw new Error('Please enter an API Token');

        // Validate the token by trying to fetch tickets
        // Since we don't have user info from a static token, we'll use placeholders
        // or try to fetch user info if an endpoint exists.
        const isValid = await api.validateToken(token);
        if (!isValid) {
          // If validation fails, we try a simple getTickets to see if it works
          try {
            await api.getTickets(token, { limit: 1 });
          } catch (e) {
            throw new Error('Invalid API Token. Please check and try again.');
          }
        }

        loggedInUser = {
          token: token,
          user_email: 'api-user@site.com',
          user_display_name: 'API User'
        };
      } else {
        loggedInUser = await api.login(
          formData.get('username') as string,
          formData.get('password') as string
        );
      }
      
      localStorage.setItem('jwt_token', loggedInUser.token);
      localStorage.setItem('user_email', loggedInUser.user_email);
      localStorage.setItem('user_name', loggedInUser.user_display_name);
      
      setUser(loggedInUser);
      setCurrentView('list');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login Failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    setUser(null);
    setCurrentView('login');
  };

  return (
    <div className="min-h-screen bg-zinc-50 sm:bg-zinc-200 flex items-center justify-center sm:p-4 font-sans selection:bg-indigo-200 overflow-hidden">
      {/* Mobile Device Simulator Container */}
      <div className="w-full h-[100dvh] sm:h-[844px] sm:w-[390px] sm:max-h-[95vh] bg-white sm:rounded-[3rem] sm:shadow-2xl overflow-hidden sm:border-[12px] sm:border-zinc-900 relative flex flex-col ring-1 ring-zinc-900/5">
        
        {/* Hardware Buttons (Visible on Desktop) */}
        <div className="hidden sm:block absolute -left-[16px] top-32 w-[4px] h-12 bg-zinc-800 rounded-l-md border-r border-zinc-700"></div>
        <div className="hidden sm:block absolute -left-[16px] top-48 w-[4px] h-16 bg-zinc-800 rounded-l-md border-r border-zinc-700"></div>
        <div className="hidden sm:block absolute -left-[16px] top-68 w-[4px] h-16 bg-zinc-800 rounded-l-md border-r border-zinc-700"></div>
        <div className="hidden sm:block absolute -right-[16px] top-48 w-[4px] h-24 bg-zinc-800 rounded-r-md border-l border-zinc-700"></div>

        {/* Status Bar Mock */}
        <div className="absolute top-0 left-0 right-0 h-10 hidden sm:flex items-center justify-between px-8 z-50 text-[12px] font-bold text-zinc-900">
          <div>9:41</div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5 items-end h-3">
              <div className="w-0.5 h-1 bg-zinc-900 rounded-full"></div>
              <div className="w-0.5 h-1.5 bg-zinc-900 rounded-full"></div>
              <div className="w-0.5 h-2 bg-zinc-900 rounded-full"></div>
              <div className="w-0.5 h-2.5 bg-zinc-900/20 rounded-full"></div>
            </div>
            <div className="w-5 h-2.5 border border-zinc-900/30 rounded-sm relative">
              <div className="absolute left-0 top-0 bottom-0 bg-zinc-900 w-3/4 m-[1px] rounded-[1px]"></div>
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-1 bg-zinc-900/30 rounded-r-sm"></div>
            </div>
          </div>
        </div>

        {/* Dynamic Island Mock */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[120px] h-[32px] bg-zinc-900 rounded-full z-50 hidden sm:flex items-center justify-between px-3">
          <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
          <div className="w-2 h-2 rounded-full bg-emerald-900/50 relative">
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-pulse opacity-50"></div>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-zinc-900/10 rounded-full z-50 hidden sm:block"></div>

        <AnimatePresence mode="wait">
          {currentView === 'login' && (
            <motion.div 
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col min-h-0"
            >
              <LoginView onLogin={handleLogin} loading={loading} error={error} />
            </motion.div>
          )}
          
          {currentView === 'list' && user && (
            <motion.div 
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col min-h-0"
            >
              <TicketListView 
                user={user} 
                onLogout={logout} 
                onOpenSettings={() => setCurrentView('settings')}
                onSelectTicket={(t) => { setActiveTicket(t); setCurrentView('chat'); }} 
              />
            </motion.div>
          )}

          {currentView === 'dashboard' && user && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col min-h-0"
            >
              <DashboardView
                user={user}
                onSelectTicket={(t) => { setActiveTicket(t); setCurrentView('chat'); }}
              />
            </motion.div>
          )}

          {currentView === 'profile' && user && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col min-h-0"
            >
              <ProfileView user={user} onLogout={logout} />
            </motion.div>
          )}

          {currentView === 'settings' && user && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col min-h-0"
            >
              <SettingsView onClose={() => setCurrentView('list')} />
            </motion.div>
          )}

          {currentView === 'chat' && user && activeTicket && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col bg-white min-h-0"
            >
              <ChatView 
                user={user} 
                ticket={activeTicket} 
                agents={agents}
                onUpdateTicket={(updated) => setActiveTicket(updated)}
                onBack={() => { setActiveTicket(null); setCurrentView('list'); }} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {user && currentView !== 'login' && currentView !== 'chat' && (
          <BottomNav currentView={currentView} setView={setCurrentView} />
        )}
      </div>
    </div>
  );
}

function BottomNav({ currentView, setView }: { currentView: AppView, setView: (v: AppView) => void }) {
  return (
    <div className="bg-white border-t border-zinc-100 px-4 py-2 flex items-center justify-between pb-6 sm:pb-4">
      <button 
        onClick={() => setView('dashboard')}
        className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentView === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-zinc-400 hover:text-zinc-600'}`}
      >
        <div className={`p-1 rounded-xl transition-colors ${currentView === 'dashboard' ? 'bg-indigo-50' : ''}`}>
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold">Dashboard</span>
      </button>
      <button 
        onClick={() => setView('list')}
        className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentView === 'list' ? 'text-indigo-600 scale-110' : 'text-zinc-400 hover:text-zinc-600'}`}
      >
        <div className={`p-1 rounded-xl transition-colors ${currentView === 'list' ? 'bg-indigo-50' : ''}`}>
          <MessageSquare className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold">Tickets</span>
      </button>
      <button 
        onClick={() => setView('profile')}
        className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentView === 'profile' ? 'text-indigo-600 scale-110' : 'text-zinc-400 hover:text-zinc-600'}`}
      >
        <div className={`p-1 rounded-xl transition-colors ${currentView === 'profile' ? 'bg-indigo-50' : ''}`}>
          <UserIcon className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold">Profile</span>
      </button>
      <button 
        onClick={() => setView('settings')}
        className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentView === 'settings' ? 'text-indigo-600 scale-110' : 'text-zinc-400 hover:text-zinc-600'}`}
      >
        <div className={`p-1 rounded-xl transition-colors ${currentView === 'settings' ? 'bg-indigo-50' : ''}`}>
          <Settings className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold">Settings</span>
      </button>
    </div>
  );
}

function DashboardView({ user, onSelectTicket }: { user: User, onSelectTicket: (t: Ticket) => void }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const getTicketDate = (ticket: Ticket) => {
    const candidate = (ticket as any).updatedAt ?? (ticket as any).updated_at ?? null;
    if (!candidate) return null;
    const parsedDate = new Date(candidate);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };
  const getTicketStatusLabel = (ticket: Ticket) => ((ticket as any).status || 'open').toString().replace('-', ' ');

  useEffect(() => {
    const fetchDashboardData = () => {
      api.getTickets(user.token, { orderby: 'updatedAt', order: 'DESC', limit: 200 })
        .then((data) => {
          setTickets(data);
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Dashboard fetch error:', err);
          setError('Failed to load dashboard data.');
          setLoading(false);
        });
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, [user.token]);

  const statusCounts = tickets.reduce((acc, ticket) => {
    const key = ticket.status || 'open';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityCounts = tickets.reduce((acc, ticket) => {
    const key = ticket.priority || 'low';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const assignedCounts = tickets.reduce((acc, ticket) => {
    const key = ticket.assigned_agent_name?.trim() || 'Unassigned';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let lastSeenMap: Record<string, number> = {};
  try {
    lastSeenMap = JSON.parse(localStorage.getItem('last_seen_messages') || '{}');
  } catch (e) {
    console.error('Dashboard last_seen_messages parse error:', e);
  }
  const unreadCount = tickets.filter((ticket) => {
    if (!ticket.last_message_id) return false;
    const lastSeen = lastSeenMap[ticket.id] || 0;
    return ticket.last_message_id > lastSeen;
  }).length;

  const dailyTickets = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - idx));
    const key = date.toISOString().slice(0, 10);
    const count = tickets.filter((ticket) => {
      const parsedDate = getTicketDate(ticket);
      if (!parsedDate) return false;
      const updated = parsedDate.toISOString().slice(0, 10);
      return updated === key;
    }).length;
    return {
      key,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count,
    };
  });

  const topAssignees = (Object.entries(assignedCounts) as Array<[string, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const recentTickets = tickets.slice(0, 5);
  const maxStatus = Math.max(...(Object.values(statusCounts) as number[]), 1);
  const maxPriority = Math.max(...(Object.values(priorityCounts) as number[]), 1);
  const maxDaily = Math.max(...dailyTickets.map((d) => d.count), 1);
  const maxAssignee = Math.max(...topAssignees.map(([, count]) => count), 1);

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 min-h-0">
      <header className="px-6 pt-10 sm:pt-12 pb-4 flex items-center justify-between sticky top-0 z-10 bg-zinc-50/90 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500">{user.user_display_name}</p>
        </div>
        <div className="text-xs text-zinc-500 bg-white px-3 py-2 rounded-xl border border-zinc-200">
          Real data
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6 space-y-4">
        {loading ? (
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 text-center">
            <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-zinc-500">Loading dashboard...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-zinc-100">
                <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Total Tickets</p>
                <p className="text-2xl font-bold text-zinc-900 mt-2">{tickets.length}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-zinc-100">
                <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Unread</p>
                <p className="text-2xl font-bold text-indigo-600 mt-2">{unreadCount}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-zinc-100">
                <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Open</p>
                <p className="text-2xl font-bold text-emerald-600 mt-2">{statusCounts.open || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-zinc-100">
                <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Solved</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{statusCounts.solved || 0}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-zinc-100 space-y-3">
              <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Status Chart</p>
              {['open', 'in-progress', 'solved', 'closed'].map((status) => {
                const count = statusCounts[status] || 0;
                const width = `${(count / maxStatus) * 100}%`;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 capitalize">{status.replace('-', ' ')}</span>
                      <span className="text-zinc-900 font-semibold">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white p-4 rounded-3xl border border-zinc-100 space-y-3">
              <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Priority Chart</p>
              {['high', 'medium', 'low'].map((priority) => {
                const count = priorityCounts[priority] || 0;
                const width = `${(count / maxPriority) * 100}%`;
                return (
                  <div key={priority} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 capitalize">{priority}</span>
                      <span className="text-zinc-900 font-semibold">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                      <div className={`h-full rounded-full ${priority === 'high' ? 'bg-red-500' : priority === 'medium' ? 'bg-amber-500' : 'bg-zinc-500'}`} style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white p-4 rounded-3xl border border-zinc-100">
              <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-3">Last 7 Days Activity</p>
              <div className="flex items-end gap-2 h-28">
                {dailyTickets.map((day) => (
                  <div key={day.key} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-zinc-100 rounded-t-md overflow-hidden h-20 flex items-end">
                      <div className="w-full bg-indigo-500 rounded-t-md" style={{ height: `${(day.count / maxDaily) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-zinc-500">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-zinc-100 space-y-3">
              <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Top Assignees</p>
              {topAssignees.length === 0 ? (
                <p className="text-sm text-zinc-500">No assignments yet.</p>
              ) : (
                topAssignees.map(([name, count]) => (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 truncate pr-2">{name}</span>
                      <span className="text-zinc-900 font-semibold">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(count / maxAssignee) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white p-4 rounded-3xl border border-zinc-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Recent Tickets</p>
                <p className="text-[11px] text-zinc-500">Auto refresh: 15s</p>
              </div>
              <div className="space-y-2">
                {recentTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    className="w-full text-left p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-colors"
                  >
                    <p className="text-sm font-semibold text-zinc-900 truncate">{ticket.title}</p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      #{ticket.id} · {getTicketStatusLabel(ticket)} · {getTicketDate(ticket)?.toLocaleDateString() || 'Unknown date'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ProfileView({ user, onLogout }: { user: User, onLogout: () => void }) {
  return (
    <div className="flex-1 flex flex-col bg-zinc-50 p-6 pt-10 sm:pt-12">
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
          <UserIcon className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-semibold text-zinc-900">{user.user_display_name}</h2>
        <p className="text-zinc-500 text-sm">{user.user_email}</p>
      </div>

      <div className="space-y-3">
        <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
          <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold mb-1">Account Status</p>
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Active</span>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl font-semibold hover:bg-red-100 transition-colors mt-8"
        >
          <LogIn className="w-5 h-5 rotate-180" />
          Logout
        </button>
      </div>
    </div>
  );
}

function SettingsView({ onClose }: { onClose: () => void }) {
  const [siteUrl, setSiteUrl] = useState(localStorage.getItem('grt_site_url') || '');
  const [notifications, setNotifications] = useState(localStorage.getItem('grt_notifications') !== 'false');
  const [saved, setSaved] = useState(false);

  const toggleNotifications = async () => {
    if (!notifications) {
      if (!('Notification' in window)) {
        alert('This browser does not support notifications.');
        return;
      }

      if (Notification.permission === 'denied') {
        alert('Notification permission was previously denied. Please reset permissions in your browser settings to enable them.');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotifications(true);
        new Notification('Notifications Enabled!', {
          body: 'You will now receive updates for your tickets.',
          icon: '/favicon.ico'
        });
      } else {
        alert('Notification permission denied.');
      }
    } else {
      setNotifications(false);
    }
  };

  const sendTestNotification = () => {
    if (Notification.permission === 'granted' && notifications) {
      new Notification('Test Notification', {
        body: 'This is a test notification from GRT Support.',
        icon: '/favicon.ico'
      });
    } else {
      alert('Please enable notifications first.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('grt_site_url', siteUrl);
    localStorage.setItem('grt_notifications', notifications.toString());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
      window.location.reload(); // Reload to apply new URL
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="p-6 pt-10 sm:pt-12 flex items-center justify-between border-b border-zinc-100">
        <h2 className="text-xl font-semibold text-zinc-900">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <form onSubmit={handleSave} className="space-y-6 pb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 ml-1">WordPress Site URL</label>
              <input 
                type="url" 
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://your-site.com"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                required
              />
              <p className="text-[11px] text-zinc-400 ml-1">Enter the base URL of your WordPress site where GRT is installed.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Mobile Notifications</p>
                    <p className="text-[11px] text-zinc-400">Receive alerts for new messages</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleNotifications}
                  className={`w-12 h-6 rounded-full transition-all relative ${notifications ? 'bg-indigo-600' : 'bg-zinc-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              {notifications && (
                <button
                  type="button"
                  onClick={sendTestNotification}
                  className="w-full py-2.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  Send Test Notification
                </button>
              )}

              <p className="text-[10px] text-zinc-400 leading-relaxed italic px-1">
                Note: On iOS, you must "Add to Home Screen" to receive notifications.
              </p>
            </div>

            <div className="space-y-1.5 pt-4 border-t border-zinc-100">
              <label className="block text-xs font-medium text-zinc-500 ml-1 uppercase tracking-wider">Current Origin (CORS)</label>
              <div className="w-full px-4 py-3 bg-zinc-100 rounded-2xl text-[11px] font-mono text-zinc-600 break-all select-all">
                {window.location.origin}
              </div>
              <p className="text-[10px] text-zinc-400 ml-1 mt-2 leading-relaxed">
                Copy this URL and add it to your WordPress plugin's "Allowed Origins" settings to fix CORS issues on this device.
              </p>
            </div>

            <button 
              type="submit"
              className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                saved ? 'bg-emerald-500 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved & Reloading...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
        </form>
      </div>
    </div>
  );
}

function LoginView({ onLogin, loading, error }: { onLogin: (e: React.FormEvent<HTMLFormElement>) => void, loading: boolean, error: string | null }) {
  const [showSettings, setShowSettings] = useState(false);
  const [siteUrl, setSiteUrl] = useState(localStorage.getItem('grt_site_url') || '');
  const [loginMethod, setLoginMethod] = useState<'password' | 'token'>('password');

  const handleSaveSettings = () => {
    if (siteUrl) {
      const cleanUrl = siteUrl.replace(/\/$/, '');
      localStorage.setItem('grt_site_url', cleanUrl);
    }
    setShowSettings(false);
  };

  return (
    <div className="flex-1 flex flex-col p-8 bg-white relative overflow-y-auto no-scrollbar">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-70"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-70"></div>

      <div className="flex-1 flex flex-col justify-center relative z-10 mt-8">
        <div className="flex items-center justify-between mb-8">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-xl shadow-zinc-900/20"
          >
            <MessageSquare className="text-white w-8 h-8" />
          </motion.div>
          <button 
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-2.5 text-zinc-400 hover:text-zinc-900 bg-white/80 backdrop-blur-md rounded-full border border-zinc-100 shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-semibold text-zinc-900 mb-3 tracking-tight">Welcome<br/>back.</h1>
          <p className="text-zinc-500 mb-8 text-sm leading-relaxed">Sign in to manage your support tickets and chat with our team.</p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex p-1 bg-zinc-100 rounded-xl mb-8"
        >
          <button
            onClick={() => setLoginMethod('password')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${loginMethod === 'password' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Password
          </button>
          <button
            onClick={() => setLoginMethod('token')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${loginMethod === 'token' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            API Token
          </button>
        </motion.div>
        
        <motion.form 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={onLogin} 
          className="w-full space-y-5"
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 leading-relaxed"
            >
              {error}
            </motion.div>
          )}

          <input type="hidden" name="login_method" value={loginMethod} />

          {loginMethod === 'password' ? (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-500 ml-1">Username or Email</label>
                <input 
                  name="username"
                  type="text" 
                  placeholder="Enter your username or email"
                  className="w-full px-4 py-3.5 bg-zinc-50 rounded-2xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-zinc-900 placeholder:text-zinc-400"
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-500 ml-1">Password</label>
                <input 
                  name="password"
                  type="password" 
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 bg-zinc-50 rounded-2xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-zinc-900 placeholder:text-zinc-400"
                  required 
                />
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-500 ml-1">API Token</label>
              <textarea 
                name="api_token"
                placeholder="Paste your generated API Token here..."
                rows={3}
                className="w-full px-4 py-3.5 bg-zinc-50 rounded-2xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-zinc-900 placeholder:text-zinc-400 resize-none"
                required 
              />
              <p className="text-[10px] text-zinc-400 ml-1">Copy the token from your WordPress plugin settings.</p>
            </div>
          )}

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  name="remember"
                  className="peer appearance-none w-5 h-5 border-2 border-zinc-200 rounded-lg checked:bg-zinc-900 checked:border-zinc-900 transition-all cursor-pointer"
                  defaultChecked
                />
                <Check className="w-3.5 h-3.5 text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-900 transition-colors">Remember me</span>
            </label>
            <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Forgot password?</button>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-medium py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-8 shadow-lg shadow-zinc-900/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Sign In
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </>
            )}
          </button>
        </motion.form>
      </div>

      {/* Settings Popup for Login */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm z-30"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-48px)] bg-white rounded-[2rem] p-6 z-40 shadow-2xl border border-zinc-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-zinc-900">App Settings</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 bg-zinc-100 rounded-full text-zinc-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 ml-1 uppercase tracking-wider">WordPress Site URL</label>
                  <input 
                    type="url" 
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="https://your-site.com"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3.5 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-[11px] text-indigo-700 leading-relaxed">
                    Enter the URL where the GRT Support plugin is installed. This is required to connect to your tickets.
                  </p>
                </div>

                <button 
                  onClick={handleSaveSettings}
                  className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-900/10"
                >
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function TicketListView({ user, onLogout, onOpenSettings, onSelectTicket }: { user: User, onLogout: () => void, onOpenSettings: () => void, onSelectTicket: (t: Ticket) => void }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [filters, setFilters] = useState<TicketFilters>({
    status: '',
    search: '',
    orderby: 'updatedAt',
    order: 'DESC'
  });
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [lastSeenMap, setLastSeenMap] = useState<Record<number, number>>({});

  useEffect(() => {
    const saved = localStorage.getItem('last_seen_messages');
    if (saved) {
      try {
        setLastSeenMap(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing last seen messages', e);
      }
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getTickets(user.token, filters).then(data => {
      setTickets(data);
      setLoading(false);
    }).catch(err => {
      console.error('Fetch tickets error:', err);
      setError('Failed to sync tickets. Please check your connection or Site URL.');
      setLoading(false);
    });
  }, [user.token, filters]);

  useEffect(() => {
    if (searchInput === (filters.search || '')) return;
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
  };

  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const isUnread = (ticket: Ticket) => {
    if (!ticket.last_message_id) return false;
    const lastSeen = lastSeenMap[ticket.id] || 0;
    return ticket.last_message_id > lastSeen;
  };

  const onTicketClick = (ticket: Ticket) => {
    if (ticket.last_message_id) {
      const newMap = { ...lastSeenMap, [ticket.id]: ticket.last_message_id };
      setLastSeenMap(newMap);
      localStorage.setItem('last_seen_messages', JSON.stringify(newMap));
    }
    onSelectTicket(ticket);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 relative min-h-0">
      <header className="px-6 pt-10 sm:pt-12 pb-4 flex items-center justify-between sticky top-0 z-10 bg-zinc-50/80 backdrop-blur-xl">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Tickets</h1>
          <p className="text-sm text-zinc-500">{user.user_display_name}</p>
        </motion.div>
        <div className="relative">
          <button 
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-white rounded-full transition-all"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-xl border border-zinc-100 p-1 z-30"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 rounded-xl"
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    Logout
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="px-6 pb-2 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search tickets..." 
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['', 'open', 'in-progress', 'solved', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filters.status === status 
                ? 'bg-zinc-900 text-white' 
                : 'bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {status === '' ? 'All' : status.replace('-', ' ').charAt(0).toUpperCase() + status.replace('-', ' ').slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 space-y-4 pb-6">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">{error}</p>
            <button 
              onClick={() => {
                setLoading(true);
                setError(null);
                api.getTickets(user.token, filters).then(data => {
                  setTickets(data);
                  setLoading(false);
                }).catch(() => {
                  setError('Failed to sync tickets. Please check your connection or Site URL.');
                  setLoading(false);
                });
              }}
              className="text-xs font-semibold text-zinc-900 hover:underline"
            >
              Try Again
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-zinc-300" />
            </div>
            <h3 className="text-zinc-900 font-medium">No tickets found</h3>
            <p className="text-sm text-zinc-500">You don't have any support tickets yet.</p>
          </div>
        ) : (
          <AnimatePresence>
            {tickets.map((ticket, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={ticket.id} 
                onClick={() => onTicketClick(ticket)}
                className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-100 active:scale-[0.98] transition-all cursor-pointer group hover:shadow-md hover:border-zinc-200 relative"
              >
                {isUnread(ticket) && (
                  <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-indigo-600 rounded-full ring-4 ring-indigo-50 shadow-sm animate-pulse"></div>
                )}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full 
                      ${ticket.status === 'open' ? 'bg-emerald-500' : 
                        ticket.status === 'solved' ? 'bg-blue-500' : 
                        'bg-zinc-300'}`}>
                    </span>
                    <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                      {ticket.status.replace('-', ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg">#{ticket.id}</span>
                </div>
                <h3 className="font-semibold text-zinc-900 mb-1.5 leading-snug group-hover:text-indigo-600 transition-colors">{ticket.title}</h3>
                <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">{ticket.description}</p>
                
                <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-medium">
                    {new Date(ticket.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className={`text-[10px] px-2 py-1 rounded-md font-medium uppercase tracking-wider
                    ${ticket.priority === 'high' ? 'bg-red-50 text-red-600' : 
                      ticket.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 
                      'bg-zinc-50 text-zinc-600'}`}>
                    {ticket.priority}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function ChatView({ user, ticket, onBack, onUpdateTicket, agents }: { user: User, ticket: Ticket, onBack: () => void, onUpdateTicket: (t: Ticket) => void, agents: Agent[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = () => {
      api.getMessages(ticket.id, user.token).then(setMessages).catch(err => console.error('Chat polling error:', err));
    };

    fetchMessages(); // Initial fetch
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [ticket.id, user.token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAssign = async (agentId: number) => {
    setAssigning(true);
    setAssignError(null);
    try {
      const res = await api.assignAgent(ticket.id, agentId, user.token);
      onUpdateTicket({
        ...ticket,
        assigned_agent_id: res.assigned_agent_id,
        assigned_agent_name: res.assigned_agent_name
      });
      setShowAssignMenu(false);
    } catch (err: any) {
      setAssignError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    setUpdatingStatus(true);
    setAssignError(null);
    try {
      const updated = await api.updateTicketStatus(ticket.id, status, user.token);
      onUpdateTicket(updated);
    } catch (err: any) {
      console.error('Status update error:', err);
      setAssignError(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const tempId = Date.now();
    const newMsg: Message = {
      id: tempId,
      ticket_id: ticket.id,
      sender_name: user.user_display_name,
      message: input,
      created_at: new Date().toISOString(),
      is_mine: true,
      sync_status: 'sending'
    };

    setMessages(prev => [...prev, newMsg]);
    const currentInput = input;
    setInput('');

    try {
      const sentMsg = await api.sendMessage(ticket.id, currentInput, user.token);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...sentMsg, sync_status: 'sent' } : m));
    } catch (error) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, sync_status: 'failed' } : m));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const tempId = Date.now();
    const newMsg: Message = {
      id: tempId,
      ticket_id: ticket.id,
      sender_name: user.user_display_name,
      message: `Uploading file: ${file.name}...`,
      created_at: new Date().toISOString(),
      is_mine: true,
      sync_status: 'sending'
    };

    setMessages(prev => [...prev, newMsg]);

    try {
      const fileUrl = await api.uploadMedia(file, user.token);
      // After upload, send the URL as a message
      const sentMsg = await api.sendMessage(ticket.id, `[Attachment] ${fileUrl}`, user.token);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...sentMsg, sync_status: 'sent' } : m));
    } catch (error: any) {
      console.error('Upload error:', error);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, message: `Upload failed: ${file.name}`, sync_status: 'failed' } : m));
      alert(error.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const canRetryMessage = (msg: Message) => {
    if (!msg.is_mine) return false;
    if (msg.sync_status !== 'failed') return false;
    if (msg.message.startsWith('Upload failed:')) return false;
    if (msg.message.startsWith('Uploading file:')) return false;
    if (msg.message.includes('[Attachment]')) return false;
    return true;
  };

  const handleRetryMessage = async (msg: Message) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, sync_status: 'sending' } : m));
    try {
      const sentMsg = await api.sendMessage(ticket.id, msg.message, user.token);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...sentMsg, sync_status: 'sent', is_mine: true } : m));
    } catch (error) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, sync_status: 'failed' } : m));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white relative min-h-0">
      <header className="px-4 pt-10 sm:pt-12 pb-3 border-b border-zinc-100 flex items-center gap-3 sticky top-0 z-20 bg-white/80 backdrop-blur-xl">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full active:scale-95 transition-all">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0
              ${ticket.status === 'open' ? 'bg-emerald-500' : 
                ticket.status === 'in-progress' ? 'bg-amber-500' : 
                'bg-zinc-300'}`}>
            </span>
            <h2 className="font-semibold text-zinc-900 text-sm truncate">{ticket.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-zinc-500 font-medium">Ticket #{ticket.id}</p>
            {ticket.assigned_agent_name && (
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md font-medium truncate max-w-[100px]">
                @{ticket.assigned_agent_name}
              </span>
            )}
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowAssignMenu(!showAssignMenu)}
            className={`p-2 rounded-full transition-all ${showAssignMenu ? 'bg-indigo-50 text-indigo-600' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'}`}
          >
            <Settings className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showAssignMenu && (
              <>
                <div className="absolute inset-0 z-20" onClick={() => setShowAssignMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-zinc-100 p-2 z-30 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-zinc-50 mb-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</span>
                    {updatingStatus && <div className="w-3 h-3 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>}
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-1">
                    {['open', 'in-progress', 'solved', 'closed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(status)}
                        disabled={updatingStatus}
                        className={`px-3 py-2 text-[11px] font-semibold rounded-xl transition-all capitalize cursor-pointer ${
                          ticket.status === status 
                            ? 'bg-zinc-900 text-white' 
                            : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                        } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {status.replace('-', ' ')}
                      </button>
                    ))}
                  </div>

                  <div className="px-3 py-2 border-b border-zinc-50 my-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Assign Agent</span>
                    {assigning && <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
                  </div>
                  
                  {assignError && (
                    <div className="px-3 py-2 mb-2 bg-red-50 rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-red-600 leading-tight">{assignError}</p>
                    </div>
                  )}

                  <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                    <button
                      onClick={() => handleAssign(0)}
                      disabled={assigning}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition-colors cursor-pointer ${!ticket.assigned_agent_id ? 'bg-zinc-50 text-zinc-400 cursor-default' : 'text-red-600 hover:bg-red-50'} ${assigning ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span>Unassign</span>
                      {!ticket.assigned_agent_id && <Check className="w-4 h-4" />}
                    </button>
                    
                    <div className="h-px bg-zinc-50 my-1" />
                    
                    {agents.length === 0 ? (
                      <div className="px-3 py-4 text-center">
                        <p className="text-[10px] text-zinc-400">No agents found</p>
                      </div>
                    ) : (
                      agents.map(agent => (
                        <button
                          key={agent.id}
                          onClick={() => handleAssign(agent.id)}
                          disabled={assigning}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition-colors cursor-pointer ${ticket.assigned_agent_id === agent.id ? 'bg-indigo-50 text-indigo-600' : 'text-zinc-700 hover:bg-zinc-50'} ${assigning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="truncate">{agent.name}</span>
                          {ticket.assigned_agent_id === agent.id && <Check className="w-4 h-4" />}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        <button className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-all">
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-6 bg-zinc-50/50">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={msg.id} 
              className={`flex flex-col ${msg.is_mine ? 'items-end' : 'items-start'}`}
            >
              {!msg.is_mine && (
                <span className="text-[11px] font-medium text-zinc-500 mb-1.5 ml-1">{msg.sender_name}</span>
              )}
              <div className={`max-w-[85%] p-3.5 rounded-2xl ${
                msg.is_mine 
                  ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm shadow-indigo-600/20' 
                  : 'bg-white border border-zinc-100 text-zinc-900 rounded-tl-sm shadow-sm'
              }`}>
                {msg.message.match(/\.(jpg|jpeg|png|gif|webp)/i) || msg.message.includes('[Attachment]') ? (
                  <div className="space-y-2">
                    {(() => {
                      const urlMatch = msg.message.match(/https?:\/\/[^\s]+/);
                      const url = urlMatch ? urlMatch[0] : null;
                      if (url) {
                        return (
                          <img 
                            src={url} 
                            alt="Attachment" 
                            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            referrerPolicy="no-referrer"
                            onClick={() => window.open(url, '_blank')}
                          />
                        );
                      }
                      return <p className="text-[15px] leading-relaxed">{msg.message}</p>;
                    })()}
                    {!msg.message.includes('[Attachment]') && <p className="text-[15px] leading-relaxed">{msg.message}</p>}
                  </div>
                ) : (
                  <p className="text-[15px] leading-relaxed">{msg.message}</p>
                )}
              </div>
              
              {/* Sync Status Indicator */}
              {msg.is_mine && msg.sync_status && (
                <div className="flex items-center gap-2 mt-1.5 mr-1">
                  {msg.sync_status === 'sending' && (
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Clock className="w-3 h-3 text-zinc-400" />
                    </motion.div>
                  )}
                  {msg.sync_status === 'sent' && <CheckCircle2 className="w-3 h-3 text-indigo-500" />}
                  {msg.sync_status === 'failed' && <AlertCircle className="w-3 h-3 text-red-500" />}
                  <span className="text-[10px] font-medium text-zinc-400 capitalize">{msg.sync_status}</span>
                  {canRetryMessage(msg) && (
                    <button
                      type="button"
                      onClick={() => handleRetryMessage(msg)}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-2" />
      </div>

      <div className="p-4 bg-white border-t border-zinc-100 pb-8">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
        />
        <form onSubmit={handleSend} className="flex items-end gap-2 bg-zinc-50 p-1.5 rounded-3xl border border-zinc-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/50 rounded-full transition-colors shrink-0 disabled:opacity-50"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-transparent border-transparent px-2 py-3 text-[15px] outline-none text-zinc-900 placeholder:text-zinc-400"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shrink-0 shadow-sm shadow-indigo-600/20"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
