'use client';

import Link from 'next/link';
import {
  FaGithub,
  FaLinkedin,
  FaXTwitter,
  FaFacebook,
  FaInstagram,
  FaWhatsapp,
  FaTelegram,
} from 'react-icons/fa6';
import { MdEmail } from 'react-icons/md';
import { useLocale } from './LocaleProvider';

export function Footer() {
  const { t, locale } = useLocale();

  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🌾</span>
              <span className="text-xl font-bold text-green-400">
                {t('appName')}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              {t('tagline')}
            </p>
            <p className="text-gray-500 text-xs mt-2">{year} {t('allRightsReserved')}</p>
          </div>
          <div>
            <h3 className="sr-only">{t('quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                >
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link
                  href="/solutions"
                  className="hover:text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                >
                  {t('solutions')}
                </Link>
              </li>
              <li>
                <Link
                  href="/marketplace"
                  className="hover:text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                >
                  {t('marketplace')}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                >
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="sr-only">{t('forUsers')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/auth/register?role=farmer"
                  className="hover:text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                >
                  {t('solutionsForFarmers')}
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register?role=processor"
                  className="hover:text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                >
                  {t('solutionsForProcessors')}
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register?role=consumer"
                  className="hover:text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                >
                  {t('solutionsForConsumers')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="sr-only">{t('connect')}</h3>
            <div className="flex items-center gap-4 mb-4 text-2xl">
              <a
                href="https://github.com/TsegayIS122123"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white hover:scale-110 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                aria-label="GitHub"
              >
                <FaGithub />
              </a>
              <a
                href="https://www.linkedin.com/in/tsegay-assefa-95a397336"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#0A66C2] hover:scale-110 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                aria-label="LinkedIn"
              >
                <FaLinkedin />
              </a>
              <a
                href="https://x.com/TsegayAsse64592"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white hover:scale-110 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                aria-label="X (Twitter)"
              >
                <FaXTwitter />
              </a>
              <a
                href="https://www.facebook.com/tsegay.assefa.942"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#1877F2] hover:scale-110 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                aria-label="Facebook"
              >
                <FaFacebook />
              </a>
              <a
                href="https://www.instagram.com/tsegay.assefa.942"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-500 hover:scale-110 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://wa.me/251979416992"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-500 hover:scale-110 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                aria-label="WhatsApp"
              >
                <FaWhatsapp />
              </a>
              <a
                href="https://t.me/jekibreak"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-sky-500 hover:scale-110 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                aria-label="Telegram"
              >
                <FaTelegram />
              </a>
            </div>
            <p className="flex items-center gap-2 text-sm text-gray-400">
              <MdEmail className="text-lg" aria-hidden="true" />
              <span>tsegayassefa27@gmail.com</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
