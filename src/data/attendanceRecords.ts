// Attendance record type for persistence
export interface AttendanceRecord {
  id: string;
  youthId: string;
  youthName: string;
  programId: string;
  programName: string;
  date: string;
  attendanceStatus: 'present' | 'late' | 'absent' | 'excused';
  engagementLevel: 'very_high' | 'high' | 'medium' | 'low' | 'none';
  participatedInActivity: boolean;
  activityNotes?: string;
  followUpNotes?: string;
  recordedAt: string;
  recordedBy?: string;
}

// Storage keys
export const STORAGE_KEYS = {
  YOUTHS: 'ivula_canopy_people',
  PROGRAMS: 'ivula_canopy_programs',
  ATTENDANCE_RECORDS: 'ivula_canopy_attendance',
} as const;
