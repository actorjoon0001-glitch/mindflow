'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { randomInviteCode } from '@/lib/couple-utils';
import type { Profile, Couple } from '@/types';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  couple: Couple | null;
  partner: Profile | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string; alreadyRegistered?: boolean; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  resendConfirmation: (email: string) => Promise<{ error?: string }>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  loadCouple: (userId: string) => Promise<void>;
  createCouple: (coupleName: string, anniversaryDate: string) => Promise<{ error?: string }>;
  joinCouple: (inviteCode: string) => Promise<{ error?: string }>;
  updateCouple: (data: Partial<Couple>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  couple: null,
  partner: null,
  loading: false,
  initialized: false,

  loadCouple: async (userId: string) => {
    const supabase = createClient();
    const { data: membership } = await supabase
      .from('couple_members')
      .select('couple_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) {
      set({ couple: null, partner: null });
      return;
    }

    const [{ data: couple }, { data: members }] = await Promise.all([
      supabase.from('couples').select('*').eq('id', membership.couple_id).maybeSingle(),
      supabase.from('couple_members').select('user_id').eq('couple_id', membership.couple_id),
    ]);

    const partnerId = (members || []).map((m) => m.user_id).find((id) => id !== userId);
    let partner: Profile | null = null;
    if (partnerId) {
      const { data } = await supabase.from('profiles').select('*').eq('id', partnerId).maybeSingle();
      partner = data;
    }

    set({ couple: couple ?? null, partner });
  },

  initialize: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      set({
        user: { id: user.id, email: user.email! },
        profile,
      });
      await get().loadCouple(user.id);
      set({ initialized: true });
    } else {
      set({ user: null, profile: null, couple: null, partner: null, initialized: true });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          user: { id: session.user.id, email: session.user.email! },
          profile,
        });
        await get().loadCouple(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, couple: null, partner: null });
      }
    });
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('not confirmed') || msg.includes('confirm')) {
        return { error: '이메일 인증이 완료되지 않았어요. 받은 인증 메일의 링크를 눌러주세요.', needsConfirmation: true };
      }
      if (msg.includes('invalid') || msg.includes('credentials')) {
        return { error: '이메일 또는 비밀번호가 올바르지 않아요.' };
      }
      return { error: error.message };
    }
    return {};
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true });
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    set({ loading: false });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        return { error: '이미 사용 중인 이메일이에요.', alreadyRegistered: true };
      }
      return { error: error.message };
    }

    // 이메일 인증이 켜져 있으면 Supabase는 중복 가입을 오류 없이 숨기고,
    // 대신 identities 를 빈 배열로 반환합니다 → 중복으로 판별.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { error: '이미 사용 중인 이메일이에요.', alreadyRegistered: true };
    }

    // 세션이 바로 생기면(이메일 인증 꺼짐) 즉시 로그인 상태 → 인증 대기 불필요.
    return { needsConfirmation: !data.session };
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  },

  resetPassword: async (email) => {
    const supabase = createClient();
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/reset-password`
      : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) return { error: error.message };
    return {};
  },

  updatePassword: async (newPassword) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return {};
  },

  resendConfirmation: async (email) => {
    const supabase = createClient();
    const emailRedirectTo = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo },
    });
    if (error) return { error: error.message };
    return {};
  },

  updateProfile: async (data) => {
    const { user } = get();
    if (!user) return;
    const supabase = createClient();
    const { data: updated } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)
      .select()
      .single();
    if (updated) set({ profile: updated });
  },

  createCouple: async (coupleName, anniversaryDate) => {
    const { user } = get();
    if (!user) return { error: '로그인이 필요합니다.' };
    const supabase = createClient();

    const { data: couple, error } = await supabase
      .from('couples')
      .insert({
        couple_name: coupleName || '우리',
        anniversary_date: anniversaryDate,
        invite_code: randomInviteCode(),
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !couple) return { error: error?.message || '커플 생성에 실패했습니다.' };

    const { error: memberError } = await supabase
      .from('couple_members')
      .insert({ couple_id: couple.id, user_id: user.id });

    if (memberError) return { error: memberError.message };

    await get().loadCouple(user.id);
    return {};
  },

  joinCouple: async (inviteCode) => {
    const { user } = get();
    if (!user) return { error: '로그인이 필요합니다.' };
    const supabase = createClient();

    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .maybeSingle();

    if (!couple) return { error: '초대 코드를 찾을 수 없어요.' };

    const { count } = await supabase
      .from('couple_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('couple_id', couple.id);

    if ((count || 0) >= 2) return { error: '이미 두 명이 연결된 커플이에요.' };

    const { error } = await supabase
      .from('couple_members')
      .insert({ couple_id: couple.id, user_id: user.id });

    if (error) return { error: error.message };

    await get().loadCouple(user.id);
    return {};
  },

  updateCouple: async (data) => {
    const { couple, user } = get();
    if (!couple || !user) return;
    const supabase = createClient();
    const { data: updated } = await supabase
      .from('couples')
      .update(data)
      .eq('id', couple.id)
      .select()
      .single();
    if (updated) set({ couple: updated });
  },
}));
