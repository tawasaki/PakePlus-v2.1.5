
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
}

export enum PetStatus {
  IN_STOCK = 'IN_STOCK', // 在库
  SOLD = 'SOLD',         // 已售
  DECEASED = 'DECEASED'  // 死亡
}

export interface Pet {
  id: string;           // 产品编号
  barcode: string;      // 条形码
  species: string;      // 物种
  gene: string;         // 基因
  weight: number;       // 体重 (kg)
  feedingTime: string;  // 投喂时间
  cabinetId: string;    // 宠物柜号
  status: PetStatus;    // 状态
  createdAt: number;
}

export type View = 'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'INVENTORY' | 'SEARCH' | 'SCANNER' | 'USER_MANAGEMENT' | 'PET_DETAIL';
