import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../services/api';
import {
  HiOutlineUsers,
  HiOutlineSearch,
  HiOutlineMail,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineBan,
  HiOutlineRefresh,
  HiOutlineArrowLeft,
  HiOutlineExclamation,
  HiOutlineX,
  HiOutlinePhone,
  HiOutlineIdentification,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineUserRemove
} from 'react-icons/hi';
import { FaAnchor } from 'react-icons/fa';
import { IoBoatOutline } from 'react-icons/io5';
import { MdOutlineDirectionsBoat } from 'react-icons/md';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [messageData, setMessageData] = useState({ subject: '', message: '' });
  const [banReason, setBanReason] = useState('');
  const [actionUserId, setActionUserId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [deletedCount, setDeletedCount] = useState(0);

  useEffect(() => {
    fetchUsers();
    // Load deleted count from localStorage
    const stored = localStorage.getItem('deletedUsersCount');
    if (stored) setDeletedCount(parseInt(stored));
  }, []);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE}/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
      setUsers(response.data.users || []);
    } catch (err) {
      console.error(err);
      showNotification('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Ban user
  const handleBanUser = async () => {
    try {
      await axios.put(
        `${API_BASE}/admin/users/${actionUserId}/ban`,
        { reason: banReason },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        }
      );
      showNotification('User banned successfully', 'success');
      setShowBanModal(false);
      setBanReason('');
      fetchUsers();
    } catch (err) {
      showNotification('Ban failed', 'error');
    }
  };

  // Unban user
  const unbanUser = async (userId) => {
    try {
      await axios.put(
        `${API_BASE}/admin/users/${userId}/unban`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        }
      );
      showNotification('User unbanned successfully', 'success');
      fetchUsers();
    } catch (err) {
      showNotification('Unban failed', 'error');
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user permanently? This cannot be undone.')) return;
    
    try {
      await axios.delete(
        `${API_BASE}/admin/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        }
      );
      
      // Update deleted count
      const newCount = deletedCount + 1;
      setDeletedCount(newCount);
      localStorage.setItem('deletedUsersCount', newCount.toString());
      
      showNotification('User deleted successfully', 'success');
      fetchUsers(); // Refresh list - total count auto-updates
    } catch (err) {
      showNotification('Deletion failed', 'error');
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageData.message.trim()) {
      showNotification('Message cannot be empty', 'error');
      return;
    }
    
    try {
      await axios.post(
        `${API_BASE}/admin/users/${actionUserId}/message`,
        messageData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        }
      );
      showNotification('Message sent successfully', 'success');
      setShowMessageModal(false);
      setMessageData({ subject: '', message: '' });
    } catch (err) {
      showNotification('Failed to send message', 'error');
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nic?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Calculate counts
  const totalUsers = users.length;
  const boatOwnersCount = users.filter(u => u.role === 'owner').length;
  const boatDriversCount = users.filter(u => u.role === 'driver').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-2xl backdrop-blur-xl border shadow-2xl animate-slide-in ${
          notification.type === 'success' 
            ? 'bg-green-500/20 border-green-500/40 text-green-100' 
            : 'bg-red-500/20 border-red-500/40 text-red-100'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <HiOutlineCheckCircle className="text-2xl" />
            ) : (
              <HiOutlineExclamation className="text-2xl" />
            )}
            <p className="font-semibold">{notification.message}</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="relative z-20 bg-slate-900/60 backdrop-blur-2xl border-b border-white/10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dw-admin/dashboard')}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-blue-100 transition-all"
              >
                <HiOutlineArrowLeft className="text-lg" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <FaAnchor className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Deewaraya</h1>
                  <p className="text-[10px] text-blue-300 tracking-widest uppercase">User Management</p>
                </div>
              </div>
            </div>

            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-blue-100 text-sm font-medium transition-all"
            >
              <HiOutlineRefresh className={`${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-3">
            <HiOutlineUserGroup className="text-cyan-400 text-4xl" />
            User Management
          </h2>
          <p className="text-blue-200/70 text-sm">
            Manage all registered users, view details, and control access
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Users" 
            value={totalUsers} 
            icon={HiOutlineUsers}
            color="from-blue-500 to-cyan-500"
            iconBg="bg-blue-500/10"
            iconColor="text-blue-400"
          />
          <StatCard 
            title="Boat Owners" 
            value={boatOwnersCount} 
            icon={IoBoatOutline}
            color="from-cyan-500 to-teal-500"
            iconBg="bg-cyan-500/10"
            iconColor="text-cyan-400"
          />
          <StatCard 
            title="Boat Drivers" 
            value={boatDriversCount} 
            icon={MdOutlineDirectionsBoat}
            color="from-green-500 to-emerald-500"
            iconBg="bg-green-500/10"
            iconColor="text-green-400"
          />
          <StatCard 
            title="Deleted Users" 
            value={deletedCount} 
            icon={HiOutlineUserRemove}
            color="from-red-500 to-rose-500"
            iconBg="bg-red-500/10"
            iconColor="text-red-400"
          />
        </div>

        {/* Filters */}
        <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            
            {/* Search */}
            <div className="relative flex-1">
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/50 text-lg" />
              <input
                type="text"
                placeholder="Search by name, email, or NIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-blue-200/40 focus:outline-none focus:border-cyan-400/50 transition-all"
              />
            </div>

            {/* Role Filter - Only 3 options */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400/50 transition-all cursor-pointer min-w-[180px]"
            >
              <option value="all" className="bg-slate-800">All Users</option>
              <option value="boat_owner" className="bg-slate-800">Boat Owners</option>
              <option value="boat_driver" className="bg-slate-800">Boat Drivers</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
              <p className="text-blue-200 text-sm">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <HiOutlineUsers className="text-4xl text-blue-300/50" />
              </div>
              <p className="text-white font-semibold mb-1">No users found</p>
              <p className="text-blue-200/60 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/70 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/70 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/70 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/70 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/70 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-blue-200/70 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map(user => (
                    <tr key={user._id} className="hover:bg-white/[0.03] transition-colors">
                      
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
                            {user.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">{user.name}</p>
                            <p className="text-xs text-blue-200/60">NIC: {user.nic || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-white">{user.email}</p>
                        <p className="text-xs text-blue-200/60">{user.phone || 'N/A'}</p>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <UserStatusBadge status={user.status} />
                      </td>

                      {/* Joined */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-white">
                          {new Date(user.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-xs text-blue-200/60">
                          {user.lastLogin 
                            ? `Last: ${new Date(user.lastLogin).toLocaleDateString()}` 
                            : 'Never logged in'
                          }
                        </p>
                      </td>

                      {/* Actions - NO VERIFY BUTTON */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          
                          <ActionButton
                            icon={HiOutlineEye}
                            color="blue"
                            title="View Details"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetails(true);
                            }}
                          />

                          <ActionButton
                            icon={HiOutlineMail}
                            color="purple"
                            title="Send Email"
                            onClick={() => {
                              setActionUserId(user._id);
                              setShowMessageModal(true);
                            }}
                          />

                          {user.status === 'active' ? (
                            <ActionButton
                              icon={HiOutlineBan}
                              color="orange"
                              title="Ban User"
                              onClick={() => {
                                setActionUserId(user._id);
                                setShowBanModal(true);
                              }}
                            />
                          ) : user.status === 'banned' ? (
                            <ActionButton
                              icon={HiOutlineRefresh}
                              color="green"
                              title="Unban"
                              onClick={() => unbanUser(user._id)}
                            />
                          ) : null}

                          <ActionButton
                            icon={HiOutlineTrash}
                            color="red"
                            title="Delete"
                            onClick={() => deleteUser(user._id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && filteredUsers.length > 0 && (
          <div className="mt-4 text-center text-sm text-blue-200/60">
            Showing <span className="text-cyan-300 font-semibold">{filteredUsers.length}</span> of <span className="text-cyan-300 font-semibold">{users.length}</span> users
          </div>
        )}
      </main>

      {/* User Details Modal */}
      {showDetails && selectedUser && (
        <UserDetailsModal 
          user={selectedUser}
          onClose={() => setShowDetails(false)}
        />
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <MessageModal
          messageData={messageData}
          setMessageData={setMessageData}
          onSend={handleSendMessage}
          onClose={() => {
            setShowMessageModal(false);
            setMessageData({ subject: '', message: '' });
          }}
        />
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <BanModal
          reason={banReason}
          setReason={setBanReason}
          onConfirm={handleBanUser}
          onClose={() => {
            setShowBanModal(false);
            setBanReason('');
          }}
        />
      )}

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

// ============ COMPONENTS ============

// Stat Card
const StatCard = ({ title, value, icon: Icon, color, iconBg, iconColor }) => (
  <div className="group relative bg-white/[0.05] hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-2xl p-5 transition-all hover:-translate-y-1 overflow-hidden">
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
    <div className="relative">
      <div className={`w-11 h-11 ${iconBg} border border-white/10 rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`text-xl ${iconColor}`} />
      </div>
      <p className="text-blue-200/60 text-xs mb-1 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

// Action Button
const ActionButton = ({ icon: Icon, color, title, onClick }) => {
  const colors = {
    blue: 'text-blue-400 hover:bg-blue-500/20 hover:text-blue-300',
    green: 'text-green-400 hover:bg-green-500/20 hover:text-green-300',
    purple: 'text-purple-400 hover:bg-purple-500/20 hover:text-purple-300',
    orange: 'text-orange-400 hover:bg-orange-500/20 hover:text-orange-300',
    red: 'text-red-400 hover:bg-red-500/20 hover:text-red-300'
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-all ${colors[color]}`}
    >
      <Icon className="text-lg" />
    </button>
  );
};

// Role Badge
const RoleBadge = ({ role }) => {
  const styles = {
    admin: 'bg-red-500/20 text-red-300 border-red-500/30',
    owner: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    driver: 'bg-green-500/20 text-green-300 border-green-500/30',
    buyer: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  };

  const labels = {
    admin: 'Admin',
    owner: 'Boat Owner',
    driver: 'Boat Driver',
    driver: 'Boat Driver',
    buyer: 'Buyer'
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${styles[role] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
      {labels[role] || role}
    </span>
  );
};

// Status Badge
const UserStatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-green-500/20 text-green-300 border-green-500/30',
    pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    banned: 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border uppercase ${styles[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
      {status || 'active'}
    </span>
  );
};

// User Details Modal
const UserDetailsModal = ({ user, onClose }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      
      {/* Header */}
      <div className="relative p-6 bg-gradient-to-br from-sky-500/20 to-blue-600/20 border-b border-white/10 rounded-t-3xl">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-all"
        >
          <HiOutlineX />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/30">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
            <p className="text-blue-200 text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <RoleBadge role={user.role} />
              <UserStatusBadge status={user.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        
        {/* Personal Info */}
        <section>
          <h3 className="text-sm font-bold text-cyan-300 mb-3 uppercase tracking-wider flex items-center gap-2">
            <HiOutlineIdentification /> Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoField icon={HiOutlineUsers} label="Full Name" value={user.name} />
            <InfoField icon={HiOutlineMail} label="Email" value={user.email} />
            <InfoField icon={HiOutlinePhone} label="Phone" value={user.phone} />
            <InfoField icon={HiOutlineIdentification} label="NIC" value={user.nic} />
            <InfoField icon={HiOutlineLocationMarker} label="Address" value={user.address} />
            <InfoField icon={HiOutlineCalendar} label="Date of Birth" value={user.dob ? new Date(user.dob).toLocaleDateString() : null} />
          </div>
        </section>

        {/* Account Info */}
        <section>
          <h3 className="text-sm font-bold text-cyan-300 mb-3 uppercase tracking-wider flex items-center gap-2">
            <HiOutlineShieldCheck /> Account Information
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoField icon={HiOutlineCalendar} label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
            <InfoField icon={HiOutlineClock} label="Last Login" value={user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'} />
            <InfoField icon={IoBoatOutline} label="Total Boats" value={user.stats?.boats || 0} />
            <InfoField icon={HiOutlineShieldCheck} label="Account Status" value={user.status || 'active'} />
          </div>
        </section>

        {/* Ban Info (if banned) */}
        {user.status === 'banned' && user.banReason && (
          <section>
            <h3 className="text-sm font-bold text-red-300 mb-3 uppercase tracking-wider flex items-center gap-2">
              <HiOutlineBan /> Ban Information
            </h3>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-200 text-sm mb-1"><strong>Reason:</strong> {user.banReason}</p>
              {user.bannedAt && (
                <p className="text-red-200/70 text-xs">Banned on: {new Date(user.bannedAt).toLocaleString()}</p>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10 flex justify-end gap-3">
        <button 
          onClick={onClose}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium transition-all"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

// Info Field
const InfoField = ({ icon: Icon, label, value }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
    <p className="text-blue-200/60 text-xs mb-1 flex items-center gap-1.5">
      {Icon && <Icon className="text-sm" />}
      {label}
    </p>
    <p className="text-white text-sm font-medium truncate">{value || 'N/A'}</p>
  </div>
);

// Message Modal
const MessageModal = ({ messageData, setMessageData, onSend, onClose }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl">
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <HiOutlineMail className="text-cyan-400" />
          Send Message
        </h3>
        <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white">
          <HiOutlineX />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-blue-100 mb-2">Subject</label>
          <input
            type="text"
            value={messageData.subject}
            onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
            placeholder="Enter subject..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-blue-200/40 focus:outline-none focus:border-cyan-400/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-100 mb-2">Message</label>
          <textarea
            rows="6"
            value={messageData.message}
            onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
            placeholder="Type your message here..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-blue-200/40 focus:outline-none focus:border-cyan-400/50 resize-none"
          />
        </div>
      </div>

      <div className="p-6 border-t border-white/10 flex justify-end gap-3">
        <button onClick={onClose} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium">
          Cancel
        </button>
        <button 
          onClick={onSend} 
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30"
        >
          <HiOutlinePaperAirplane />
          Send Message
        </button>
      </div>
    </div>
  </div>
);

// Ban Modal
const BanModal = ({ reason, setReason, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-md w-full shadow-2xl">
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <HiOutlineBan className="text-red-400" />
          Ban User
        </h3>
        <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white">
          <HiOutlineX />
        </button>
      </div>

      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
          <p className="text-red-200 text-xs">⚠️ This user will lose access to the system immediately.</p>
        </div>
        <label className="block text-sm font-medium text-blue-100 mb-2">Ban Reason *</label>
        <textarea
          rows="4"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter the reason for banning this user..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-blue-200/40 focus:outline-none focus:border-red-400/50 resize-none"
        />
      </div>

      <div className="p-6 border-t border-white/10 flex justify-end gap-3">
        <button onClick={onClose} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium">
          Cancel
        </button>
        <button 
          onClick={onConfirm}
          disabled={!reason.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-500/30"
        >
          <HiOutlineBan />
          Ban User
        </button>
      </div>
    </div>
  </div>
);

export default AdminUsers;