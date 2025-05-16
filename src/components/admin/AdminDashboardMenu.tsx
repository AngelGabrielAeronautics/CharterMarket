import React from 'react';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AirplaneTicketIcon from '@mui/icons-material/AirplaneTicket';
import PeopleIcon from '@mui/icons-material/People';
import AirlinesIcon from '@mui/icons-material/Airlines';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import StyleIcon from '@mui/icons-material/Style';
import SettingsIcon from '@mui/icons-material/Settings';
import Link from 'next/link';

const AdminDashboardMenu = () => {
  return (
    <>
      <Link href="/admin/dashboard" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
        <MenuItem>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </MenuItem>
      </Link>
      <Link href="/admin/dashboard/bookings" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
        <MenuItem>
          <ListItemIcon>
            <AirplaneTicketIcon />
          </ListItemIcon>
          <ListItemText primary="Bookings" />
        </MenuItem>
      </Link>
      <Link href="/admin/dashboard/users" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
        <MenuItem>
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Users" />
        </MenuItem>
      </Link>
      <Link href="/admin/dashboard/operators" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
        <MenuItem>
          <ListItemIcon>
            <AirlinesIcon />
          </ListItemIcon>
          <ListItemText primary="Operators" />
        </MenuItem>
      </Link>
      <Link href="/admin/dashboard/locations" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
        <MenuItem>
          <ListItemIcon>
            <LocationOnIcon />
          </ListItemIcon>
          <ListItemText primary="Locations" />
        </MenuItem>
      </Link>
      <Link href="/admin/dashboard/notifications" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
        <MenuItem>
          <ListItemIcon>
            <NotificationsIcon />
          </ListItemIcon>
          <ListItemText primary="Notifications" />
        </MenuItem>
      </Link>
      <Link href="/admin/dashboard/style-guide" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
        <MenuItem>
          <ListItemIcon>
            <StyleIcon />
          </ListItemIcon>
          <ListItemText primary="Style Guide" />
        </MenuItem>
      </Link>
      <Link href="/admin/dashboard/settings" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
        <MenuItem>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
      </Link>
    </>
  );
};

export default AdminDashboardMenu; 