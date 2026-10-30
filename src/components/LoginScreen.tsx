import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AppLanguage } from '../domain/types';

type Props = {
  language: AppLanguage;
  pending: boolean;
  error: string;
  onSubmit: (password: string) => void;
};

const copy = {
  ja: {
    eyebrow: '個人の支出管理',
    title: 'おかえりなさい',
    intro: 'ShishutsuNoteにログインしてください。',
    password: 'パスワード',
    show: '表示',
    hide: '隠す',
    submit: 'ログイン',
    loading: '確認中…',
    locked: '試行回数が多いため、しばらく待ってから再試行してください。',
    unavailable: 'サーバーに接続できません。少し待ってから再試行してください。',
    wrong: 'パスワードを確認してください。',
    setup: 'ログイン設定がまだ完了していません。',
  },
  en: {
    eyebrow: 'PERSONAL EXPENSE TRACKER',
    title: 'Welcome back',
    intro: 'Sign in to continue to ShishutsuNote.',
    password: 'Password',
    show: 'Show',
    hide: 'Hide',
    submit: 'Sign in',
    loading: 'Checking…',
    locked: 'Too many attempts. Wait a little before trying again.',
    unavailable: 'Could not connect to the server. Please try again shortly.',
    wrong: 'Check your password and try again.',
    setup: 'The sign-in service is not configured yet.',
  },
  id: {
    eyebrow: 'PENCATATAN PENGELUARAN PRIBADI',
    title: 'Selamat datang kembali',
    intro: 'Masuk ke ShishutsuNote untuk melanjutkan.',
    password: 'Kata sandi',
    show: 'Lihat',
    hide: 'Sembunyikan',
    submit: 'Masuk',
    loading: 'Memeriksa…',
    locked: 'Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.',
    unavailable: 'Server tidak dapat dihubungi. Coba lagi sebentar.',
    wrong: 'Periksa kata sandi lalu coba lagi.',
    setup: 'Layanan masuk belum dikonfigurasi.',
  },
};

export function LoginScreen({ language, pending, error, onSubmit }: Props) {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const text = copy[language];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending && password.length >= 12) onSubmit(password);
  }

  const errorText = error === 'login_temporarily_locked' ? text.locked
    : error === 'auth_not_configured' ? text.setup
      : error === 'invalid_credentials' ? text.wrong
        : error ? text.unavailable : '';

  return (
    <main className="login-page">
      <section aria-labelledby="login-title" className="login-card">
        <div className="login-brand-mark" aria-hidden="true">S</div>
        <p className="login-eyebrow">{text.eyebrow}</p>
        <h1 id="login-title">{text.title}</h1>
        <p className="login-intro">{text.intro}</p>
        <form className="login-form" onSubmit={submit}>
          <label className="field" htmlFor="app-password">
            <span>{text.password}</span>
            <span className="login-password-control">
              <input
                id="app-password"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                disabled={pending}
                minLength={12}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type={visible ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label={visible ? text.hide : text.show}
                className="login-password-toggle"
                disabled={pending}
                onClick={() => setVisible((value) => !value)}
                type="button"
              >
                {visible ? text.hide : text.show}
              </button>
            </span>
          </label>
          {errorText && <p className="login-error" role="alert" aria-live="assertive">{errorText}</p>}
          <button className="button button-primary login-submit" disabled={pending || password.length < 12} type="submit">
            {pending ? text.loading : text.submit}
          </button>
        </form>
        <p className="login-footnote">ShishutsuNote · Drew</p>
      </section>
    </main>
  );
}

