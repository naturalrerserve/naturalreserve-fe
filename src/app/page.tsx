'use client';
import { useState } from 'react';
import type { Metadata } from 'next';
import styles from '@/styles/login.module.css';
import Bubbles from '@/components/login/Bubbles';
import LoginCard from '@/components/login/LoginCard';
import RequestCard from '@/components/login/RequestCard';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'request'>('login');

  return (
    <div className={styles.pageBody}>
      <Bubbles />

      <div className={styles.wrapper}>
        {/* ── HEADER ── */}
        <header className={styles.header}>
          <div className={styles.logoMark}>🌿</div>
          <h1 className={styles.h1}>Natural Reserve</h1>
          <p className={styles.headerSub}>
            Fish Farming Feeding Rate Calculator &amp; Management System
          </p>
        </header>

        {/* ── ACCESS BANNER ── */}
        <div className={styles.accessBanner}>
          <div className={styles.accessBannerIcon}>🔑</div>
          <div className={styles.accessBannerText}>
            <strong>Sistem Akses Terkontrol</strong>
            Aplikasi ini menggunakan <em>kode akses unik</em> per pengguna.
            Hubungi administrator untuk mendapatkan kode akses.
          </div>
        </div>

        {/* ── TABS ── */}
        <div className={styles.tabRow}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'login' ? styles.active : ''}`}
            onClick={() => setActiveTab('login')}
            id="tabMasuk"
          >
            🔓 Masuk
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'request' ? styles.active : ''}`}
            onClick={() => setActiveTab('request')}
            id="tabRequest"
          >
            📋 Minta Akses
          </button>
        </div>

        {/* ── LOGIN CARD ── */}
        <div className={`${styles.tabPanel} ${activeTab === 'login' ? styles.active : ''}`}>
          <LoginCard onSwitchTab={() => setActiveTab('request')} />
        </div>

        {/* ── REQUEST CARD ── */}
        <div className={`${styles.tabPanel} ${activeTab === 'request' ? styles.active : ''}`}>
          <RequestCard onSwitchTab={() => setActiveTab('login')} />
        </div>

        {/* ── FOOTER ── */}
        <div className={styles.loginFooter}>
          <strong>Natural Reserve</strong> · Fish Feeding Calculator v2.0<br />
          Dirancang untuk budidaya ikan air tawar
          <div className={styles.securityBadge}>
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Dilindungi Firebase Auth + Kode Akses Unik
          </div>
        </div>
      </div>
    </div>
  );
}
