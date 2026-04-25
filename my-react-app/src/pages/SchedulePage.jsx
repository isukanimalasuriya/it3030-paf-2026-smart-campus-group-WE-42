import { useState, useEffect, useMemo } from "react";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

function ScheduleCard({ booking }) {
  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  
  const timeString = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  
  return (
    <div className="flex gap-4 relative">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 bg-indigo-500 rounded-full z-10 ring-4 ring-indigo-50 mt-1.5" />
        <div className="w-0.5 bg-slate-200 flex-1 my-1" />
      </div>
      
      {/* Card Content */}
      <div className="flex-1 pb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-slate-800">{booking.resourceName}</h3>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Confirmed
            </span>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-indigo-900">{timeString}</span>
            </div>
            
            {booking.expectedAttendees && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{booking.expectedAttendees} attendees</span>
              </div>
            )}
          </div>
          
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <span className="font-semibold block mb-1">Purpose:</span>
            {booking.purpose}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchSchedule = async () => {
      try {
        const response = await api.get("/api/bookings/my");
        // Only show APPROVED upcoming/past bookings
        const approved = response.data
          .filter(b => b.status === "APPROVED")
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        setBookings(approved);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSchedule();
  }, [isAuthenticated]);

  // Group bookings by date
  const groupedBookings = useMemo(() => {
    const groups = {};
    bookings.forEach(booking => {
      const dateObj = new Date(booking.startTime);
      // Create a date string like "Mon, Apr 25, 2026"
      const dateKey = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(booking);
    });
    return groups;
  }, [bookings]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <div className="text-slate-500 font-medium animate-pulse">Loading your schedule...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Schedule</h1>
        <p className="mt-2 text-slate-500">
          Your upcoming confirmed bookings and activities across the campus.
        </p>
      </div>

      {Object.keys(groupedBookings).length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center ring-1 ring-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No upcoming events</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            You don't have any confirmed bookings yet. Head over to the Resources page to book a space.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedBookings).map(([dateLabel, dayBookings]) => (
            <div key={dateLabel}>
              <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-slate-100/80 backdrop-blur-md mb-6">
                <h2 className="text-sm font-bold tracking-widest uppercase text-slate-500">
                  {dateLabel}
                </h2>
              </div>
              
              <div className="pl-2">
                {dayBookings.map(booking => (
                  <ScheduleCard key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
