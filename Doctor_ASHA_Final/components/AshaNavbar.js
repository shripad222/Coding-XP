import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import styles from './AshaNavbar.module.css';
import { FaPlus, FaSignOutAlt } from 'react-icons/fa';

const AshaNavbar = ({ userName }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <nav className={styles.navbar}>
      <h1 className={styles.title}>SehatSathi</h1>
      <div className={styles.userInfo}>
        <p className={styles.welcomeMessage}>Welcome, {userName}</p>
        <button onClick={() => router.push('/add-patient')} className={styles.navButton}>
          <FaPlus />
          Add Patient
        </button>
        <button onClick={handleLogout} className={styles.navButton}>
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default AshaNavbar;
