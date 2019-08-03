import { Routes } from '@angular/router';

import { DashboardComponent } from '../../dashboard/dashboard.component';
import { TableListComponent } from '../../table-list/table-list.component';
import { AuthguardService } from '../../services/authguard.service';
import { UserGroupsComponent } from '../../user-groups/user-groups.component';


export const AdminLayoutRoutes: Routes = [
    { path: 'dashboard',      component: DashboardComponent , canActivate: [AuthguardService] },
    { path: 'user-list',     component: TableListComponent, canActivate: [AuthguardService] },
    { path: 'users-groups',    component: UserGroupsComponent, canActivate: [AuthguardService] },
];
