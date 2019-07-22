import { Routes } from '@angular/router';

import { DashboardComponent } from '../../dashboard/dashboard.component';
import { UserProfileComponent } from '../../user-profile/user-profile.component';
import { TableListComponent } from '../../table-list/table-list.component';
import { TypographyComponent } from '../../typography/typography.component';
import { IconsComponent } from '../../icons/icons.component';
import { MapsComponent } from '../../maps/maps.component';
import { NotificationsComponent } from '../../notifications/notifications.component';
import { UpgradeComponent } from '../../upgrade/upgrade.component';
import { AuthguardService } from '../../services/authguard.service';
import { DeactivateguardService } from '../../services/deactivateguard.service';
import { UserGroupsComponent } from '../../user-groups/user-groups.component';


export const AdminLayoutRoutes: Routes = [
    { path: 'dashboard',      component: DashboardComponent , canActivate: [AuthguardService] },
    { path: 'user-profile',   component: UserProfileComponent, canActivate: [AuthguardService] },
    { path: 'user-list',     component: TableListComponent, canActivate: [AuthguardService] },
    { path: 'users-groups',    component: UserGroupsComponent, canActivate: [AuthguardService] },
    { path: 'typography',     component: TypographyComponent, canActivate: [AuthguardService] },
    { path: 'icons',          component: IconsComponent, canActivate: [AuthguardService] },
    { path: 'maps',           component: MapsComponent, canActivate: [AuthguardService] },
    { path: 'notifications',  component: NotificationsComponent, canActivate: [AuthguardService] },
    { path: 'upgrade',        component: UpgradeComponent, canActivate: [AuthguardService] }
];
