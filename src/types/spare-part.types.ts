export interface SparePartData {
  id?: number
  name?: string
  stock?: number
}

export interface SparePart {
  id?: number
  name?: string
  stock?: number
  createdAt?: string
  updatedAt?: string
}
export interface CreateSparePartEntry {
  sparePartId: number
  quantity: number
  price: number
}
