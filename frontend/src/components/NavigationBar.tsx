import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Logo from '@/assets/logo.webp';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { classNames } from '@/utils/classNames';

interface NavigationItem {
  name: string;
  href: string;
  isDisabled?: boolean;
  adminOnly?: boolean;
  isActive?: (pathname: string) => boolean;
}

export default function NavigationBar() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const isAdmin = user?.role && user.role.toLowerCase() === 'admin';

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard' },
    {
      name: 'Books',
      href: '/books',
      isActive: (pathname: string) => pathname === '/books' || pathname.startsWith('/books/'),
    },
    { name: 'My Borrowings', href: '/borrowings' },
    { name: 'Resources', href: '/resources' },
    { name: 'Manage Books', href: '/admin/books', adminOnly: true },
    { name: 'Manage Users', href: '/admin/users', adminOnly: true },
  ].filter((item) => !item.adminOnly || isAdmin);

  const handleLogout = async () => {
    try {
      await logout();
      setProfileMenuOpen(false);
      showToast('You have been logged out successfully', 'success');
      navigate('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
      showToast('Failed to logout. Please try again.', 'error');
    }
  };

  return (
    <nav className="relative bg-gray-800/50 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500"
              data-testid="mobile-menu-button"
            >
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon aria-hidden="true" className="block size-6" />
              ) : (
                <Bars3Icon aria-hidden="true" className="block size-6" />
              )}
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              <img
                alt="Library Management"
                src={ Logo }
                className="h-8 w-auto"
                data-testid="navbar-logo"
              />
              <span className="ml-3 text-white font-semibold hidden sm:block">
                Library Management System
              </span>
            </div>

            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {navigation.map((item) => {
                  const isActive = item.isActive
                    ? item.isActive(location.pathname)
                    : location.pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      to={item.isDisabled ? location.pathname : item.href}
                      aria-disabled={item.isDisabled ? 'true' : 'false'}
                      aria-current={isActive ? 'page' : undefined}
                      className={classNames(
                        isActive ? 'bg-gray-950/50 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white',
                        'rounded-md px-3 py-2 text-sm font-medium',
                        item.isDisabled ? 'cursor-not-allowed opacity-50' : ''
                      )}
                      onClick={(event) => {
                        if (item.isDisabled) {
                          event.preventDefault();
                        }
                      }}
                      data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <button
              type="button"
              className="relative rounded-full p-1 text-gray-400 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="notifications-button"
              disabled
            >
              <span className="absolute -inset-1.5" />
              <span className="sr-only">View notifications</span>
              <BellIcon aria-hidden="true" className="size-6" />
            </button>

            {/* Profile dropdown */}
            <div className="relative ml-3">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="relative flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 cursor-pointer"
                data-testid="profile-menu-button"
              >
                <span className="absolute -inset-1.5" />
                <span className="sr-only">Open user menu</span>
                <div className="size-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm outline -outline-offset-1 outline-white/10">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>

              {profileMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  {/* Menu */}
                  <div
                    className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-gray-800 py-1 outline -outline-offset-1 outline-white/10 transition"
                    data-testid="profile-menu"
                  >
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-sm font-medium text-white">{user?.name}</p>
                      <p className="text-xs text-gray-400 break-words">{user?.email}</p>
                      <p className="text-xs text-indigo-400 mt-1">{user?.role}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled cursor-not-allowed"
                      onClick={() => setProfileMenuOpen(false)}
                      data-testid="profile-link"
                      aria-disabled="true"
                    >
                      Your profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 cursor-pointer"
                      data-testid="signout-button"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden" data-testid="mobile-menu">
          <div className="space-y-1 px-2 pt-2 pb-3">
            {navigation.map((item) => {
              const isActive = item.isActive
                ? item.isActive(location.pathname)
                : location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.isDisabled ? location.pathname : item.href}
                  onClick={() => {
                    if (item.isDisabled) return;
                    setMobileMenuOpen(false);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={classNames(
                    isActive ? 'bg-gray-950/50 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white',
                    'block rounded-md px-3 py-2 text-base font-medium',
                    item.isDisabled ? 'cursor-not-allowed opacity-50' : ''
                  )}
                  data-testid={`mobile-nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
