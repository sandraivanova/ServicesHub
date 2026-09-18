import {HttpClient, HttpParams} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {IUser} from "@dnevnica/shared";
import { IGivingService,IReview } from '@dnevnica/shared';
import {IRequestService} from "@dnevnica/shared/models/request_service";

@Injectable({
  providedIn: "root",
})
export class ApiService {

  constructor(private http: HttpClient) {
  }

  login(email: string, password: string) {
    return this.http.post<any>('/api/auth/login', {email, password})
  }

  logout(refreshToken: string) {
    return this.http.post('/api/auth/logout', { refreshToken });
  }

  getCurrentUser() {
    return this.http.get<IUser>('/api/users/current-user');
  }

  refreshToken(refreshToken: string) {
    return this.http.post<any>('/api/auth/token', { refreshToken });
  }

  forgotPassword(email: string) {
    return this.http.post<any>('/api/auth/forgot-password', { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<any>('/api/auth/reset-password', { token, newPassword });
  }

  updateCurrentUser(id: number, userData: Partial<IUser>) {
    return this.http.put<IUser>(`/api/users/${id}`, userData);
  }

  getAllGivingServices(filters?: {
    search?: string;
    category?: string;
    location?: string
  }){
    let params = new HttpParams();

    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.location) params = params.set('location', filters.location);

    return this.http.get<IGivingService[]>('/api/giving-services', {params});
  }

  updateService(id: number | string, serviceData: IGivingService) {
    return this.http.put<IGivingService>(`/api/giving-services/${id}`, serviceData);
  }

  deleteService(id: number | string) {
    return this.http.delete(`/api/giving-services/${id}`);
  }

  createService(serviceData: IGivingService) {
    return this.http.post<IGivingService>('/api/giving-services', serviceData);
  }

  findOne(id: number | string) {
    return this.http.get<IGivingService>(`/api/giving-services/${id}`);
  }

  getReviewsForService(serviceId: number) {
    return this.http.get<IReview[]>(`/api/review/${serviceId}`);
  }

  createReview(reviewData: IReview) {
    return this.http.post<IReview>('/api/review/', reviewData);
  }

  deleteReview(id: number) {
    return this.http.delete(`/api/review/${id}`);
  }

  getMyReview(serviceId: number) {
    return this.http.get<IReview>(`/api/review/my-review/${serviceId}`);
  }

  updateReview(id: number, reviewData: IReview) {
    return this.http.put<IReview>(`/api/review/${id}`, reviewData);
  }

  updateServiceRequest(id: number | string, serviceData: IRequestService) {
    return this.http.put<IRequestService>(`/api/request-service/${id}`, serviceData);
  }

  createServiceRequest(serviceData: IRequestService) {
    return this.http.post<IRequestService>('/api/request-service', serviceData);
  }

  deleteServiceRequest(id: number | string) {
    return this.http.delete(`/api/request-service/${id}`);
  }

  findOneServiceRequest(id: number | string) {
    return this.http.get<IRequestService>(`/api/request-service/${id}`);
  }

  getAllServiceRequests(filters?: {
    search?: string;
    category?: string;
    location?: string
  }){
    let params = new HttpParams();

    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.location) params = params.set('location', filters.location);

    return this.http.get<IRequestService[]>('/api/request-service', {params});
  }
}
