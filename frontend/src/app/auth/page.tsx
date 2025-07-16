'use client';

import Link from 'next/link';
import { SubmitButton } from '@/components/ui/submit-button';
import { Input } from '@/components/ui/input';
import GoogleSignIn from '@/components/GoogleSignIn';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useScroll } from 'motion/react';
import { motion, AnimatePresence } from 'motion/react';
import { signIn, signUp, forgotPassword } from './actions';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  X,
  CheckCircle,
  AlertCircle,
  MailCheck,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import Image from 'next/image';
import { useTheme } from 'next-themes';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const mode = searchParams.get('mode');
  const returnUrl = searchParams.get('returnUrl');
  const message = searchParams.get('message');

  const isSignUp = mode === 'signup';
  const tablet = useMediaQuery('(max-width: 1024px)');
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const { scrollY } = useScroll();

  // Redirect if user is already logged in, checking isLoading state
  useEffect(() => {
    if (!isLoading && user) {
      router.push(returnUrl || '/dashboard');
    }
  }, [user, isLoading, router, returnUrl]);

  // Determine if message is a success message
  const isSuccessMessage =
    message &&
    (message.includes('Check your email') ||
      message.includes('Account created') ||
      message.includes('success'));

  // Registration success state
  const [registrationSuccess, setRegistrationSuccess] =
    useState(!!isSuccessMessage);
  const [registrationEmail, setRegistrationEmail] = useState('');

  // Forgot password state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Set registration success state from URL params
  useEffect(() => {
    if (isSuccessMessage) {
      setRegistrationSuccess(true);
    }
  }, [isSuccessMessage]);

  // Detect when scrolling is active to reduce animation complexity
  useEffect(() => {
    const unsubscribe = scrollY.on('change', () => {
      setIsScrolling(true);

      // Clear any existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Set a new timeout
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 300); // Wait 300ms after scroll stops
    });

    return () => {
      unsubscribe();
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [scrollY]);

  const handleSignIn = async (prevState: any, formData: FormData) => {
    if (returnUrl) {
      formData.append('returnUrl', returnUrl);
    } else {
      formData.append('returnUrl', '/dashboard');
    }
    const result = await signIn(prevState, formData);

    // Check for success and redirectTo properties
    if (
      result &&
      typeof result === 'object' &&
      'success' in result &&
      result.success &&
      'redirectTo' in result
    ) {
      // Use window.location for hard navigation to avoid stale state
      window.location.href = result.redirectTo as string;
      return null; // Return null to prevent normal form action completion
    }

    return result;
  };

  const handleSignUp = async (prevState: any, formData: FormData) => {
    // Store email for success state
    const email = formData.get('email') as string;
    setRegistrationEmail(email);

    if (returnUrl) {
      formData.append('returnUrl', returnUrl);
    }

    // Add origin for email redirects
    formData.append('origin', window.location.origin);

    const result = await signUp(prevState, formData);

    // Check for success and redirectTo properties (direct login case)
    if (
      result &&
      typeof result === 'object' &&
      'success' in result &&
      result.success &&
      'redirectTo' in result
    ) {
      // Use window.location for hard navigation to avoid stale state
      window.location.href = result.redirectTo as string;
      return null; // Return null to prevent normal form action completion
    }

    // Check if registration was successful but needs email verification
    if (result && typeof result === 'object' && 'message' in result) {
      const resultMessage = result.message as string;
      if (resultMessage.includes('Check your email')) {
        setRegistrationSuccess(true);

        // Update URL without causing a refresh
        const params = new URLSearchParams(window.location.search);
        params.set('message', resultMessage);

        const newUrl =
          window.location.pathname +
          (params.toString() ? '?' + params.toString() : '');

        window.history.pushState({ path: newUrl }, '', newUrl);

        return result;
      }
    }

    return result;
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setForgotPasswordStatus({});

    if (!forgotPasswordEmail || !forgotPasswordEmail.includes('@')) {
      setForgotPasswordStatus({
        success: false,
        message: 'Please enter a valid email address',
      });
      return;
    }

    const formData = new FormData();
    formData.append('email', forgotPasswordEmail);
    formData.append('origin', window.location.origin);

    const result = await forgotPassword(null, formData);

    setForgotPasswordStatus(result);
  };

  const resetRegistrationSuccess = () => {
    setRegistrationSuccess(false);
    // Remove message from URL and set mode to signin
    const params = new URLSearchParams(window.location.search);
    params.delete('message');
    params.set('mode', 'signin');

    const newUrl =
      window.location.pathname +
      (params.toString() ? '?' + params.toString() : '');

    window.history.pushState({ path: newUrl }, '', newUrl);

    router.refresh();
  };

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen w-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </main>
    );
  }
  // Registration success view
  if (registrationSuccess) {
    return (
      <main className="flex min-h-screen w-full bg-[#1E221B]">
        {/* Left image/branding */}
        <div className="hidden lg:flex flex-col justify-center items-center w-1/2 relative overflow-hidden">
          {mounted && (
            <Image
              src={resolvedTheme === 'dark' ? '/auth/auth-dark.png' : '/auth/auth-light.png'}
              alt="Auth Illustration"
              fill
              className="object-cover object-center z-0"
              priority
            />
          )}
          <div className="absolute inset-0 bg-black/60 z-10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-8">
            <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg playfair-display-auth-title">Helium AI</h1>
            <p className="text-2xl font-medium text-white/90 mb-8 text-center drop-shadow-lg playfair-display-auth-title">Built for What&apos;s Beyond.</p>
            <span className="text-white/70 text-sm mt-auto mb-8">neuralarc.ai</span>
          </div>
        </div>
        {/* Right card */}
        <div className="flex flex-1 items-center justify-center min-h-screen w-full bg-background">
          <div className="w-full max-w-md rounded-[16px] bg-[#F3F4F6] dark:bg-[#F9FAFB]/[0.02] border border-border p-8 mx-4 shadow-xl">
            {/* Success content (as before) */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-50 dark:bg-green-950/20 rounded-full p-4 mb-6">
                <MailCheck className="h-12 w-12 text-green-500 dark:text-green-400" />
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tighter text-center text-balance text-primary mb-4 playfair-display-auth-title">
                Check your email
              </h1>
              <p className="text-base md:text-lg text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight max-w-md mb-2 playfair-display-auth-title">
                We've sent a confirmation link to:
              </p>
              <p className="text-lg font-medium mb-6">
                {registrationEmail || 'your email address'}
              </p>
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50 rounded-lg p-6 mb-8 max-w-md w-full">
                <p className="text-sm text-green-800 dark:text-green-400 leading-relaxed">
                  Click the link in the email to activate your account. If you don't see the email, check your spam folder.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <Link
                  href="/"
                  className="flex h-12 items-center justify-center w-full text-center rounded-[16px] border border-border bg-background hover:bg-accent/20 transition-all"
                >
                  Return to home
                </Link>
                <button
                  onClick={resetRegistrationSuccess}
                  className="flex h-12 items-center justify-center w-full text-center rounded-[16px] bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
  // Main auth view
  return (
    <main className="flex min-h-screen w-full bg-[#191919]">
      {/* Left image/branding - new Helium hero style */}
      <div className="hidden lg:flex w-[40%] relative h-full min-h-screen items-center justify-center overflow-hidden">
        <Image
          src={resolvedTheme === 'dark' ? '/auth/auth-dark.png' : '/auth/auth-dark.png'}
          alt="Helium Hero Background"
          fill
          className="object-cover object-center z-0"
          priority
        />
        <div className="absolute inset-0 -translate-y-6 flex flex-col items-center justify-center z-20 px-8">
          <Image
            src="/auth/neuralarc.svg"
            alt="NeuralArc Logo"
            width={130}
            height={130}
            className="mb-24 object-contain w-auto h-auto"
            priority
          />
          <span className="text-2xl lg:text-5xl font-normal text-white text-center mb-8 playfair-display" style={{fontWeight: 400}}>
            Enterprise Entry to<br/>Limitless AI
          </span>
          <span className="text-6xl lg:text-[100px] font-light tracking-tight text-white text-center">
            Helium
          </span>
        </div>
      </div>
      {/* Right card and legal footer container */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-[0_0_60%] flex-col items-center justify-center min-h-screen w-full bg-[#191919] relative"
      >
        {/* Back to Home link - now in normal flow above the auth card */}
        <div className="w-full flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium rounded-lg px-3 py-2 bg-background/80 shadow-md border border-border">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-[600px] rounded-[16px] bg-[#F3F4F6] dark:bg-[#E4E7DF0D] border border-border p-8 mx-4 shadow-md flex flex-col min-h-fit"
        >
          {/* Non-registration related messages */}
          {message && !isSuccessMessage && (
            <div className="mb-6 p-4 rounded-[16px] flex items-center gap-3 bg-secondary/10 border border-secondary/20 text-secondary">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-secondary" />
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}
          {/* Form */}
          <form className="space-y-5">
            <div>
              <Label htmlFor="email" className="block lg:text-base mb-2 text-sm font-medium text-left">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email address"
                className="h-12 lg:h-16 rounded-[16px] lg:text-base lg:placeholder:text-base bg-[#0000004D] dark:bg-[#0000004D] border-[#E2E2E23D]"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="password" className="text-sm font-medium text-left lg:text-base">Password</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-sm text-[#949494] hover:text-primary cursor-pointer underline lg:text-base"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="h-12 lg:h-16 rounded-[16px] bg-background dark:bg-[#0000004D] border-[#E2E2E23D] pr-12 lg:text-base lg:placeholder:text-base"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary focus:outline-none"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <AnimatePresence initial={false}>
              {isSignUp && (
                <motion.div
                  key="confirm-password"
                  initial={{ opacity: 0, y: -12, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -12, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-visible lg:text-base"
                >
                  <Label htmlFor="confirmPassword" className="block mb-2 text-sm lg:text-base font-medium text-left">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      className="h-12 lg:h-16 rounded-[16px] bg-background dark:bg-[#0000004D] border-[#E2E2E23D] pr-12 lg:text-base lg:placeholder:text-base"
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary focus:outline-none"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex gap-2 pt-4">
              {!isSignUp ? (
                <>
                <div className='grid grid-cols-3 gap-2 w-full '>
                  <SubmitButton
                    formAction={handleSignIn}
                    className="w-full col-span-1 h-16 rounded-sm cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                    pendingText="Signing in..."
                  >
                    Sign in
                  </SubmitButton>
                  <Link
                    href={`/auth?mode=signup${returnUrl ? `&returnUrl=${returnUrl}` : ''}`}
                    className="flex col-span-2 h-16 bg-transparent items-center justify-center w-full text-center rounded-sm border-2 border-border hover:bg-accent/20 transition-all"
                  >
                    Don't have an account? <span className="ml-1 underline">Sign Up</span>
                  </Link>
                </div>
                </>
              ) : (
                <>
                <div className='grid grid-cols-3 gap-2 w-full '>
                  <SubmitButton
                    formAction={handleSignUp}
                    className="w-full h-14 col-span-1 rounded-sm cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                    pendingText="Creating account..."
                  >
                    Sign up
                  </SubmitButton>
                  <Link
                    href={`/auth${returnUrl ? `?returnUrl=${returnUrl}` : ''}`}
                    className="flex h-14 col-span-2 bg-transparent items-center justify-center w-full text-center rounded-sm border-2 border-border hover:bg-accent/20 transition-all"
                  >
                    Already have an account? <span className="ml-1 underline">Sign in</span>
                  </Link>
                </div>
                </>
              )}
            </div>
          </form>
          {/* Divider (just a line, no text) */}
          <div className="my-8">
            <div className="w-full border-t border-border"></div>
          </div>
          {/* Google Sign In at the bottom */}
          <div className="w-full">
            <GoogleSignIn returnUrl={returnUrl || undefined} />
          </div>
        </motion.div>
        {/* Legal footer absolutely positioned at bottom center */}
        <div className="hidden lg:flex flex-row items-center space-x-1 gap-y-2 text-xs text-muted-foreground absolute bottom-10 z-20">
          <Link href="/terms" className="hover:underline flex-shrink-0">Terms of use</Link>
          <span className="mx-1">•</span>
          <Link href="/privacy" className="hover:underline flex-shrink-0">Privacy Policy</Link>
          <span className="mx-1">•</span>
          <Link href="/responsible-ai" className="hover:underline flex-shrink-0">Responsible &amp; Ethical AI</Link>
          <span className="mx-1 flex-shrink-0">•</span>
          <span className='flex-shrink-0'>Copyright 2025. All rights reserved.</span>
          <span className="mx-1 flex-shrink-0">•</span>
          <span className='flex-shrink-0'>Helium, a product by <Link href="https://neuralarc.ai" className="font-bold hover:underline" target="_blank" rel="noopener noreferrer">NeuralArc</Link></span>
        </div>
      </motion.div>
      {/* Forgot Password Dialog (unchanged) */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md rounded-[16px] bg-[#F3F4F6] dark:bg-[#17171A] border border-border [&>button]:hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-medium">
                Reset Password
              </DialogTitle>
              <button
                onClick={() => setForgotPasswordOpen(false)}
                className="rounded-full p-1 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <DialogDescription className="text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 py-4">
            <Input
              id="forgot-password-email"
              type="email"
              placeholder="Email address"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              className="h-12 rounded-[16px] bg-background border-border"
              required
            />
            {forgotPasswordStatus.message && (
              <div
                className={`p-4 rounded-[16px] flex items-center gap-3 ${
                  forgotPasswordStatus.success
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-400'
                    : 'bg-secondary/10 border border-secondary/20 text-secondary'
                }`}
              >
                {forgotPasswordStatus.success ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-secondary" />
                )}
                <span className="text-sm font-medium">
                  {forgotPasswordStatus.message}
                </span>
              </div>
            )}
            <DialogFooter className="flex sm:justify-start gap-3 pt-2">
              <button
                type="submit"
                className="h-12 px-6 rounded-[16px] bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
              >
                Send Reset Link
              </button>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(false)}
                className="h-12 px-6 rounded-[16px] border border-border bg-background hover:bg-accent/20 transition-all"
              >
                Cancel
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-col items-center justify-center min-h-screen w-full">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
