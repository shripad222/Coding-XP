
import Link from 'next/link';
import styles from './NewNavbar.module.css';
import { UserIcon, BellIcon, LogoutIcon } from './icons';

const NewNavbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">HealthConnect</Link>
      </div>
      <div className={styles.navLinks}>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/appointments">Appointments</Link>
        <Link href="/patients">My Patients</Link>
        <Link href="/analytics">Analytics</Link>
        <Link href="/kiosk">Open Kiosk Interface</Link>
        <Link href="/asha-workers">ASHA Updates</Link>
      </div>
      <div className={styles.userMenu}>
        <BellIcon />
        <div className={styles.profile}>
          <UserIcon />
          <span>Dr. Sarah Johnson</span>
          <LogoutIcon />
        </div>
      </div>
    </nav>
  );
};

export default NewNavbar;
