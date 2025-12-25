
export enum UserRole {
  ADMIN = 'ADMIN',
  SECURITY = 'SECURITY',
  VISITOR = 'VISITOR'
}

export enum PassStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT'
}

export enum PassType {
  VISITOR = 'VISITOR',
  MATERIAL = 'MATERIAL',
  VEHICLE = 'VEHICLE'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface GatePass {
  id: string;
  visitorId: string;
  visitorName: string;
  visitorEmail: string;
  purpose: string;
  department: string;
  type: PassType;
  status: PassStatus;
  requestedAt: number;
  validDate: string;
  checkInTime?: number;
  checkOutTime?: number;
  photoUrl?: string;
  aiVerification?: string;
}
