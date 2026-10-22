
import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  PawPrint,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  LoaderCircle,
  Heart,
  ShoppingBag,
  Search,
  X,
  Dog,
  Cat,
  Fish,
} from 'lucide-react'
import { toast } from 'sonner'
import { loginUser } from './auth.api'

const categories = [
  { label: 'Dog', Icon: Dog },
  { label: 'Cat', Icon: Cat },
  { label: 'Bird', Icon: PawPrint },
  { label: 'Fish', Icon: Fish },
  { label: 'Small Pets', Icon: Heart },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const loginMutation = useMutation({
    mutationFn: loginUser,

    onSuccess: async (user) => {
      if (user.role !== 'ADMIN') {
        toast.error('Admin access required.')
        return
      }

      queryClient.setQueryData(['auth', 'me'], user)
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'dashboard'],
      })

      toast.success('Welcome back to PawNest!')
      navigate('/', { replace: true })
    },

    onError: (error: unknown) => {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (
              error as {
                response?: { data?: { message?: string } }
              }
            ).response?.data?.message
          : undefined

      toast.error(message || 'Login failed. Check your email and password.')
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    loginMutation.mutate({
      email: email.trim().toLowerCase(),
      password,
    })
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F5F7F5] text-[#173F35]">
      {/* Temporary PawNest storefront background */}
      <div className="pointer-events-none absolute inset-0 select-none">
        <header className="border-b border-[#295F4C]/10 bg-white/90 px-5 py-4 sm:px-10">
          <div className="mx-auto flex max-w-7xl items-center gap-5">
            <div className="flex shrink-0 items-center gap-2">
              <PawPrint size={34} className="text-orange-500" />
              <span className="text-2xl font-extrabold tracking-tight text-[#295F4C]">
                PawNest
              </span>
            </div>

            <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex">
              <Search size={19} className="text-slate-400" />
              <span className="text-sm text-slate-400">
                Search for dog food, cat toys...
              </span>
            </div>

            <div className="ml-auto flex items-center gap-4 text-[#295F4C] sm:gap-6">
              <Heart size={23} />
              <ShoppingBag size={23} />
              <span className="hidden rounded-xl border border-[#295F4C] px-5 py-2 text-sm font-semibold sm:inline-block">
                Login
              </span>
            </div>
          </div>
        </header>

        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3 bg-white px-4 py-4 text-sm font-semibold sm:gap-x-12">
          <span>Shop</span>
          <span>Dog</span>
          <span>Cat</span>
          <span>Bird</span>
          <span>Fish</span>
          <span>Small Pets</span>
        </nav>

        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-8">
          <section className="relative flex min-h-[235px] items-center overflow-hidden rounded-3xl bg-[#E4EEE6] px-6 py-8 sm:min-h-[300px] sm:px-12">
            <div className="relative z-10 max-w-xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#49866E]">
                Made for pet lovers
              </p>
              <h1 className="text-4xl font-extrabold leading-tight text-[#295F4C] sm:text-5xl">
                Happy Pets,
                <br />
                Happier Lives
              </h1>
              <p className="mt-4 max-w-sm text-sm text-[#295F4C]/80 sm:text-base">
                Quality products for every pet, every day.
              </p>
              <div className="mt-6 inline-flex rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white">
                Shop Now →
              </div>
            </div>

            <PawPrint
              size={190}
              strokeWidth={0.7}
              className="absolute -right-5 bottom-4 hidden rotate-[-15deg] text-[#49866E]/20 sm:block"
            />
            <Heart
              size={90}
              className="absolute right-20 top-8 hidden text-orange-400/50 sm:block"
            />
          </section>

          <section className="mt-7 rounded-2xl bg-white/70 p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Shop by Pet</h2>
              <span className="text-sm font-semibold text-[#49866E]">
                View All →
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-5">
              {categories.map(({ label, Icon }) => (
                <div
                  key={label}
                  className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-[#295F4C]/10 bg-[#F8FAF8] p-3 sm:min-h-36"
                >
                  <Icon size={34} strokeWidth={1.5} className="text-[#49866E]" />
                  <span className="text-sm font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-7 grid grid-cols-2 gap-4 pb-10 sm:grid-cols-4">
            {['Everyday essentials', 'Food & treats', 'Toys & play', 'Beds & bowls'].map(
              (item) => (
                <div
                  key={item}
                  className="flex min-h-28 items-end rounded-2xl border border-[#295F4C]/10 bg-white p-4 sm:min-h-36"
                >
                  <span className="text-sm font-semibold text-[#295F4C]">
                    {item}
                  </span>
                </div>
              ),
            )}
          </section>
        </div>
      </div>

      {/* Dark overlay and login modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 px-3 py-5 backdrop-blur-[2px] sm:px-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-heading"
          className="relative my-auto w-full max-w-[480px] rounded-2xl bg-white px-5 py-7 shadow-2xl shadow-black/20 sm:px-8 sm:py-8"
        >
          {/* Login is mandatory for this protected admin panel. */}
          <span
            aria-hidden="true"
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400"
          >
            <X size={21} />
          </span>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <PawPrint size={38} fill="currentColor" strokeWidth={1.5} />
          </div>

          <div className="mt-5 text-center">
            <h2
              id="login-heading"
              className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[28px]"
            >
              Login to continue
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Sign in to manage your PawNest store and access your admin dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Email
              </label>

              <div className="flex h-12 items-center gap-3 rounded-lg border border-slate-200 px-3.5 transition focus-within:border-[#49866E] focus-within:ring-4 focus-within:ring-[#49866E]/10">
                <Mail size={19} className="shrink-0 text-slate-700" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  maxLength={254}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Password
              </label>

              <div className="flex h-12 items-center gap-3 rounded-lg border border-slate-200 px-3.5 transition focus-within:border-[#49866E] focus-within:ring-4 focus-within:ring-[#49866E]/10">
                <LockKeyhole size={19} className="shrink-0 text-slate-700" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  maxLength={72}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#295F4C]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  <span className="hidden sm:inline">
                    {showPassword ? 'Hide' : 'show'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending || !email.trim() || !password}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white shadow-md shadow-orange-500/15 transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginMutation.isPending ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="mt-5 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs leading-5 text-slate-500">
              <span className="font-semibold text-[#295F4C]">PawNest Admin</span>
              {' · '}Authorized administrators only
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
