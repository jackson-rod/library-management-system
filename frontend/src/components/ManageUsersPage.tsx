import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import NavigationBar from './NavigationBar';
import Loading from './Loading';
import FormInput from './FormInput';
import FormError from './FormError';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { userService } from '@/services/userService';
import type { User } from '@/types/auth';
import type { PaginationMeta } from '@/types/library';
import { extractErrorMessage } from '@/utils/error';

type UserFormData = {
  name: string;
  email: string;
  role: 'Admin' | 'User';
  password?: string;
};

export default function ManageUsersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    defaultValues: {
      name: '',
      email: '',
      role: 'User',
      password: '',
    },
  });

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const totalUsers = meta?.total ?? users.length;

  const fetchUsers = async (pageNumber = 1, searchTerm = '') => {
    setLoading(true);
    setError('');
    try {
      const response = await userService.list({
        page: pageNumber,
        search: searchTerm || undefined,
      });
      setUsers(response.data);
      setMeta(response.meta);
      setPage(pageNumber);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load users.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const onSubmit = async (data: UserFormData) => {
    try {
      if (editingUser) {
        const payload = {
          name: data.name,
          email: data.email,
          role: data.role,
          ...(data.password ? { password: data.password } : {}),
        };
        await userService.update(editingUser.id, payload);
        showToast('User updated successfully', 'success');
      } else {
        await userService.create({
          name: data.name,
          email: data.email,
          password: data.password ?? '',
          role: data.role,
        });
        showToast('User created successfully', 'success');
      }
      reset({ name: '', email: '', role: 'User', password: '' });
      setEditingUser(null);
      fetchUsers(page, search);
    } catch (err) {
      showToast(extractErrorMessage(err, 'Unable to save user.'), 'error');
    }
  };

  const handleEdit = (selected: User) => {
    setEditingUser(selected);
    reset({
      name: selected.name,
      email: selected.email,
      role: selected.role,
      password: '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await userService.remove(id);
      showToast('User deleted', 'success');
      fetchUsers(page, search);
    } catch (err) {
      showToast(extractErrorMessage(err, 'Unable to delete user.'), 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    reset({ name: '', email: '', role: 'User', password: '' });
  };

  const userSummary = useMemo(() => {
    const admins = users.filter((u) => u.role === 'Admin').length;
    return {
      admins,
      members: users.length - admins,
    };
  }, [users]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900">
        <NavigationBar />
        <main className="mx-auto max-w-5xl px-4 py-20 text-center text-gray-200">
          <p className="text-sm uppercase tracking-[0.3em] text-rose-300">Restricted</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Admin access required</h1>
          <p className="mt-2 text-gray-400">
            Manage users is only available for admins. Contact your lead if you believe you should have access.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <NavigationBar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm text-indigo-300 uppercase tracking-[0.3em]">Admin</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Manage Users</h1>
          <p className="mt-2 text-gray-400">
            Enforce accountability with clear ownership. Create admins or members, reset credentials, and keep the roster clean.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-gray-800/60 p-4">
            <p className="text-sm text-gray-400">Total users</p>
            <p className="mt-2 text-2xl font-semibold text-white">{meta?.total ?? users.length}</p>
            <p className="text-xs text-gray-500">Across all pages</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-gray-800/60 p-4">
            <p className="text-sm text-gray-400">Admins</p>
            <p className="mt-2 text-2xl font-semibold text-white">{userSummary.admins}</p>
            <p className="text-xs text-gray-500">High-trust operators</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-gray-800/60 p-4">
            <p className="text-sm text-gray-400">Members</p>
            <p className="mt-2 text-2xl font-semibold text-white">{userSummary.members}</p>
            <p className="text-xs text-gray-500">Day-to-day borrowers</p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-gray-800/80 p-6 lg:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Directory</h2>
                <p className="text-sm text-gray-400">Showing {users.length} of {totalUsers}</p>
              </div>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email"
                className="w-full rounded-lg border border-white/10 bg-gray-900/60 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none md:w-72"
              />
            </div>

            <div className="mt-4 overflow-x-auto">
              {loading ? (
                <div className="py-10 text-center">
                  <Loading fullScreen={false} />
                </div>
              ) : users.length === 0 ? (
                <p className="py-10 text-center text-gray-400">No users found.</p>
              ) : (
                <table className="min-w-full divide-y divide-white/10 text-sm text-white">
                  <thead className="text-left text-gray-400">
                    <tr>
                      <th className="py-3 pr-4 font-medium">Name</th>
                      <th className="py-3 pr-4 font-medium">Email</th>
                      <th className="py-3 pr-4 font-medium">Role</th>
                      <th className="py-3 pr-4 font-medium">Library ID</th>
                      <th className="py-3 pr-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-white">{u.name}</p>
                          <p className="text-xs text-gray-500">#{u.id}</p>
                        </td>
                        <td className="py-3 pr-4 text-gray-300">{u.email}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              u.role === 'Admin' ? 'bg-rose-500/10 text-rose-200' : 'bg-emerald-500/10 text-emerald-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-300">{u.library_id ?? '—'}</td>
                        <td className="py-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(u)}
                              className="text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                            >
                              Edit
                            </button>
                            <span className="text-gray-700">|</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(u.id)}
                              className="text-xs font-semibold text-rose-300 hover:text-rose-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {error && <p className="mt-4 rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}

            <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => fetchUsers(page - 1, search)}
                className="rounded-md border border-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <p>
                Page <span className="text-white">{meta?.current_page ?? 1}</span> of{' '}
                <span className="text-white">{meta?.last_page ?? 1}</span>
              </p>
              <button
                type="button"
                disabled={(meta && page >= meta.last_page) || loading}
                onClick={() => fetchUsers(page + 1, search)}
                className="rounded-md border border-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gray-800/80 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {editingUser ? 'Update User' : 'Add User'}
                </h2>
                <p className="text-sm text-gray-400">
                  {editingUser ? 'Adjust access or reset credentials.' : 'Create a new teammate.'}
                </p>
              </div>
              {editingUser && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <FormInput
                id="name"
                label="Full Name"
                type="text"
                autoComplete="name"
                disabled={isSubmitting}
                error={errors.name}
                {...register('name', { required: 'Name is required' })}
              />

              <FormInput
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                error={errors.email}
                {...register('email', { required: 'Email is required' })}
              />

              <div data-testid="form-input-wrapper-role">
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-100"
                >
                  Role
                </label>
                <select
                  id="role"
                  {...register('role', { required: true })}
                  disabled={isSubmitting}
                  className="mt-2 w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 focus:outline-2 focus:outline-indigo-500"
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <FormInput
                id="password"
                label={editingUser ? 'New Password (optional)' : 'Password'}
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                error={errors.password}
                {...register('password', {
                  required: editingUser ? false : 'Password is required',
                  minLength: editingUser
                    ? undefined
                    : {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                })}
              />

              {error && <FormError message={error} />}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
              >
                {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
