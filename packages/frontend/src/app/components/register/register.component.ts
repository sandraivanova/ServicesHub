import {Component, inject} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  errorMessage: string = '';

  registerForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onRegister() {
    if (this.registerForm.invalid) {
      return;
    }

    const formData = this.registerForm.value;

    this.http.post<any>('/api/auth/sign-up', formData)
      .subscribe({
        next: (response) => {
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Registration error';
        }
      });
  }
}
