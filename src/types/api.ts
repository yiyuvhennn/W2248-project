export interface ApiErrorDetail {
  field: string
  message: string
}

export interface ApiErrorShape {
  error: string
  message: string
  details?: ApiErrorDetail[]
}
