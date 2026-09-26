import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../services/api';
import {
  HiOutlineSearch,
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
  HiOutlineCheckCircle,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineCash
} from 'react-icons/hi';
import { FaAnchor } from 'react-icons/fa';
import { IoBoatOutline } from 'react-icons/io5';
import { MdOutlineDirectionsBoat, MdOutlineWaves } from 'react-icons/md';

const AdminBoats = () => {
  const navigate = useNavigate();
  const [boats, setBoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionBoatId, setActionBoatId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [deletedCount, setDeletedCount] = useState(0);

  useEffect(() => {
    fetchBoats();
    const stored = localStorage.getItem('deletedBoatsCount');
    if (stored) setDeletedCount(parseInt(stored));
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchBoats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE}/admin/boats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
      setBoats(response.data.boats || []);
    } catch (err) {
      console.error(err);
      showNotification('Failed to fetch boats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const approveBoat = async (boatId) => {
    try {
      await axios.put(
        `${API_BASE}/admin/boats/${boatId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        }
      );
      showNotification('Boat approved successfully', 'success');
      fetchBoats();
    } catch (err) {
      showNotification('Approval failed', 'error');
    }
  };

  const handleSuspendBoat = async () => {
    try {
      await axios.put(
        `${API_BASE}/admin/boats/${actionBoatId}/suspend`,
        { reason: suspendReason },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        }
      );
      showNotification('Boat suspended successfully', 'success');
      setShowSuspendModal(false);
      setSuspendReason('');
      fetchBoats();
    } catch (err) {
      showNotification('Suspension failed', 'error');
    }
  };

  const unsuspendBoat = async (boatId) => {
    try {
      await axios.put(
        `${API_BASE}/admin/boats/${boatId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        }
      );
      showNotification('Boat reactivated successfully', 'success');
      fetchBoats();
    } catch (err) {
      showNotification('Reactivation failed', 'error');
    }
  };

  const deleteBoat = async (boatId) => {
    if (!window.confirm('Delete this boat permanently? This cannot be undone.')) return;
    
    try {
      await axios.delete(
        `${API_BASE}/admin/boats/${boatId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        }
      );
      
      const newCount = deletedCount + 1;
      setDeletedCount(newCount);
      localStorage.setItem('deletedBoatsCount', newCount.toString());
      
      showNotification('Boat deleted successfully', 'success');
      fetchBoats();
    } catch (err) {
      showNotification('Deletion failed', 'error');
    }
  };

// Filter boats
const filteredBoats = boats.filter(boat => {
  const matchesSearch = 
    boat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    boat.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    boat.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase());
  
  let matchesStatus = true;
  if (statusFilter === 'active') {
    matchesStatus = boat.status === 'active';
  } else if (statusFilter === 'non_active') {
    matchesStatus = boat.status === 'inactive' || boat.status === 'suspended';
  } else if (statusFilter === 'maintenance') {
    matchesStatus = boat.status === 'maintenance';
  }
  
  return matchesSearch && matchesStatus;
});

// Calculate counts
const totalBoats = boats.length;
const activeBoats = boats.filter(b => b.status === 'active').length;
const nonActiveBoats = boats.filter(b => b.status === 'inactive' || b.status === 'suspended').length;
const maintenanceBoats = boats.filter(b => b.status === 'maintenance').length;

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
                  <p className="text-[10px] text-blue-300 tracking-widest uppercase">Boat Management</p>
                </div>
              </div>
            </div>

            <button
              onClick={fetchBoats}
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
            <IoBoatOutline className="text-cyan-400 text-4xl" />
            Boat Management
          </h2>
          <p className="text-blue-200/70 text-sm">
            Manage all registered fishing boats, track locations, and monitor status
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard 
            title="Total Boats" 
            value={totalBoats} 
            icon={IoBoatOutline}
            color="from-blue-500 to-cyan-500"
            iconBg="bg-blue-500/10"
            iconColor="text-blue-400"
          />
          <StatCard 
            title="Active" 
            value={activeBoats} 
            icon={HiOutlineCheckCircle}
            color="from-green-500 to-emerald-500"
            iconBg="bg-green-500/10"
            iconColor="text-green-400"
          />
          <StatCard 
            title="Non Active" 
            value={nonActiveBoats} 
            icon={HiOutlineBan}
            color="from-gray-500 to-slate-500"
            iconBg="bg-gray-500/10"
            iconColor="text-gray-400"
          />
          <StatCard 
            title="Maintenance" 
            value={maintenanceBoats} 
            icon={HiOutlineExclamation}
            color="from-yellow-500 to-orange-500"
            iconBg="bg-yellow-500/10"
            iconColor="text-yellow-400"
          />
          <StatCard 
            title="Deleted Boats" 
            value={deletedCount} 
            icon={HiOutlineTrash}
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
                placeholder="Search by boat name, owner, or registration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-blue-200/40 focus:outline-none focus:border-cyan-400/50 transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400/50 transition-all cursor-pointer min-w-[180px]"
            >
              <option value="all" className="bg-slate-800">All Boats</option>
              <option value="active" className="bg-slate-800">Active</option>
              <option value="non_active" className="bg-slate-800">Non Active</option>
              <option value="maintenance" className="bg-slate-800">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Boats Table */}
        <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
              <p className="text-blue-200 text-sm">Loading boats...</p>
            </div>
          ) : filteredBoats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <IoBoatOutline className="text-4xl text-blue-300/50" />
              </div>
              <p className="text-white font-semibold mb-1">No boats found</p>
              <p className="text-blue-200/60 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/70 uppercase tracking-wider">Boat Info</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/70 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/70 uppercase tracking-wider">Registration</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/70 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/70 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-blue-200/70 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBoats.map(boat => (
                    <tr key={boat._id} className="hover:bg-white/[0.03] transition-colors">
                      
                      {/* Boat Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {boat.image ? (
                            <img 
                              src={boat.image} 
                              alt={boat.name}
                              className="w-12 h-12 rounded-xl object-cover border border-white/10"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                              <IoBoatOutline className="text-white text-xl" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-white text-sm">{boat.name || 'Unnamed'}</p>
                            <p className="text-xs text-blue-200/60 capitalize">{boat.type || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-white">{boat.owner?.name || 'N/A'}</p>
                        <p className="text-xs text-blue-200/60">{boat.owner?.phone || 'No phone'}</p>
                      </td>

                      {/* Registration */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-white font-mono">{boat.registrationNumber || 'N/A'}</p>
                        <p className="text-xs text-blue-200/60">
                          {boat.licenseExpiry 
                            ? `Expires: ${new Date(boat.licenseExpiry).toLocaleDateString()}` 
                            : 'No license'
                          }
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={boat.status} />
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        {boat.currentLocation ? (
                          <div>
                            <p className="text-sm text-white flex items-center gap-1">
                              <HiOutlineLocationMarker className="text-cyan-400" />
                              {boat.currentLocation.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-blue-200/60">
                              {boat.lastActive ? new Date(boat.lastActive).toLocaleString() : ''}
                            </p>
                          </div>
                        ) : (
                          <span className="text-blue-200/40 text-sm">No location data</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          
                          <ActionButton
                            icon={HiOutlineEye}
                            color="blue"
                            title="View Details"
                            onClick={() => {
                              setSelectedBoat(boat);
                              setShowDetails(true);
                            }}
                          />

                          {boat.status === 'pending' && (
                            <ActionButton
                              icon={HiOutlineCheckCircle}
                              color="green"
                              title="Approve Boat"
                              onClick={() => approveBoat(boat._id)}
                            />
                          )}

                          {boat.status === 'active' && (
                            <ActionButton
                              icon={HiOutlineBan}
                              color="orange"
                              title="Suspend Boat"
                              onClick={() => {
                                setActionBoatId(boat._id);
                                setShowSuspendModal(true);
                              }}
                            />
                          )}

                          {boat.status === 'suspended' && (
                            <ActionButton
                              icon={HiOutlineRefresh}
                              color="green"
                              title="Reactivate"
                              onClick={() => unsuspendBoat(boat._id)}
                            />
                          )}

                          <ActionButton
                            icon={HiOutlineTrash}
                            color="red"
                            title="Delete"
                            onClick={() => deleteBoat(boat._id)}
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
        {!loading && filteredBoats.length > 0 && (
          <div className="mt-4 text-center text-sm text-blue-200/60">
            Showing <span className="text-cyan-300 font-semibold">{filteredBoats.length}</span> of <span className="text-cyan-300 font-semibold">{boats.length}</span> boats
          </div>
        )}
      </main>

      {/* Boat Details Modal */}
      {showDetails && selectedBoat && (
        <BoatDetailsModal 
          boat={selectedBoat}
          onClose={() => setShowDetails(false)}
        />
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <SuspendModal
          reason={suspendReason}
          setReason={setSuspendReason}
          onConfirm={handleSuspendBoat}
          onClose={() => {
            setShowSuspendModal(false);
            setSuspendReason('');
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

//  COMPONENTS 
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

// Status Badge
const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-green-500/20 text-green-300 border-green-500/30',
    inactive: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    suspended: 'bg-red-500/20 text-red-300 border-red-500/30',
    maintenance: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    pending: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
  };

  const labels = {
    active: 'ACTIVE',
    inactive: 'NON-ACTIVE',
    suspended: 'NON-ACTIVE',
    maintenance: 'MAINTENANCE',
    pending: 'PENDING'
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border uppercase ${styles[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
      {labels[status] || status || 'Unknown'}
    </span>
  );
};

// Boat Details Modal
const BoatDetailsModal = ({ boat, onClose }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      
      {/* Header */}
      <div className="relative p-6 bg-gradient-to-br from-sky-500/20 to-blue-600/20 border-b border-white/10 rounded-t-3xl">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-all"
        >
          <HiOutlineX />
        </button>
        <div className="flex items-center gap-4">
          {boat.image ? (
            <img 
              src={boat.image} 
              alt={boat.name}
              className="w-20 h-20 rounded-2xl object-cover border border-white/20"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <IoBoatOutline className="text-white text-3xl" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">{boat.name || 'Unnamed Boat'}</h2>
            <p className="text-blue-200 text-sm">{boat.registrationNumber || 'No registration'}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={boat.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        
        {/* Boat Information */}
        <section>
          <h3 className="text-sm font-bold text-cyan-300 mb-3 uppercase tracking-wider flex items-center gap-2">
            <IoBoatOutline /> Boat Information
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoField icon={HiOutlineIdentification} label="Registration" value={boat.registrationNumber} />
            <InfoField icon={MdOutlineDirectionsBoat} label="Type" value={boat.type} />
            <InfoField icon={HiOutlineChartBar} label="Length" value={boat.length ? `${boat.length}m` : null} />
            <InfoField icon={HiOutlineChartBar} label="Capacity" value={boat.capacity ? `${boat.capacity} tons` : null} />
            <InfoField icon={HiOutlineDocumentText} label="Engine" value={boat.engine} />
            <InfoField icon={HiOutlineCalendar} label="Year" value={boat.year} />
          </div>
        </section>

        {/* Owner Information */}
        <section>
          <h3 className="text-sm font-bold text-cyan-300 mb-3 uppercase tracking-wider flex items-center gap-2">
            <HiOutlineUser /> Owner Information
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoField icon={HiOutlineUser} label="Name" value={boat.owner?.name} />
            <InfoField icon={HiOutlinePhone} label="Phone" value={boat.owner?.phone} />
            <InfoField icon={HiOutlineMail} label="Email" value={boat.owner?.email} />
            <InfoField icon={HiOutlineIdentification} label="NIC" value={boat.owner?.nic} />
          </div>
        </section>

        {/* Documents */}
        {boat.documents && (
          <section>
            <h3 className="text-sm font-bold text-cyan-300 mb-3 uppercase tracking-wider flex items-center gap-2">
              <HiOutlineDocumentText /> Documents
            </h3>
            <div className="space-y-2">
              <DocumentLink label="Boat License" url={boat.documents?.license} />
              <DocumentLink label="Insurance" url={boat.documents?.insurance} />
              <DocumentLink label="Fishing Permit" url={boat.documents?.permit} />
            </div>
          </section>
        )}

        {/* Statistics */}
        <section>
          <h3 className="text-sm font-bold text-cyan-300 mb-3 uppercase tracking-wider flex items-center gap-2">
            <HiOutlineChartBar /> Statistics
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <StatBox icon={MdOutlineWaves} label="Total Trips" value={boat.stats?.totalTrips || 0} />
            <StatBox icon={IoBoatOutline} label="Total Catch" value={`${boat.stats?.totalCatch || 0} kg`} />
            <StatBox icon={HiOutlineCash} label="Revenue" value={`$${boat.stats?.revenue || 0}`} />
          </div>
        </section>
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

// Document Link
const DocumentLink = ({ label, url }) => (
  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
    <span className="text-sm text-blue-100 flex items-center gap-2">
      <HiOutlineDocumentText className="text-cyan-400" />
      {label}
    </span>
    {url ? (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-1"
      >
        View →
      </a>
    ) : (
      <span className="text-blue-200/40 text-sm">Not uploaded</span>
    )}
  </div>
);

// Stat Box
const StatBox = ({ icon: Icon, label, value }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
    {Icon && <Icon className="text-cyan-400 text-2xl mx-auto mb-2" />}
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-xs text-blue-200/60 mt-1">{label}</p>
  </div>
);

// Suspend Modal
const SuspendModal = ({ reason, setReason, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-md w-full shadow-2xl">
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <HiOutlineBan className="text-orange-400" />
          Suspend Boat
        </h3>
        <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white">
          <HiOutlineX />
        </button>
      </div>

      <div className="p-6">
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-4">
          <p className="text-orange-200 text-xs">⚠️ This boat will be temporarily disabled from operations.</p>
        </div>
        <label className="block text-sm font-medium text-blue-100 mb-2">Suspension Reason *</label>
        <textarea
          rows="4"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter the reason for suspending this boat..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-blue-200/40 focus:outline-none focus:border-orange-400/50 resize-none"
        />
      </div>

      <div className="p-6 border-t border-white/10 flex justify-end gap-3">
        <button onClick={onClose} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium">
          Cancel
        </button>
        <button 
          onClick={onConfirm}
          disabled={!reason.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/30"
        >
          <HiOutlineBan />
          Suspend Boat
        </button>
      </div>
    </div>
  </div>
);

export default AdminBoats;