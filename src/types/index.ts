// ============================================
// DTOs y Tipos para la API
// ============================================

// Base
export interface BaseDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

// Product DTOs
export interface CreateProductDto {
  name: string;
  typeId: string;
  stateId: string;
  baseUnit: 'KG' | 'G' | 'L' | 'ML';
  dosePerHectareMin?: number;
  dosePerHectareMax?: number;
  concentration?: number;
}

export interface UpdateProductDto {
  name?: string;
  typeId?: string;
  stateId?: string;
  baseUnit?: 'KG' | 'G' | 'L' | 'ML';
  dosePerHectareMin?: number;
  dosePerHectareMax?: number;
  concentration?: number;
}

export interface ProductDto extends BaseDto {
  name: string;
  typeId: string;
  stateId: string;
  baseUnit: 'KG' | 'G' | 'L' | 'ML';
  dosePerHectareMin?: number;
  dosePerHectareMax?: number;
  concentration?: number;
  type?: { id: string; name: string };
  state?: { id: string; name: string };
}

// Lot DTOs
export interface CreateLotDto {
  productId: string;
  entryDate?: string;
  expiryDate?: string;
  supplier?: string;
  initialStock: number;
  lotCode?: string;
  containerType?: string;
  containerCapacity?: number;
}

export interface UpdateLotDto {
  expiryDate?: string;
  supplier?: string;
  initialStock?: number;
  lotCode?: string;
}

export interface LotDto extends BaseDto {
  productId: string;
  entryDate: string;
  expiryDate?: string;
  supplier?: string;
  initialStock: number;
  lotCode?: string;
  containerTypeId?: string;
  containerCapacity?: number;
  product?: ProductDto;
  containerType?: { id: string; name: string };
}

// Field DTOs
export interface CreateFieldDto {
  name: string;
  area: number;
  location?: string;
}

export interface UpdateFieldDto {
  name?: string;
  area?: number;
  location?: string;
}

export interface FieldDto extends BaseDto {
  name: string;
  area: number;
  location?: string;
}

// Application DTOs
export interface CreateApplicationDto {
  fieldId: string;
  type: 'FUMIGACION' | 'SIEMBRA';
  date?: string;
  waterAmount?: number;
  notes?: string;
  products?: {
    productId: string;
    dosePerHectare?: number;
    concentration?: number;
    quantityUsed: number;
    lots?: { lotId: string; quantityUsed: number }[];
  }[];
  lots?: { lotId: string; quantityUsed: number }[];
}

export interface ApplicationDto extends BaseDto {
  fieldId: string;
  type: 'FUMIGACION' | 'SIEMBRA';
  date: string;
  waterAmount?: number;
  notes?: string;
  field?: FieldDto;
  applicationProducts?: ApplicationProductDto[];
  applicationLots?: ApplicationLotDto[];
}

export interface ApplicationProductDto {
  id: string;
  applicationId: string;
  productId: string;
  dosePerHectare?: number;
  concentration?: number;
  quantityUsed: number;
  product?: ProductDto;
}

export interface ApplicationLotDto {
  id: string;
  applicationId: string;
  lotId: string;
  quantityUsed: number;
  lot?: LotDto;
}

// Movement DTOs
export interface CreateMovementDto {
  productId: string;
  lotId?: string;
  type: 'ENTRADA' | 'SALIDA';
  quantity: number;
  notes?: string;
}

export interface MovementDto extends BaseDto {
  productId: string;
  lotId?: string;
  type: 'ENTRADA' | 'SALIDA';
  quantity: number;
  notes?: string;
  product?: ProductDto;
  lot?: LotDto;
}

// Container DTOs
export interface CreateContainerDto {
  lotId: string;
  typeId: string;
  capacity: number;
  unit: 'KG' | 'G' | 'L' | 'ML';
  status?: 'DISPONIBLE' | 'EN_USO' | 'VACIO';
  name?: string;
  notes?: string;
}

export interface UpdateContainerDto {
  status?: 'DISPONIBLE' | 'EN_USO' | 'VACIO';
  name?: string;
  notes?: string;
}

export interface ConsumeContainerDto {
  quantity: number;
  notes?: string;
}

export interface ContainerDto extends BaseDto {
  lotId: string;
  typeId: string;
  capacity: number;
  unit: 'KG' | 'G' | 'L' | 'ML';
  status: 'DISPONIBLE' | 'EN_USO' | 'VACIO';
  name?: string;
  notes?: string;
  lot?: LotDto;
  type?: { id: string; name: string };
  currentQuantity?: number;
}

// Tancada DTOs
export interface CreateTancadaDto {
  date?: string;
  tankCapacity: number;
  waterAmount: number;
  notes?: string;
  products: {
    productId: string;
    concentration?: number;
    quantity: number;
    lots?: { lotId: string; quantityUsed: number }[];
  }[];
  fields: {
    fieldId: string;
    hectaresTreated: number;
    productUsed: number;
  }[];
}

export interface TancadaDto extends BaseDto {
  date: string;
  tankCapacity: number;
  waterAmount: number;
  notes?: string;
  tancadaProducts?: TancadaProductDto[];
  tancadaFields?: TancadaFieldDto[];
}

export interface TancadaProductDto {
  id: string;
  tancadaId: string;
  productId: string;
  concentration?: number;
  quantity: number;
  product?: ProductDto;
}

export interface TancadaFieldDto {
  id: string;
  tancadaId: string;
  fieldId: string;
  hectaresTreated: number;
  productUsed: number;
  field?: FieldDto;
}

// Tank DTOs
export interface CreateTankDto {
  name: string;
  capacity: number;
}

export interface UpdateTankDto {
  name?: string;
  capacity?: number;
}

export interface TankDto extends BaseDto {
  name: string;
  capacity: number;
}

// Settings DTOs
export interface CreateSettingDto {
  name: string;
}

// Sync DTOs
export interface SyncDataDto {
  products?: ProductDto[];
  lots?: LotDto[];
  fields?: FieldDto[];
  applications?: ApplicationDto[];
  movements?: MovementDto[];
  containers?: ContainerDto[];
  tancadas?: TancadaDto[];
  tanks?: TankDto[];
}

export interface SyncResultDto {
  success: boolean;
  serverData: SyncDataDto;
  message?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
