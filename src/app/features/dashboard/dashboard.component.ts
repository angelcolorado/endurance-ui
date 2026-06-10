import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="min-h-screen bg-slate-900 flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-black tracking-widest text-white uppercase">
          Endurance<span class="text-blue-500">Ops</span>
        </h1>
        <p class="mt-4 text-slate-400">Dashboard — coming soon</p>
      </div>
    </div>
  `,
})
export class DashboardComponent {}
