import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TRANSLATIONS } from '@/lib/i18n';
import { ApiError } from '@/lib/api-client';
import { EmailNotVerifiedError, RateLimitedError } from '@/features/auth/api';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';

const en = TRANSLATIONS.en;
const push = jest.fn();

/**
 * Required fields render a decorative asterisk inside the label, hidden from
 * assistive technology, so the label's text content is "Password *" while its
 * accessible name stays "Password". Matching on a prefix keeps the assertion
 * about the field rather than about the marker.
 */
const byLabel = (text: string) =>
  new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');

/**
 * Asserts an error is actually wired to its control rather than merely present
 * somewhere on the page. The message is deliberately rendered twice, once in
 * the alert summary and once under the field, so a plain text query would either
 * match twice or prove nothing about which control is invalid. Following
 * aria-describedby from the input is the assertion that would catch a field
 * marked invalid with no message attached to it.
 */
function expectFieldError(label: string, message: string) {
  const field = screen.getByLabelText(byLabel(label));
  expect(field).toHaveAttribute('aria-invalid', 'true');
  const describedBy = field.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  expect(document.getElementById(describedBy as string)).toHaveTextContent(message);
  // And the same text is collected in the summary for a screen-reader user.
  expect(screen.getAllByText(message).length).toBeGreaterThanOrEqual(1);
}

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

// Real English strings rather than the key, so an assertion that breaks means
// the copy changed and not that the test lost its subject.
jest.mock('@/components/LocaleProvider', () => ({
  useLocaleValue: () => ({
    locale: 'en',
    setLocale: jest.fn(),
    ready: true,
    t: (key: string, params?: Record<string, string | number>) => {
      const template = TRANSLATIONS.en[key] ?? key;
      if (!params) return template;
      return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
    },
  }),
}));

jest.mock('@/features/auth/session', () => ({
  establish: jest.fn().mockResolvedValue(undefined),
  endSession: jest.fn().mockResolvedValue(undefined),
  ensureSession: jest.fn().mockResolvedValue(null),
  getUser: jest.fn(() => null),
  getAccessToken: jest.fn(() => null),
  subscribe: jest.fn(() => () => undefined),
}));

// Only the transport is replaced. The error classes stay real because the
// screens branch on them, and a test that mocked those would assert nothing.
jest.mock('@/features/auth/api', () => {
  const actual = jest.requireActual('@/features/auth/api');
  return {
    ...actual,
    authApi: {
      login: jest.fn(),
      register: jest.fn(),
      resendVerification: jest.fn(),
      verifyEmail: jest.fn(),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
      otpRequest: jest.fn(),
      otpVerify: jest.fn(),
      me: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { authApi } = require('@/features/auth/api') as { authApi: Record<string, jest.Mock> };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('sign in screen', () => {
  it('labels both fields instead of relying on placeholders', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(byLabel(en.authEmail))).toBeInTheDocument();
    expect(screen.getByLabelText(byLabel(en.authPassword))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: en.authSignIn })).toBeInTheDocument();
  });

  it('reports an empty submit in an alert and moves focus to it', async () => {
    const user = userEvent.setup({ delay: null });
    render(<LoginPage />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: en.authSignIn }));
    });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(en.authFieldRequired);
    await waitFor(() => expect(alert).toHaveFocus());
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('shows one message for a rejected sign in, without revealing which part was wrong', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.login.mockRejectedValue(new ApiError(401, 'unauthorized', 'Invalid email or password'));
    render(<LoginPage />);

    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authEmail)), 'someone@example.com');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authPassword)), 'wrong-password');
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: en.authSignIn }));
    });

    expect(await screen.findByText(en.authInvalidCredentials)).toBeInTheDocument();
    expect(screen.queryByText(/already exists/i)).not.toBeInTheDocument();
  });

  it('offers verification when the account exists but is unverified', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.login.mockRejectedValue(new EmailNotVerifiedError('someone@example.com'));
    render(<LoginPage />);

    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authEmail)), 'someone@example.com');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authPassword)), 'correct-password');
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: en.authSignIn }));
    });

    expect(await screen.findByText(en.authUnverifiedTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: en.authResendVerification })).toBeInTheDocument();
    // The wrong-password copy must not appear alongside a verification prompt.
    expect(screen.queryByText(en.authInvalidCredentials)).not.toBeInTheDocument();
  });

  it('explains a throttled attempt instead of showing a bare status', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.login.mockRejectedValue(new RateLimitedError());
    render(<LoginPage />);

    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authEmail)), 'someone@example.com');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authPassword)), 'correct-password');
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: en.authSignIn }));
    });

    expect(await screen.findByText(en.authRateLimited)).toBeInTheDocument();
  });
});

describe('sign up screen', () => {
  it('rejects a confirmation that does not match before calling the service', async () => {
    const user = userEvent.setup({ delay: null });
    render(<RegisterPage />);

    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.fullName)), 'Test Farmer');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authEmail)), 'new@example.com');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authPhone)), '+251911000000');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authPassword)), 'Str0ng-Passphrase');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authConfirmPassword)), 'SomethingElse1!');
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: en.createAccount }));
    });

    await waitFor(() => expectFieldError(en.authConfirmPassword, en.authFieldMatch));
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('rejects a phone number the service would reject, without a round trip', async () => {
    const user = userEvent.setup({ delay: null });
    render(<RegisterPage />);

    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.fullName)), 'Test Farmer');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authEmail)), 'new@example.com');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authPhone)), '0911');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authPassword)), 'Str0ng-Passphrase');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authConfirmPassword)), 'Str0ng-Passphrase');
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: en.createAccount }));
    });

    await waitFor(() => expectFieldError(en.authPhone, en.authFieldPhone));
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('marks the strength of a weak password in text, not only in colour', async () => {
    const user = userEvent.setup({ delay: null });
    render(<RegisterPage />);

    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authPassword)), 'password');
    });

    // The meter states its value in words and names what is missing. Matching on
    // the whole paragraph avoids depending on how the two lines are split up.
    const meter = await screen.findByText(
      (_content, element) =>
        element?.tagName === 'P' &&
        Boolean(element.textContent) &&
        element.textContent!.includes(en.authPwWeak) &&
        element.textContent!.includes(en.authPwAddLength),
    );
    expect(meter).toBeInTheDocument();
  });

  it('does not send a role field, because the service ignores it and it implies authority', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.register.mockResolvedValue({ user: {}, tokens: {} });
    render(<RegisterPage />);

    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.fullName)), 'Test Farmer');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authEmail)), 'new@example.com');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authPhone)), '+251911000000');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authPassword)), 'Str0ng-Passphrase');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authConfirmPassword)), 'Str0ng-Passphrase');
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: en.createAccount }));
    });

    await waitFor(() => expect(authApi.register).toHaveBeenCalled());
    expect(authApi.register.mock.calls[0][0]).not.toHaveProperty('role');
    // An unverified account is sent to verify, not to a dashboard that would
    // reject every request it makes.
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith('/auth/verify-email?email=new%40example.com'),
    );
  });

  it('attributes a duplicate address to the field rather than a generic banner', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.register.mockRejectedValue(
      new ApiError(403, 'conflict', 'An account with this email already exists'),
    );
    render(<RegisterPage />);

    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.fullName)), 'Test Farmer');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authEmail)), 'taken@example.com');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authPhone)), '+251911000000');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authPassword)), 'Str0ng-Passphrase');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(byLabel(en.authConfirmPassword)), 'Str0ng-Passphrase');
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: en.createAccount }));
    });

    await waitFor(() => expectFieldError(en.authEmail, en.authEmailTaken));
  });
});
