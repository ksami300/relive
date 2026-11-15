export class ApiResponse {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data: any;
  public readonly timestamp: string;

  constructor(success: boolean, message: string, data: any = null) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success(message: string, data: any = null) {
    return new ApiResponse(true, message, data);
  }

  static error(message: string, data: any = null) {
    return new ApiResponse(false, message, data);
  }
}
