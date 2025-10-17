
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link href="/">Home</Link>
      <div>
        <Link href="/login">Login</Link>
        <Link href="/register">Register</Link>
      </div>
    </nav>
  );
};

export default Navbar;
