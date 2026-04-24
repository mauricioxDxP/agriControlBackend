// ============================================
// DTOs and Types for the API
// ============================================

// Dose types
export type DoseType = 'PER_HECTARE' | 'CONCENTRATION';
export type DoseUnit = 'BASE_UNIT' | 'CC' | 'ML' | 'G' | 'KG' | 'L';

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
  productCode?: string;
  genericName?: string;
  typeId: string;
  stateId: string;
  baseUnit: 'KG' | 'G' | 'L' | 'ML' | 'CC';
  doseType?: 'PER_HECTARE' | 'CONCENTRATION';
  doseUnit?: 'BASE_UNIT' | 'CC' | 'ML' | 'G' | 'KG' | 'L';
  dosePerHectareMin?: number | null;
  dosePerHectareMax?: number | null;
  concentrationPerLiter?: number | null;
  concentration?: number | null;
}

export interface UpdateProductDto {
  name?: string;
  productCode?: string | null;
  genericName?: string | null;
  typeId?: string;
  stateId?: string;
  baseUnit?: 'KG' | 'G' | 'L' | 'ML' | 'CC';
  doseType?: 'PER_HECTARE' | 'CONCENTRATION';
  doseUnit?: 'BASE_UNIT' | 'CC' | 'ML' | 'G' | 'KG' | 'L';
  dosePerHectareMin?: number | null;
  dosePerHectareMax?: number | null;
  concentrationPerLiter?: number | null;
  concentration?: number | null;
}

export interface ProductDto extends BaseDto {
  name: string;
  productCode?: string;
  genericName?: string;
  typeId: string;
  stateId: string;
  baseUnit: 'KG' | 'G' | 'L' | 'ML' | 'CC';
  doseType?: 'PER_HECTARE' | 'CONCENTRATION';
  doseUnit?: 'BASE_UNIT' | 'CC' | 'ML' | 'G' | 'KG' | 'L';
  dosePerHectareMin?: number;
  dosePerHectareMax?: number;
  concentrationPerLiter?: number;
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

// Terrain DTOs
export interface CreateTerrainDto {
  name: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UpdateTerrainDto {
  name?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface TerrainDto extends BaseDto {
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  fields?: { id: string; name: string; area: number }[];
}

// Field DTOs
export interface CreateFieldDto {
  name: string;
  area: number;
  terrainId: string;
}

export interface UpdateFieldDto {
  name?: string;
  area?: number;
  terrainId?: string;
}

export interface FieldDto extends BaseDto {
  name: string;
  area: number;
  terrainId: string;
  terrain?: { id: string; name: string; location?: string };
  plantings?: PlantingDto[];
}

// Planting DTOs
export interface CreatePlantingDto {
  fieldId: string;
  productId: string;
  startDate: string;
  notes?: string;
}

export interface UpdatePlantingDto {
  endDate?: string;
  notes?: string;
}

export interface PlantingDto extends BaseDto {
  fieldId: string;
  productId: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  field?: { id: string; name: string };
  product?: { id: string; name: string; typeId: string };
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
    concentrationPerLiter?: number;
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
  concentrationPerLiter?: number;
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
  tancadaId?: string;
  applicationId?: string;
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
  plantings?: PlantingDto[];
  terrains?: TerrainDto[];
  applications?: ApplicationDto[];
  movements?: MovementDto[];
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